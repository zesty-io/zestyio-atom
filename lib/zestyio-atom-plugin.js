'use babel';

import ZestyioAtomPluginView from './zestyio-atom-plugin-view';
import { CompositeDisposable, File } from 'atom';
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
	  "zestyioToken": {
	    "description": "Developer token (currently not available).",
	    "type": "string",
	    "default": "asdf1234xxxxXXXXxxxxXXXXxxxx"
	  },
		"developmentMode": {
	    "description": "Sends Console Logs for debugging purposes.",
	    "type": "boolean",
	    "default": false
	  }
	},
	displayDurationMs: 1000, // Default in case config is broken
	activeZestyProject: false,
	zestyConfig: {},
	codeBranch: 'dev',
	apiURL: null,
	token: null,

  activate(state) {
  	this.zestyioAtomPluginView = new ZestyioAtomPluginView(state.zestyioAtomPluginViewState);

		let entries
		let dirs = atom.project.getDirectories();
		let basePath = atom.project.getPaths()[0];
		// pull the zesty.json name from the plugin config, this test will be used to find the file
		let fileTest = new RegExp('^'+this.packageConfig.zestyPackageJSONName+'$');
		let $this = this

		// loop through directories to look for the zesty json file
	 for (dirIndex in dirs) {

		 entries = dirs[dirIndex].getEntriesSync()

		 // loop through files
		 for (entryIndex in entries) {

			 // check for the json config file
			 if(fileTest.test(entries[entryIndex].getBaseName())){

				 $this.activeZestyProject = true;
				 $this.emitModalMessage("Found Zesty.io config file.");

				 // read the json config
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


	 // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
	 this.subscriptions = new CompositeDisposable();

	 // Register event to watch save and show the encouragement.
	 this.subscriptions.add(
		 atom.workspace.observeTextEditors(editor => {
			 const savedSubscription = editor.onDidSave(event => this.fileSave());
			 this.subscriptions.add(savedSubscription);
			 this.subscriptions.add(editor.onDidDestroy(() => savedSubscription.dispose()));
		 }));

	 	this.subscriptions.add(this.subscribeToConfigChanges());
	  this.subscribeToFileOpen();

  },
	subscribeToFileOpen(){
		let zuid = 'test';
		let $this = this;
		this.subscriptions.add(
			// onDidChangeActiveTextEditor is only available in Atom 1.18.0+.
			atom.workspace.onDidChangeActiveTextEditor ? atom.workspace.onDidChangeActiveTextEditor(function (editor) {
			 return $this.updateStatusTileScope(zuid, editor);
			}) : atom.workspace.onDidChangeActivePaneItem(function () {
			 return $this.updateStatusTileScope(zuid, atom.workspace.getActiveTextEditor());
		}));


	},

	updateStatusTileScope(text, editor){
  	this.consoleLog(text)
		this.consoleLog(editor)


	},
	getInstanceObject(){

		let instanceGET = this.buildAPIURL(this.packageConfig.apiEndpoints.instanceGET,"accounts");
		instanceGET = instanceGET.replace('INSTANCE_ZUID',this.zestyConfig.instanceZUID);

		$this.consoleLog(instanceGET);
		this.getRequest(instanceGET).then((response) => {
			let res = JSON.parse(response)
			$this.zestyConfig.instance = res.data;
			$this.writeConfig();
			atom.notifications.addSuccess(`Zesty.io: Connected to Cloud Content Instance ${res.data.name}!.`,{'icon':'zap'})
			$this.getFileLists();
		}).catch((error) => {
			atom.notifications.addError("Zesty.io: Developer token expired.",{'icon':'x'})
		})

	},

	createFile(relativePath, content) {
		let filePath = atom.project.getPaths()[0]  + relativePath
		$this = this;
		let newFile = new File(filePath);

		newFile.write(content).then(function(){
			newFile.create().then(function(exists){
				if (exists){
					$this.consoleLog('File Already Exists. Not overwritting.');
				} else {
					$this.consoleLog('Creating new file');
				}
			}).catch(function(error){
				$this.consoleLog(error)
			})

		}).catch(function(error){
			$this.consoleLog(error)
		})

	},
	instantiateBottomPanel(){
		this.bottomPanel = atom.workspace.addBottomPanel({
			 item: this.zestyioAtomPluginView.getElement(),
			 visible: true
		 });

	},
	makeAPIURL(){
		console.log(this.packageConfig.instancesAPIURL)
		this.apiURL = this.packageConfig.instancesAPIURL.replace('INSTANCE_ZUID',this.zestyConfig.instanceZUID)
		console.log(this.apiURL)
	},
	buildAPIURL(uri, api){
		return (api == "accounts") ? this.packageConfig.accountsAPIURL + uri : this.apiURL + uri;
	},
	getFileLists(){
		let $this = this;
		let viewsGet = this.buildAPIURL(this.packageConfig.apiEndpoints.viewsGET)
		this.getRequest(viewsGet).then((response) => {
			let res = JSON.parse(response);
			$this.zestyConfig.views = {};
			for(dataIndex in res.data){
				if(res.data[dataIndex].status == $this.codeBranch){
					$this.zestyConfig.views[res.data[dataIndex].fileName] = {zuid: res.data[dataIndex].ZUID, model: res.data[dataIndex].contentModelZUID };
					$this.createFile('/views/'+res.data[dataIndex].fileName, res.data[dataIndex].code);
				}
			}
			$this.writeConfig();
			atom.notifications.addSuccess("Zesty.io: Pulled down views to the views/ directory.",{'icon':'cloud-download'})
		}).catch((error) => {
			atom.notifications.addWarning(error.reason)
		})

		// stylesheets
		let stylesGet = this.buildAPIURL(this.packageConfig.apiEndpoints.stylesheetsGET)
		this.getRequest(stylesGet).then((response) => {
			let res = JSON.parse(response);
			$this.zestyConfig.stylesheets = {};
			for(dataIndex in res.data){
				if(res.data[dataIndex].status == $this.codeBranch){
					$this.zestyConfig.stylesheets[res.data[dataIndex].fileName] = {zuid: res.data[dataIndex].ZUID, fileType: res.data[dataIndex].fileType };
					$this.createFile('/stylesheets/'+res.data[dataIndex].fileName, res.data[dataIndex].code);
				}
			}
			$this.writeConfig();
			atom.notifications.addSuccess("Zesty.io: Pulled down to the stylessheets/ directory.",{'icon':'cloud-download'})
		}).catch((error) => {
			atom.notifications.addWarning(error.reason)
		})

		// scripts
		let scriptsGet = this.buildAPIURL(this.packageConfig.apiEndpoints.scriptsGET)
		this.getRequest(scriptsGet).then((response) => {
			let res = JSON.parse(response);
			$this.zestyConfig.scripts = {};
			for(dataIndex in res.data){
				if(res.data[dataIndex].status == $this.codeBranch){
					$this.zestyConfig.scripts[res.data[dataIndex].fileName] = {zuid: res.data[dataIndex].ZUID, fileType: res.data[dataIndex].fileType };
					$this.createFile('/scripts/'+res.data[dataIndex].fileName, res.data[dataIndex].code);
				}
			}
			$this.writeConfig();
			atom.notifications.addSuccess("Zesty.io: Pulled down scripts to the scripts/ directory.",{'icon':'cloud-download'})
		}).catch((error) => {
			atom.notifications.addWarning(error.reason)
		})
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
		this.consoleLog(atom.project.getPaths());

		let configFilePath = atom.project.getPaths()[0]  + '/zesty.json';
		this.consoleLog(configFilePath);

		let configFile = new File(configFilePath);

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
				$this.consoleLog('zesty config chnge');
				$this.consoleLog(value)
			});
		subscriptions.add(zestyConfigObserver);

		return subscriptions;
	},

	fileSave() {
		this.consoleLog('invoked due to a document save!');
		let editor

		// need to check for file types here, if in views, or styles, then check their array
	  if (editor = atom.workspace.getActiveTextEditor()) {
	    let content = editor.getText()
			let parts = [];
			// Windows vs Mac
			if(/\\/.test(editor.getPath())){
				// windows split
				parts = editor.getPath().split(/\\/);
			} else {
				// mac linux split
				parts = editor.getPath().split(/\//);
			}

			this.consoleLog(editor.getPath());
			let filename = parts[parts.length-1];
      let fileType = "views";
      if(/scripts(\/|\\)/.test(editor.getPath())) fileType = "scripts";
      if(/stylesheets(\/|\\)/.test(editor.getPath())) fileType = "stylesheets";

	    let payload = {"filename": filename, "code": content};

			this.consoleLog(payload)
			this.consoleLog(fileType)

			if(this.zestyConfig[fileType].hasOwnProperty(filename)){
				let fileZUID = this.zestyConfig[fileType][filename].zuid;
				let uri = `/web/${fileType}/${fileZUID}`;
				let putURL = this.buildAPIURL(uri);
				this.consoleLog(putURL)
				this.putRequest(putURL,payload).then((html) => {
					atom.notifications.addSuccess(`Zesty.io: ${filename} saved to cloud instance`,{'icon':'cloud-upload'})
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

	toggle() {
	  let editor
	  if (editor = atom.workspace.getActiveTextEditor()) {
	    let selection = editor.getSelectedText()
	    this.fetch(selection)
	  }
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
            reason: 'Unable to access the api'
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
				$this.consoleLog(response)
				$this.consoleLog(body)
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {

          reject({
            reason: 'Unable to access the api'
          })
        }
      })
    })
  },
	consoleLog(mixed){
		if(atom.config.get('zestyio-atom.developerMode')) console.log(mixed);
	}

};
