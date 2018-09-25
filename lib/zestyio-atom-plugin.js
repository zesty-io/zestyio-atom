'use babel';

import ZestyioAtomPluginView from './zestyio-atom-plugin-view';
import { CompositeDisposable, File, Directory } from 'atom';
const request = require('request').defaults({strictSSL: false})
import packageConfig from './config-schema.json';

export default {

  zestyioAtomPluginView: null,
	zestyPackageJSONName: null,
  bottomPanel: null,
	modalPanel: null,
  subscriptions: null,
	packageConfig: packageConfig,
	config: {
		"startWithTrayOpen": {
	    "description": "Start with the tray open?",
	    "type": "boolean",
	    "default": false
	  },
	  "zestyioToken": {
	    "description": "Developer token (currently not available).",
	    "type": "string",
	    "default": "asdf1234xxxxXXXXxxxxXXXXxxxx"
	  },
		"developmentMode": {
	    "description": "Sends Console Logs for debugging purposes.",
	    "type": "boolean",
	    "default": false
	  },
	  "defaultTrayTabOnStart": {
	    "type": "string",
	    "default": "connector-logs",
	    "enum": [
	      {value: "file-context", description: "File Context"},
				{value: "instance-info", description: "Cloud Instance Info"},
	      {value: "content-models", description: "Content Models"},
				{value: "connector-logs", description: "Connector Logs"}
	    ]
		},
	},
	displayDurationMs: 1000, // Default in case config is broken
	activeZestyProject: false,
	zestyConfig: {},
	codeBranch: 'dev',
	apiURL: null,
	token: null,
	defaultAccessError: "Zesty.io: Unable to access the API. Your token may be expired.",
  currentFile: {},

  activate(state) {
		// connect the UI
  	this.zestyioAtomPluginView = new ZestyioAtomPluginView(state.zestyioAtomPluginViewState);

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		let entries
		let dirs = atom.project.getDirectories();
		let basePath = atom.project.getPaths()[0];
		// pull the zesty.json name from the plugin config, this test will be used to find the file
		let fileTest = new RegExp('^'+this.packageConfig.zestyPackageJSONName+'$');
		let $this = this;

		// loop through directories to look for the zesty json file
	 for (dirIndex in dirs) {

		 entries = dirs[dirIndex].getEntriesSync()

		 // loop through files
		 for (entryIndex in entries) {

			 // check for the json config file
			 if(fileTest.test(entries[entryIndex].getBaseName())){

				 $this.activeZestyProject = true;
				 let findMessage = "Zesty.io config file discovered"
				 $this.emitModalMessage(findMessage + ': ' +  entries[entryIndex].path);
				 //$this.consoleLog();
				 // read the json config
				 entries[entryIndex].onDidChange(function(){console.log('changed')})

				 entries[entryIndex].read(false).then(function(value) {

						$this.zestyConfig = JSON.parse(value);

						$this.token = $this.zestyConfig.token;
						//$this.zestyConfig.token = null;
						$this.makeAPIURL();
						$this.instantiateBottomPanel();
						$this.getInstanceObject();


					}).catch(
        		// Log the rejection reason
       			(reason) => {
            	$this.emitModalMessage('Failed to read '+this.packageConfig.zestyPackageJSONName+': '+reason);
        	});

			 }

		 }
	 }

	 	this.subscribeToFileSave();
 		this.subscribeToFileOpen();
		this.subscribeToConfigChanges();

  },
	subscribeToFileSave(){
		// Register event to watch save and show the encouragement.
 	 this.subscriptions.add(
 	 	atom.workspace.observeTextEditors(editor => {
 	 		const savedSubscription = editor.onDidSave(event => this.fileSave());
 	 		this.subscriptions.add(savedSubscription);
 	 		this.subscriptions.add(editor.onDidDestroy(() => savedSubscription.dispose()));
 	 	}));


	},
	subscribeToFileOpen(){
		let $this = this;
		this.subscriptions.add(
			// onDidChangeActiveTextEditor is only available in Atom 1.18.0+.
			atom.workspace.onDidChangeActiveTextEditor ? atom.workspace.onDidChangeActiveTextEditor(function (editor) {
			 return $this.updateFileContent(editor);
			}) : atom.workspace.onDidChangeActivePaneItem(function () {
			 return $this.updateFileContent(atom.workspace.getActiveTextEditor());
		}));
	},
	isInstantiated(){
		return this.zestyConfig.hasOwnProperty('instanceZUID');
	},
	updateFileContent(editor){
		if(!this.isInstantiated() || editor == undefined) return;
		let currentFile = editor.buffer.file
		let breakdown = this.breakdownZestyPath(currentFile.getPath())
		this.zestyioAtomPluginView.updateFileContext(breakdown);

	},
	breakdownZestyPath(path){
		// this function breaks down a path to see if it lines up to a file on the zesty.io instance
		let breakdown = {};
		breakdown.pathParts = [];
		// strip out the base getPath
		breakdown.path = path.replace(atom.project.getPaths()[0],'').substring(1);

		// Windows vs Mac
		if(/\\/.test(path)){
			breakdown.pathParts = breakdown.path.split(/\\/); // windows split
		} else {
			breakdown.pathParts = breakdown.path.split(/\//); // mac linux split
		}

		// assume file name and type to start
		// all zesty files are stored in top level folders: views, stylesheets, and scripts (these represent the types) so we assume part[0] is the type
		breakdown.filename = breakdown.pathParts[breakdown.pathParts.length-1];
		breakdown.fileType = breakdown.pathParts[0];

		// if there is more than one part AND the type if a valid zesty type, check if the path represents a zesty.io file
		if(breakdown.pathParts.length > 1 && this.zestyConfig.hasOwnProperty(breakdown.fileType)) {

				breakdown.isZestyFile = this.zestyConfig[breakdown.fileType].hasOwnProperty(breakdown.filename)
				breakdown.zuid = breakdown.isZestyFile ? this.zestyConfig[breakdown.fileType][breakdown.filename].zuid : null
				// if null, check for endpoint (which has a filename that is a fully qualified path)
				if(breakdown.zuid == null){
					let endpointFileName = breakdown.path.replace(breakdown.fileType,''); //strips out the file type and leaves the path which would be equal to an endpoint
					breakdown.zuid = this.zestyConfig[breakdown.fileType].hasOwnProperty(endpointFileName) ? this.zestyConfig[breakdown.fileType][endpointFileName].zuid : null
					// if its a zesty file, update values
					if(breakdown.zuid != null){
						breakdown.isZestyFile = true;
						breakdown.filename = endpointFileName;
					}
				}
				breakdown.model = breakdown.isZestyFile ? this.zestyConfig[breakdown.fileType][breakdown.filename].model : null

		} else {
			breakdown.isZestyFile = false;
			breakdown.zuid = null;
			breakdown.model = null;
		}
		this.consoleLog(breakdown);
		return breakdown;

	},
	async getInstanceObject(){

		let instanceGET = this.buildAPIURL(this.packageConfig.apiEndpoints.instanceGET, "accounts");
		instanceGET = this.replaceInURL(instanceGET,{'INSTANCE_ZUID': this.zestyConfig.instanceZUID});

		try {

				// handle request data
        let response = await this.getRequest(instanceGET);
  			let res = JSON.parse(response)
  			this.consoleLog(`Connected to Cloud Content Instance ${res.data.name}!`);
  			atom.notifications.addSuccess(`Zesty.io: Connected to Cloud Content Instance ${res.data.name}!.`,{'icon':'zap'})
  			this.zestyConfig.instance = res.data;
  			this.zestyConfig.instance.previewURL = this.replaceInURL(this.packageConfig.previewURL, {'RANDOM_HASH':this.zestyConfig.instance.randomHashID});
  			this.zestyConfig.instance.accountsURL = this.replaceInURL(this.packageConfig.accountsURLs.instanceManagement, {'INSTANCE_ZUID':this.zestyConfig.instanceZUID});
        this.writeConfig();

				// handle users with access
  			this.consoleLog(`Downloading Users with Access to ${res.data.name}`);
        // get the users on the instance
        let instanceUsersAPIURL = this.replaceInURL( this.buildAPIURL(this.packageConfig.apiEndpoints.instanceUsersGET,"accounts"), {'INSTANCE_ZUID':this.zestyConfig.instance.ZUID});
        let usersResponse = await this.getRequest(instanceUsersAPIURL)
        usersResponse = JSON.parse(usersResponse);
        this.zestyConfig.instance.users = this.cleanInstanceUsers(usersResponse.data);
        this.zestyioAtomPluginView.updateInstanceInfo(this.zestyConfig.instance);
  			this.writeConfig();

				// handle models
        this.consoleLog(`Downloading ${res.data.name}'s Content Models.'`);
        let modelsResponse = await this.getRequest( this.buildAPIURL(this.packageConfig.apiEndpoints.modelsGET) );
        modelsResponse = JSON.parse(modelsResponse);
        this.zestyConfig.instance.models = this.cleanModelsData(modelsResponse.data);
        this.zestyioAtomPluginView.updateContentModels(this.zestyConfig.instance);
        this.writeConfig();
        this.zestyioAtomPluginView.setMessage(`${res.data.name} [${res.data.ZUID}]`);

				// get file lists
			  this.getFileLists();

    } catch(err) {
			this.consoleLog(err);
      atom.notifications.addError("Zesty.io: Developer token expired.",{'icon':'x'})

    }

	},
  cleanInstanceUsers(users){
			for (var i = 0; i < users.length; i++) {
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
			return users;
  },
	cleanModelsData(models){
		for (var i = 0; i < models.length; i++) {
			delete models[i].metaTitle
			delete models[i].metaDescription
			delete models[i].sitemapPriority
			delete models[i].canonicalTagMode
			models[i].managerURL = this.buildManagerURL(this.replaceInURL(this.packageConfig.managerURLS.model,{'TYPE': models[i].type, 'MODEL_ZUID': models[i].ZUID}) );
			models[i].instantContentURL = this.zestyConfig.instance.previewURL + this.replaceInURL(this.packageConfig.instantContent.model,{'MODEL_ZUID': models[i].ZUID})
		}
		return models;
	},
	createFile(relativePath, content) {
		let filePath = atom.project.getPaths()[0]  + relativePath
		$this = this;
		let newFile = new File(filePath);
		newFile.exists().then(function(exists){
			if (!exists){
				newFile.create().then(function(exists){
						$this.consoleLog(`Creating new file: ${filePath}`);
						newFile.write(content).then(function(){
							$this.consoleLog(`File: ${filePath} created successfully.`);
						}).catch(function(error){
							$this.consoleLog(error)
						})
				}).catch(function(error){
					$this.consoleLog(error)
				})
			} else {
				$this.consoleLog(`File '${filePath}' Already Exists. Not overwriting.`);
			}

		}).catch(function(error){
			$this.consoleLog(error)
		})


	},
	instantiateBottomPanel(){
		this.bottomPanel = atom.workspace.addBottomPanel({
			 item: this.zestyioAtomPluginView.getElement(),
			 visible: true
		 });
		 if(!atom.config.get('zestyio-atom.startWithTrayOpen')){
			 setTimeout(this.zestyioAtomPluginView.toggleMinimizeTray(),1000);
		 }

	},
	makeAPIURL(){
		this.apiURL = this.replaceInURL(this.packageConfig.instancesAPIURL, {'INSTANCE_ZUID':this.zestyConfig.instanceZUID});
		$this.consoleLog(`Building API base for ${this.zestyConfig.instanceZUID}: ${this.apiURL}`);
	},
	buildAPIURL(uri, api){
		let built = (api == "accounts") ? this.packageConfig.accountsAPIURL + uri : this.apiURL + uri;
		$this.consoleLog('Making a request to: ' + built)
		return built
	},
	buildManagerURL(uri){
		return this.replaceInURL(this.packageConfig.managerURL,{'RANDOM_HASH':this.zestyConfig.instance.randomHashID}) + uri
	},
	replaceInURL(url, replacementObject){
		for (var key in replacementObject) {
			url = url.replace(key, replacementObject[key])
		}
		return url
	},
	async getFileLists(){

		let fileTypes = ['views','scripts','stylesheets'];

		try {
			for (var i = 0; i < fileTypes.length; i++) {
				let type = fileTypes[i];
				let newDir = new Directory(atom.project.getPaths()[0]+'/'+type);
				await newDir.create();
				let apiGetRequestURL = this.buildAPIURL(this.packageConfig.apiEndpoints[type+'GET'])
				let apiReponse = await this.getRequest(apiGetRequestURL)
				let res = JSON.parse(apiReponse);
				this.zestyConfig[type] = {};
				for(dataIndex in res.data){
					if(res.data[dataIndex].status == this.codeBranch){
						this.zestyConfig[type][res.data[dataIndex].fileName] = {zuid: res.data[dataIndex].ZUID, model: res.data[dataIndex].contentModelZUID };
						let path = `/${type}/${res.data[dataIndex].fileName}`;
						path = path.replace('//','/');
						$this.createFile(path, res.data[dataIndex].code);
					}
				}
				this.writeConfig();
				atom.notifications.addSuccess(`Zesty.io: Pulled down ${type} to the /${type}/ directory.`,{'icon':'cloud-download'})
			}
		} catch (err){
			this.consoleLog(error)
			atom.notifications.addError("Zesty.io: "+ error.reason)
		}

		// update file context
		this.updateFileContent(atom.workspace.getActiveTextEditor())

	},
	emitModalMessage(message){

		if(this.modalPanel) this.modalPanel.destroy();

		this.modalPanel = atom.workspace.addModalPanel({
			item: this.createModalElement(message),
			visible: true
		});

		let $this = this;
		setTimeout(function(){
			$this.modalPanel.destroy();
		},1500)

	},
	createModalElement (innerText) {
	  // create a new div element
	  var messageDiv = document.createElement("div");
		messageDiv.style.cssText = "height: 32px; padding: 10px; font-weight: bold";
		// zesty logo in it
		var zestyLogo = document.createElement("img");
		zestyLogo.src = this.packageConfig.zestyWhiteLogo;
		zestyLogo.align="left";
		zestyLogo.width="24";
		zestyLogo.style.cssText = "margin-right: 10px; width: 24px;";

		// message content
	  var messageContent = document.createTextNode(innerText);

	  // add the text node to the newly created div
		messageDiv.appendChild(zestyLogo);
		messageDiv.appendChild(messageContent);

		return messageDiv;
	},
  deactivate() {
    this.modalPanel.destroy();
		this.bottomPanel.destroy();
    this.subscriptions.dispose();
    this.zestyioAtomPluginView.destroy();
  },
	writeConfig(){
		$this = this;

    let configFilePath = atom.project.getPaths()[0]  + '/' + this.packageConfig.zestyPackageJSONName;
		let configFile = new File(configFilePath);

    this.consoleLog(`Looking for package name: ${this.packageConfig.zestyPackageJSONName}`);

		configFile.write(JSON.stringify(this.zestyConfig, null, '\t')).then(function(result){
			$this.consoleLog(result)
		}).catch(function(error){
			$this.consoleLog(error)
		})
	},
	subscribeToConfigChanges() {
		const subscriptions = new CompositeDisposable();
		$this = this;

		// TODO listen to zesty config for it to change
		const zestyConfigObserver = atom.config.observe(
			'zestyio-atom.zestyConfig',
			(value) => {
				$this.consoleLog('Zesty.io config changed');
				$this.consoleLog(value)
			});
		subscriptions.add(zestyConfigObserver);

		this.subscriptions.add(subscriptions);

	},
	fileSave() {
		if(!this.isInstantiated()){ return; }

		let editor

		// need to check for file types here, if in views, or styles, then check their array
	  if (editor = atom.workspace.getActiveTextEditor()) {
	    let content = editor.getText()

			let fileBreakdown = this.breakdownZestyPath(editor.getPath());

	    let payload = {"filename": fileBreakdown.filename, "code": content};

			var $this = this;

			if(fileBreakdown.isZestyFile){

				let uri = `/web/${fileBreakdown.fileType}/${fileBreakdown.zuid}`;
				let putURL = this.buildAPIURL(uri);

				this.putRequest(putURL,payload).then((html) => {
					$this.consoleLog(`${fileBreakdown.fileType} ${fileBreakdown.filename} saved to the Zesty.io Cloud Instance ${$this.zestyConfig.instanceZUID}`);
					atom.notifications.addSuccess(`Zesty.io: ${fileBreakdown.filename} saved to cloud instance`,{'icon':'cloud-upload'})
					// reload live preview
	      }).catch((error) => {
	        atom.notifications.addWarning(error.reason)
	      })

			}

	  }
	},
  serialize() {
    return {
      zestyioAtomPluginViewState: this.zestyioAtomPluginView.serialize()
    };
  },
  fetch() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText()
      this.getRequest(selection).then((html) => {
        editor.insertText(html)
      }).catch((error) => {
        atom.notifications.addWarning(error.reason)
      })
    }
  },
	getRequest(url) {
		$this = this
    return new Promise((resolve, reject) => {

      request.get(url, {
			  'auth': {
			    'bearer': $this.token
			  }
			}, (error, response, body) => {

        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {

          reject({
            reason: $this.defaultAccessError
          })
        }
      })
    })
  },
	putRequest(url,payload) {
		$this = this
    return new Promise((resolve, reject) => {

      request.put({
				'url' : url,
				'body': JSON.stringify(payload),
			  'auth': {
			    'bearer': $this.token
			  }
			}, (error, response, body) => {

				body = JSON.parse(body);
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {
					$this.consoleLog('Request failed: ' + body.error)
          reject({
            reason: $this.defaultAccessError
          })
        }
      })
    })
  },
	consoleLog(mixed){
		if(atom.config.get('zestyio-atom.developmentMode')) console.log(mixed);
		if(typeof mixed == "string") this.zestyioAtomPluginView.writeLog(mixed);
	}

};
