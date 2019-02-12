'use babel';

import ZestyioAtomPluginView from './zestyio-atom-plugin-view'
import { CompositeDisposable, File, Directory } from 'atom'
import packageConfig from './config-schema.json'
import ZestyLoginView from './zestyio-atom-login-view';
const ZestyioAPIRequests = require('zestyio-api-wrapper')

export default {
  zestyioAtomPluginView: null,
	zestyPackageJSONName: null,
  bottomPanel: null,
	modalPanel: null,
  subscriptions: null,
	fileTypes: [ 'views', 'scripts', 'stylesheets' ],
	packageConfig: packageConfig,
	config: {
		startWithTrayOpen: {
	    description: 'Start with the tray open?',
	    type: 'boolean',
	    default: false
	  },
	  zestyioToken: {
	    description: 'Developer token (currently not available).',
	    type: 'string',
	    default: 'asdf1234xxxxXXXXxxxxXXXXxxxx'
	  },
		developmentMode: {
	    description: 'Sends Console Logs for debugging purposes.',
	    type: 'boolean',
	    default: false
	  },
	  defaultTrayTabOnStart: {
	    type: 'string',
	    default: 'connector-logs',
	    enum: [
	      { value: 'file-context', description: 'File Context' },
				{ value: 'instance-info', description: 'Cloud Instance Info' },
	      { value: 'content-models', description: 'Content Models' },
				{ value: 'connector-logs', description: 'Connector Logs' }
	    ]
		},
	},
	displayDurationMs: 1000, // Default in case config is broken
	activeZestyProject: false,
	zestyConfig: {},
	codeBranch: 'dev',
	apiURL: null,
	token: null,
	basePath: null,
	updating: false,
	zestyJSONDetectionPath: null,
	defaultAccessError: 'Zesty.io: Unable to access the API. Your token may be expired.',
  currentFile: {},

  async activate(state) {
		// connect the UI
  	this.zestyioAtomPluginView = new ZestyioAtomPluginView(state.zestyioAtomPluginViewState)

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable()
		this.basePath = atom.project.getPaths()[0]

		try {
			// look for zesty json directly
			this.zestyJSONDetectionPath = `${this.basePath}/${this.packageConfig.zestyPackageJSONName}`
			const zestyConfigFile = new File(this.zestyJSONDetectionPath)
			const zestyConfigFileExists = await zestyConfigFile.exists()

			if (zestyConfigFileExists) {
				await this.updateTokenFromConfig()
				this.instantiateBottomPanel()
				await this.getInstanceObject()
			}
		} catch (err) {
			this.consoleLog(err)
		}

		this.projectListener = atom.project.onDidChangeFiles(this.fileEventDecisionMaker.bind(this))
		this.subscribeToFileOpen()	
	},

	promptForLogin() {
		this.loginView = new ZestyLoginView()
		this.loginView.open(async (token) => {
			this.zestyConfig.token = token
			await this.writeConfig()
			await this.updateTokenFromConfig()
			this.instantiateBottomPanel()
			await this.getInstanceObject()
		})
	},
	
	async fileEventDecisionMaker(events) {
		for (const event of events) {
			// if zesty.io project is not activated and not updating, check if zesty file was created, kick start zesty project
			if (this.updating === false && this.activeZestyProject === false && (event.action === 'created' || event.action === 'modified') && event.path === this.zestyJSONDetectionPath) {
				await this.updateTokenFromConfig()
				if (this.zestyConfig.hasOwnProperty('instanceZUID') && this.hasOwnProperty('token')) {
					this.instantiateBottomPanel()
					await this.getInstanceObject()
				}
			}

			// if zesty.json exists, then look for all actions on files
			if (this.activeZestyProject) {
				// check if zesty.json is modified, update the token
				if (this.updating === false && event.action === 'modified' && event.path === this.zestyJSONDetectionPath) {
					await this.updateTokenFromConfig()
				}

				// check if zesty.json is deleted, deactivate project
				if ((event.action === 'deleted' || event.action === 'renamed') && event.path === this.zestyJSONDetectionPath) {
					this.activeZestyProject = false
					this.token = null
					this.zestyConfig = {}
					atom.notifications.addWarning('Zesty.io Project Deactivated.')
					this.bottomPanel.destroy()
				}

				// run file saves and comparisons
				// "created", "modified", "deleted", or "renamed"
				const fileBreakdown = this.breakdownZestyPath(event.path)

        // save files in the existing project to the cloud
				if (this.updating === false && event.action === 'modified' && fileBreakdown.isZestyFile) {
					await this.fileSave(fileBreakdown)
				}

				// handle creating new files in the cloud
				this.consoleLog(`Updating: ${this.updating} ${event.path}`)
				if (this.updating === false && event.action === 'created' && this.fileTypes.indexOf(fileBreakdown.fileType) !== -1 ) {
          await this.filePush(fileBreakdown)
				}

        // handle renaming, which runs a put
				if (event.type === 'renamed') {
					console.log(`.. renamed from: ${event.oldPath}`)
				}
			}
		}
	},

	subscribeToFileOpen() {
		const $this = this
		this.subscriptions.add(
			// onDidChangeActiveTextEditor is only available in Atom 1.18.0+.
			atom.workspace.onDidChangeActiveTextEditor ? atom.workspace.onDidChangeActiveTextEditor(function (editor) {
			 return $this.updateFileContent(editor)
			}) : atom.workspace.onDidChangeActivePaneItem(function () {
			 return $this.updateFileContent(atom.workspace.getActiveTextEditor())
		}))
	},

	isInstantiated() {
		return this.zestyConfig.hasOwnProperty('instanceZUID')
	},

	async updateFileContent(editor) {
		if (! this.isInstantiated() || editor === undefined) {
			return
		}

		const currentFile = editor.buffer.file
		const breakdown = this.breakdownZestyPath(currentFile.getPath())

		// load from config if available
		let webEngineRoutes = []

		if (this.zestyConfig.hasOwnProperty(breakdown.fileType)) {
			webEngineRoutes = this.zestyConfig[breakdown.fileType][breakdown.filename].hasOwnProperty('webEngineRoutes') ? this.zestyConfig[breakdown.fileType][breakdown.filename].webEngineRoutes : []
		}

		this.zestyioAtomPluginView.updateFileContext(breakdown, webEngineRoutes) // populate before request

		try {
			webEngineRoutes = await this.getItemsURLs(breakdown)
		} catch(err) {
			this.consoleLog(err)
		}

		// check if its in the config with has prop, if not, fetch into array
		if (breakdown.isZestyFile) {
			this.zestyConfig[breakdown.fileType][breakdown.filename].webEngineRoutes = webEngineRoutes
		}

		this.zestyioAtomPluginView.updateFileContext(breakdown, webEngineRoutes) // populate after the request
		await this.writeConfig() // update the webEngineRoutes
	},

	async getItemsURLs(breakdown) {
		this.consoleLog(breakdown)
		let webEngineRoutes = [{'url': this.zestyConfig.instance.previewURL, 'path': '/', 'name': 'Stage Preview URL'}]
		
		if (breakdown.isZestyFile && breakdown.model !== null) {
			webEngineRoutes = []
			const res = await this.zestyioRequests.getItems(breakdown.model)

			for (const item of res.data) {
				const stageURL = `${this.zestyConfig.instance.previewURL}${item.web.path}`
				webEngineRoutes.push({'url': stageURL, 'path': item.web.path, 'name': item.web.pageTitle})
			}
		}

		return webEngineRoutes
	},

	breakdownZestyPath(path) {
		// this function breaks down a path to see if it lines up to a file on the zesty.io instance
		const breakdown = {}
		breakdown.pathParts = []
		// strip out the base getPath
		breakdown.path = path.replace(this.basePath,'')

		let pathToSplit = (/^(\/|\\)/.test(breakdown.path)) ? breakdown.path.substring(1) : breakdown.path

		// Windows vs Mac
		if (/\\/.test(path)) {
			breakdown.pathParts = pathToSplit.split(/\\/) // windows split
		} else {
			breakdown.pathParts = pathToSplit.split(/\//) // mac linux split
		}

		// assume file name and type to start
		// all zesty files are stored in top level folders: views, stylesheets, and scripts (these represent the types) so we assume part[0] is the type
		breakdown.filename = breakdown.pathParts[breakdown.pathParts.length - 1]
		breakdown.fileType = breakdown.pathParts[0]
    breakdown.fileExt  = breakdown.filename.split('.').pop()
		// if there is more than one part AND the type if a valid zesty type, check if the path represents a zesty.io file
		if (breakdown.pathParts.length > 1 && this.zestyConfig.hasOwnProperty(breakdown.fileType)) {
				breakdown.isZestyFile = this.zestyConfig[breakdown.fileType].hasOwnProperty(breakdown.filename)
				breakdown.zuid = breakdown.isZestyFile ? this.zestyConfig[breakdown.fileType][breakdown.filename].zuid : null
				// if null, check for endpoint (which has a filename that is a fully qualified path)
				if (breakdown.zuid === null) {
					const endpointFileName = breakdown.path.replace(breakdown.fileType, '') //strips out the file type and leaves the path which would be equal to an endpoint
					breakdown.zuid = this.zestyConfig[breakdown.fileType].hasOwnProperty(endpointFileName) ? this.zestyConfig[breakdown.fileType][endpointFileName].zuid : null
					// if its a zesty file, update values
					if (breakdown.zuid !== null) {
						breakdown.isZestyFile = true
						breakdown.filename = endpointFileName
					}
				}

				breakdown.model = breakdown.isZestyFile ? this.zestyConfig[breakdown.fileType][breakdown.filename].model : null
		} else {
			breakdown.isZestyFile = false
			breakdown.zuid = null
			breakdown.model = null
		}

		return breakdown
	},

	async getInstanceObject() {
		try {
				this.updating = true
				this.emitModalMessage('zesty.json configuration file detected') // The loading screen
				// handle request data
        const res = await this.zestyioRequests.getInstance()
				this.changeLoadingText(`Cloud Content Instance ${res.data.name} [${res.data.ZUID}] accessed.`)
  			this.consoleLog(`Connected to Cloud Content Instance ${res.data.name}!`)
  			atom.notifications.addSuccess(`Zesty.io: Connected to Cloud Content Instance ${res.data.name}!.`,{'icon':'zap'})
  			this.zestyConfig.instance = res.data
  			this.zestyConfig.instance.previewURL = this.replaceInURL(this.packageConfig.previewURL, {'RANDOM_HASH':this.zestyConfig.instance.randomHashID})
  			this.zestyConfig.instance.accountsURL = this.replaceInURL(this.packageConfig.accountsURLs.instanceManagement, {'INSTANCE_ZUID':this.zestyConfig.instanceZUID})
        await this.writeConfig()

				// fetch users with access
  			this.consoleLog(`Downloading Users with Access to ${res.data.name}`)
        // get the users on the instance
        const usersResponse = await this.zestyioRequests.getInstanceUsers()
				this.changeLoadingText(`Downloading user access information for ${res.data.name} [${res.data.ZUID}].`)
        this.zestyConfig.instance.users = this.cleanInstanceUsers(usersResponse.data)
        this.zestyioAtomPluginView.updateInstanceInfo(this.zestyConfig.instance)
  			await this.writeConfig()

				// fetch instance models
        this.consoleLog(`Downloading ${res.data.name}'s Content Models.'`)
        const modelsResponse = await this.zestyioRequests.getModels()
				this.changeLoadingText(`Downloading ${res.data.name}'s ${modelsResponse.data.length} content model data references.`)
        this.zestyConfig.instance.models = this.cleanModelsData(modelsResponse.data)
        this.zestyioAtomPluginView.updateContentModels(this.zestyConfig.instance)
        await this.writeConfig()
        this.zestyioAtomPluginView.setMessage(`${res.data.name} [${res.data.ZUID}]`)

				// get file lists
			  await this.getFileLists()
				this.activeZestyProject = true

        // update file context in view
				// attempt to create the file

				// Write config file
				await this.writeConfig()

				this.changeLoadingText(`${res.data.name} Content Instance Synchronized.`)

				// destroy welcome message
				setTimeout(function() {
					this.modalPanel.destroy()
					this.updating = false
				}.bind(this), 2500)
    } catch(err) {
			this.changeLoadingText('Error reading Cloud Content Instance.')
			setTimeout(function() {
				this.modalPanel.destroy()
				this.promptForLogin()
			}.bind(this), 2500)

			atom.notifications.addError('Zesty.io: Developer token expired.', { icon: 'x' })
    }
	},

  cleanInstanceUsers(users) {
		for (let i = 0; i < users.length; i++) {
			delete users[i].ID
			delete users[i].verifiedEmails
			delete users[i].unverifiedEmails
			delete users[i].staff
			delete users[i].authyUserID
			delete users[i].authyEnabled
			delete users[i].authyPhoneCountryCode
			delete users[i].authyPhoneNumber
			delete users[i].signupInfo
			delete users[i].websiteCreator
			delete users[i].prefs
			// overwrite role data with simple role name
			users[i].role = users[i].role.name
		}

		return users
	},
	
	cleanModelsData(models) {
		for (let i = 0; i < models.length; i++) {
			delete models[i].metaTitle
			delete models[i].metaDescription
			delete models[i].sitemapPriority
			delete models[i].canonicalTagMode
			models[i].managerURL = this.buildManagerURL(this.replaceInURL(this.packageConfig.managerURLS.model,{ 'TYPE': models[i].type, 'MODEL_ZUID': models[i].ZUID }) )
			models[i].instantContentURL = this.zestyConfig.instance.previewURL + this.replaceInURL(this.packageConfig.instantContent.model,{ 'MODEL_ZUID': models[i].ZUID })
		}

		return models
	},

	async createFile(relativePath, content) {
		const filePath = this.basePath + relativePath
		const fileBreakdown = this.breakdownZestyPath(filePath)

		try {
			// attempt to create directories if needed
			// -1 to remove the last file part (which is the filename)
			let dir = this.basePath
			for (let i = 0; i < (fileBreakdown.pathParts.length - 1); i++) {
				dir += '/' + fileBreakdown.pathParts[i]
				const newDir = new Directory(dir)
				const exists = await newDir.exists()
				if (!exists) {
					this.consoleLog(`Creating new directory: ${dir}`)
					await newDir.create()
				}
			}

			// attempt to create the file
			let newFile = new File(filePath)
			let exists = await newFile.exists()

			// if file does not exist, we need to create it
			if (! exists) {
					await newFile.create()
					await newFile.write(content)
					this.consoleLog(`File: ${filePath} created successfully.`)
			} else {
				this.consoleLog(`File '${filePath}' already Exists. Not overwriting.`)
			}
		} catch (err) {
				atom.notifications.addError(`Zesty.io: Error in file creation: ${err.reason}`)
				this.consoleLog(err)
		}
	},

	instantiateBottomPanel() {
		this.bottomPanel = atom.workspace.addBottomPanel({
			 item: this.zestyioAtomPluginView.getElement(),
			 visible: true
		 })

		 if (! atom.config.get('zestyio-atom.startWithTrayOpen')) {
			 setTimeout(this.zestyioAtomPluginView.toggleMinimizeTray(), 1000)
		 }
	},

	buildManagerURL(uri) {
		return `${this.replaceInURL(this.packageConfig.managerURL,{'RANDOM_HASH':this.zestyConfig.instance.randomHashID})}${uri}`
	},

	replaceInURL(url, replacementObject) {
		for (const key in replacementObject) {
			url = url.replace(key, replacementObject[key])
		}

		return url
	},

	capitalizeFirstLetter(string) {
	  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`
	},

	async getFileLists(){
		try {
			for (const type of this.fileTypes) {
				const methodName = `get${this.capitalizeFirstLetter(type)}`
				const res = await this.zestyioRequests[methodName]()
				this.changeLoadingText(`Downloading ${type} from Instance ${this.zestyConfig.instance.name}.`)
				this.zestyConfig[type] = {}
				// switch to a map
				for (const dataIndex in res.data) {
					if (res.data[dataIndex].status === this.codeBranch) {
						this.zestyConfig[type][res.data[dataIndex].fileName] = {
							zuid: res.data[dataIndex].ZUID,
							model: res.data[dataIndex].contentModelZUID,
							updatedAt: res.data[dataIndex].updatedAt,
							createdAt: res.data[dataIndex].createdAt
						}
						let path = `/${type}/${res.data[dataIndex].fileName}`
						path = path.replace('//','/')
						await this.createFile(path, res.data[dataIndex].code)
					}
				}

				await this.writeConfig()
				atom.notifications.addSuccess(`Zesty.io: Pulled down ${type} to the /${type}/ directory.`,{'icon':'cloud-download'})
			}
		} catch (err){
			this.consoleLog(err)
			atom.notifications.addError("Zesty.io: "+ err.reason)
		}
	},

	emitModalMessage(message) {
		if (this.modalPanel) {
			this.modalPanel.destroy()
		}

		this.modalPanel = atom.workspace.addModalPanel({
			item: this.createModalElement(message),
			visible: true
		})
	},

	createModalElement(innerText) {
	  // create a new div element
	  const messageDiv = document.createElement('div')

    messageDiv.className = 'zestyWelcome'
		// zesty logo in it
		const zestyLogo = document.createElement('img')
		zestyLogo.src = this.packageConfig.zestyWhiteUprightLogo
		zestyLogo.className = 'zLogo'

		// message content
	  const loadingMessage = document.createElement('p')
		loadingMessage.className = 'zLoadingText'
    loadingMessage.innerHTML = innerText

    // ones and zeros
    this.onesAndZeros = document.createElement('div')
		this.onesAndZeros.className = 'onesAndZeros'

		const animateInterval = 100
		for (let i = 0; i < 150; i++) {
				this.animateWelcome(i * animateInterval)
		}

	  // add the text node to the newly created div
    messageDiv.appendChild(this.onesAndZeros)
    messageDiv.appendChild(zestyLogo)
    messageDiv.appendChild(loadingMessage)

		return messageDiv
	},

	changeLoadingText(text) {
		const loadingTextEl = document.querySelector('.zLoadingText')
		loadingTextEl.innerHTML = text
	},

	animateWelcome(increment) {
		setTimeout(function() {
			let onesAndZerosText = ''
			for (let i = 0; i < 5000; i++) {
				onesAndZerosText = `${onesAndZerosText}${(Math.random() > 0.5) ? 1 : 0}`
			}

			this.onesAndZeros.innerHTML = onesAndZerosText
		}.bind(this), increment)
	},

	async writeConfig() {
		try {
			const configFile = new File(`${this.basePath}/${this.packageConfig.zestyPackageJSONName}`)
			this.zestyConfig.lastUpdated = Date.now()
			await configFile.write(JSON.stringify(this.zestyConfig, null, '\t'))
		} catch(err) {
			atom.notifications.addError(`Failed to read ${this.packageConfig.zestyPackageJSONName}: ${err.message}`, { icon: 'x' })
		}
	},

	async updateTokenFromConfig() {
		try {
			const configFile = new File(`${this.basePath}/${this.packageConfig.zestyPackageJSONName}`)
			let configContent = await configFile.read(false)
			configContent = JSON.parse(configContent)

			if (configContent.hasOwnProperty('token') && configContent.hasOwnProperty('instanceZUID')) {
				if (configContent.token !== this.token) {
  				atom.notifications.addSuccess(`Zesty.io: Updated Developer Token.`, { icon:'key'})
          this.token = configContent.token
          this.zestyConfig.token = this.token
          this.zestyConfig.instanceZUID = configContent.instanceZUID

          this.zestyConfig.lastUpdated = Date.now()
  				this.zestyioRequests = new ZestyioAPIRequests(this.zestyConfig.instanceZUID, this.token)
        }
			} else {
				// TODO SIMON THIS SHOULD BE A CALL TO LOGIN?
				this.zestyConfig = configContent
				this.promptForLogin()
			}
		} catch(err) {
			// TODO SIMON THIS SHOULD BE A CALL TO LOGIN?
			// AND REPLACE THE ERROR BELOW
			atom.notifications.addError('Please ensure you have an object with instanceZUID: and token: properties', { icon: 'x' })
		}
	},

	subscribeToConfigChanges() {
		const subscriptions = new CompositeDisposable()
		const $this = this

		// TODO listen to zesty config for it to change
		const zestyConfigObserver = atom.config.observe(
			'zestyio-atom.zestyConfig',
			(value) => {
				$this.consoleLog('Zesty.io config changed')
			})

		subscriptions.add(zestyConfigObserver)
		this.subscriptions.add(subscriptions)
	},

	async fileSave(fileBreakdown) {
		try {
			// need to check for file types here, if in views, or styles, then check their array
			const editor = atom.workspace.getActiveTextEditor()
		  if (editor) {
		    const content = editor.getText()
				const payload = { filename: fileBreakdown.filename, code: content }

				if (fileBreakdown.isZestyFile) {
					let methodName = `save${this.capitalizeFirstLetter(fileBreakdown.fileType)}`
					methodName = methodName.substring(0, methodName.length - 1) // knock off the s

					const res = await this.zestyioRequests[methodName](fileBreakdown.zuid, payload)

					this.consoleLog(`${fileBreakdown.fileType} ${fileBreakdown.filename} saved to the Zesty.io Cloud Instance ${this.zestyConfig.instanceZUID}`)
					atom.notifications.addSuccess(`Zesty.io: ${fileBreakdown.filename} saved to cloud instance`,{ icon: 'cloud-upload'})
					// reload live preview
		    }
			}
		} catch(error) {
				atom.notifications.addWarning(error.reason)
		}
	},

	async filePush(fileBreakdown) {
		try {
      const filePath = `${this.basePath}${fileBreakdown.path}`
      const thisFile = new File(filePath)
      const fileContents = await thisFile.read(false)

			const payload = {
				filename: fileBreakdown.filename,
				code: fileContents
				//,"status": this.codeBranch
			}

      // if its a view and has a file name with a path involved, it becomes an endpoints
			if (fileBreakdown.fileType === 'views' && /\//.test(fileBreakdown.filename)) {
				payload.type = 'ajax-json'
			}
      if (fileBreakdown.fileType === 'scripts') {
				payload.type = 'text/javascript'
			}

      if (fileBreakdown.fileType === 'stylesheets') {
				payload.type = `text/${fileBreakdown.fileExt}`
			}

			let methodName = 'create' + this.capitalizeFirstLetter(fileBreakdown.fileType)
			methodName = methodName.substring(0, methodName.length - 1) // knock off the s

			const res = await this.zestyioRequests[methodName](payload)

      // update the config file map
      this.zestyConfig[fileBreakdown.fileType][fileBreakdown.filename] = {
        zuid: res.data.ZUID,
  			model: res.data.contentModelZUID,
  			updatedAt: res.data.updatedAt,
  			createdAt: res.data.createdAt
      }

      await this.writeConfig()
			this.consoleLog(`${fileBreakdown.fileType} ${fileBreakdown.filename} pushed to the Zesty.io Cloud Instance ${this.zestyConfig.instanceZUID}`)
			atom.notifications.addSuccess(`Zesty.io: ${fileBreakdown.filename} pushed to cloud instance`, { icon:'cloud-upload'})
			// reload live preview
		} catch(error) {
				atom.notifications.addWarning(`Zesty.io: Error creating file: ${fileBreakdown.filename}`)
		}
	},

  serialize() {
    return {
      zestyioAtomPluginViewState: this.zestyioAtomPluginView.serialize()
    }
	},
	
	consoleLog(mixed) {
		if (atom.config.get('zestyio-atom.developmentMode')) {
			console.log(mixed)
		}

		if (typeof mixed === "string") {
			this.zestyioAtomPluginView.writeLog(mixed)
		}
	},

	deactivate() {
    this.modalPanel.destroy()
		this.bottomPanel.destroy()
    this.subscriptions.dispose()
		this.projectListener.dispose()
    this.zestyioAtomPluginView.destroy()
  }
}
