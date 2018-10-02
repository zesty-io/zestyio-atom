'use babel';
import packageConfig from './config-schema.json';
import pluginPackageJSON from '../package.json';
import { CompositeDisposable } from 'atom';
const instanceInfoView = require('./instance-info-frame')
const contentModelsView = require('./content-models-frame')
const fileContextView = require('./file-context-frame')


export default class ZestyioAtomPluginView {

	tabs = ['File Context','Content Models','Instance Info','Connector Logs'];

	  constructor(serializedState) {
	    // Create root element
	    this.element = document.createElement('div');
			this.element.classList.add('zesty-tray');

	    // Create message element
	    const header = document.createElement('div');
			header.className = "header";
	    header.textContent = 'Zesty.io Cloud Content Instance Connector'; // Title
			header.addEventListener("dblclick",this.toggleMinimizeTray);

			const alphaTag = document.createElement('span')
			alphaTag.className = 'alphaTag'
			alphaTag.textContent = `[${pluginPackageJSON.version} alpha] Not approved for production use.`;

			header.appendChild(alphaTag)

			this.headerItem = document.createElement("span");
			this.headerItem.className = "header-item pull-right";

			this.instanceName = document.createElement("span");
			this.instanceName.className = "instanceName";
			this.instanceName.textContent = "Not Connected";
			this.headerItem.appendChild(this.instanceName);
			// button
			this.toggleMinimize = document.createElement("button");
			this.toggleMinimize.className = "btn icon icon-chevron-down minimizeButton";
			this.toggleMinimize.addEventListener("click",this.toggleMinimizeTray);
			this.headerItem.appendChild(this.toggleMinimize);

			header.appendChild(this.headerItem);

			var zestyLogo = document.createElement("img");
			zestyLogo.src = packageConfig.zestyWhiteLogo;
			zestyLogo.align="left";
			zestyLogo.width="24";
			zestyLogo.className = "headerLogo";
			header.appendChild(zestyLogo);

			this.element.appendChild(header);

			this.mainBody = document.createElement('div');
			this.mainBody.className = "wrapper";


			this.leftContainer = document.createElement('div');
			this.leftContainer.className = "leftContainer";

			// scroll container to control overflow while hiding the scroll bar
			let scrollContainer = document.createElement('div');
			scrollContainer.className = "scrollContainer";
			this.setupTabFrames(scrollContainer);
			this.leftContainer.appendChild(scrollContainer);


			this.mainBody.appendChild(this.leftContainer);

			this.rightContainer = document.createElement('div');
			this.rightContainer.className = "rightContainer";
			this.setupTabs(this.rightContainer);
			this.mainBody.appendChild(this.rightContainer);


			this.element.appendChild(this.mainBody);

	  }

		setupTabs(injectElement){
			let tabName = "";
			let tabElement = null;
			let tabUL = document.createElement('ul');
			tabUL.className = "zestyTabs";

			for (var i = 0; i < this.tabs.length; i++) {
				tabName = this.tabs[i]
				tabElement = document.createElement('li');
				tabElement.textContent = tabName;
				tabElement.setAttribute('data-id', tabName.replace(' ','-').toLowerCase() );
				tabElement.className = 'zestyTab ' + tabName.replace(' ','-').toLowerCase();

				if(atom.config.get('zestyio-atom.defaultTrayTabOnStart') == tabName.replace(' ','-').toLowerCase()) {
						tabElement.classList.add("active");
				}

				tabElement.addEventListener("click",this.selectTab);
				tabUL.appendChild(tabElement)
			}
			injectElement.appendChild(tabUL);
		}

		setupTabFrames(injectElement){
			let frameName = "";
			let frameElement = null;


			for (var i = 0; i < this.tabs.length; i++) {
				tabName = this.tabs[i]
				tabFrameElement = document.createElement('div');
				tabFrameElement.textContent = tabName;
				tabFrameElement.setAttribute('data-id', tabName.replace(' ','-').toLowerCase() );
				tabFrameElement.className = 'zestyTabFrame ' + tabName.replace(' ','-').toLowerCase();
				tabFrameElement.setAttribute('id', tabName.replace(' ','-').toLowerCase())

				if(atom.config.get('zestyio-atom.defaultTrayTabOnStart') == tabName.replace(' ','-').toLowerCase()) {
						tabFrameElement.classList.add("active");
				}
				injectElement.appendChild(tabFrameElement);
			}

		}


	  toggleMinimizeTray() {
			let tray = document.querySelector(".zesty-tray")
			let button = document.querySelector(".zesty-tray .minimizeButton")
			button.classList.toggle('icon-chevron-down')
			button.classList.toggle('icon-chevron-up')
			tray.classList.toggle('minimize')

	  }

		selectTab(){
			let nodes = document.querySelectorAll(".zestyTab")
			let frame = null;
			nodes.forEach(function(tab) {
				frame = document.getElementById(tab.getAttribute("data-id"));
				frame.classList.remove("active");
			  tab.classList.remove("active");
			});

			atom.config.set('zestyio-atom.defaultTrayTabOnStart', this.getAttribute("data-id") );

			this.classList.add("active");

			document.getElementById(this.getAttribute("data-id")).classList.add("active");
		}

	  setMessage(text) {
	    this.instanceName.textContent = text;
	  }

		writeLog(text){
			let logsDiv = document.querySelector(".connector-logs");
			if(logsDiv){
				let pLog = document.createElement("p");
				let ts = document.createElement("strong");
				let d = new Date();
				ts.textContent = d.toUTCString()
				pLog.textContent = ": " + text;
				pLog.prepend(ts);

				logsDiv.prepend(pLog);
			}
		}

		updateInstanceInfo(data){
			let instanceInfo = document.querySelector(".instance-info");
			if(instanceInfo){
				instanceInfo.innerHTML = "";
				instanceInfo.prepend(instanceInfoView.instanceTrayView(data));
			}
		}

		updateContentModels(data){
			let contentModels = document.querySelector(".content-models");
			if(contentModels){
				contentModels.innerHTML = "";
				contentModels.prepend(contentModelsView.modelsTrayView(data));
			}
		}

		updateFileContext(data,routes){
			let fileContext = document.querySelector(".file-context");
			if(fileContext){
				fileContext.innerHTML = "";
				fileContext.prepend(fileContextView.fileTrayView(data,routes));
			}
		}



	  // Returns an object that can be retrieved when package is activated
	  serialize() {
			//return this.serialize();

		}


	  // Tear down any state and detach
	  destroy() {
	    this.element.remove();
	  }

	  getElement() {
	    return this.element;
	  }

}
