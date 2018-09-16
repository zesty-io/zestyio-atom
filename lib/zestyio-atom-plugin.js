'use babel';

import ZestyioAtomPluginView from './zestyio-atom-plugin-view';
import { CompositeDisposable } from 'atom';
const request = require('request').defaults({strictSSL: false})
import packageConfig from './config-schema.json';


export default {

  zestyioAtomPluginView: null,
  bottomPanel: null,
	modalPanel: null,
  subscriptions: null,
	config: packageConfig,
	displayDurationMs: 1000, // Default in case config is broken
	activeZestyProject: false,
	zestyConfig: null,
	apiURL: null,

  activate(state) {
  	this.zestyioAtomPluginView = new ZestyioAtomPluginView(state.zestyioAtomPluginViewState);

		let entries
		let dirs = atom.project.getDirectories();
		let basePath = atom.project.getPaths()[0];
		// pull the zesty.json name from the plugin config, this test will be used to find the file
		let fileTest = new RegExp('^'+this.config.zestyPackageJSONName+'$');
		let $this = this

		// loop through directories to look for the zesty json file
	 for (dirIndex in dirs) {

		 entries = dirs[dirIndex].getEntriesSync()

		 // loop through files
		 for (entryIndex in entries) {

			 // check for the json config file
			 if(fileTest.test(entries[entryIndex].getBaseName())){

				 $this.activeZestyProject = true;
				 $this.emitModalMessage("Found zesty.io config file.");

				 // read the json config
				 entries[entryIndex].read(false).then(function(value) {

						$this.zestyConfig = JSON.parse(value);
						$this.emitModalMessage("Found zesty.io config file.");
						$this.makeAPIURL()
						$this.getFileLists()
					}).catch(
        		// Log the rejection reason
       			(reason) => {
            	$this.emitModalMessage('Failed to read '+this.config.zestyPackageJSONName+': '+reason);
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

  },
	instantiateBottomPanel(){
		this.bottomPanel = atom.workspace.addBottomPanel({
			 item: this.zestyioAtomPluginView.getElement(),
			 visible: true
		 });

	},
	makeAPIURL(){
		console.log(this.config.instancesAPIURL)
		this.apiURL = this.config.instancesAPIURL.replace('INSTANCE_ZUID',this.zestyConfig.instanceZUID)
		console.log(this.apiURL)
	},
	buildAPIURL(uri){
		return this.apiURL + uri
	},
	getFileLists(){
		let viewsGet = this.buildAPIURL(this.config.apiEndpoints.viewsGET)
		let $this = this;
		this.getRequest(viewsGet).then((response) => {

			let res = JSON.parse(response);
			console.log(res)
			$this.zestyConfig.views = {};
			for(dataIndex in res.data){
				$this.zestyConfig.views[res.data[dataIndex].fileName] = res.data[dataIndex].ZUID
			}
			console.log($this.zestyConfig)
			// loop through the data, make a filename : zuid object, store it to views
			//editor.insertText(html)
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
		},5500)

	},
	createModalElement (innerText) {
	  // create a new div element
	  var messageDiv = document.createElement("div");
		messageDiv.style.cssText = "height: 32px; padding: 10px; font-weight: bold";
		// zesty logo in it
		var zestyLogo = document.createElement("img");
		zestyLogo.src = this.config.zestyWhiteLogo;
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

	subscribeToConfigChanges() {
		const subscriptions = new CompositeDisposable();

		// TODO listen to zesty config for it to change
		const zestyConfigObserver = atom.config.observe(
			'encourage.encouragementList',
			(value) => {
				console.log('zesty config chnge');
				//this.zestyConfig = value;
			});
		subscriptions.add(zestyConfigObserver);

		return subscriptions;
	},

	fileSave() {
		console.log('invoked due to a document save!');
		let editor
	  if (editor = atom.workspace.getActiveTextEditor()) {
	    let content = editor.getText()
			var parts = editor.getPath().split(/\//);
			let filename = parts[parts.length-1];

	    let payload = {'filename': filename, 'view': content};

			if(this.zestyConfig.views.hasOwnProperty(filename)){
				let fileZUID = this.zestyConfig.views[filename];
				let uri = `/web/views/${fileZUID}`;
				let putURL = this.buildAPIURL(uri);
				console.log(putURL)
				this.putRequest(putURL,payload).then((html) => {
	        this.emitModalMessage(`File ${filename} saved to Zesty.io`)
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
			    'bearer': $this.zestyConfig.token
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
			    'bearer': $this.zestyConfig.token
			  }
			}, (error, response, body) => {
				console.log(response)
				console.log(body)
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {

          reject({
            reason: 'Unable to access the api'
          })
        }
      })
    })
  }

};
