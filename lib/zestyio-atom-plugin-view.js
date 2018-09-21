'use babel';
import packageConfig from './config-schema.json';
import pluginPackageJSON from '../package.json';




export default class ZestyioAtomPluginView {

	message = null;

	  constructor(serializedState) {


	    // Create root element
	    this.element = document.createElement('div');
			this.element.classList.add('zesty-tray');

	    // Create message element
	    const header = document.createElement('div');
			header.className = "header";
	    header.textContent = 'Zesty.io Cloud Content Instance Connector'; // Title

			const alphaTag = document.createElement('span')
			alphaTag.className = 'alphaTag'
			alphaTag.textContent = `[${pluginPackageJSON.version} alpha] Not approved for production use.`;

			header.appendChild(alphaTag)

			this.headerItem = document.createElement("span");
			this.headerItem.className = "header-item pull-right";

			this.instanceName = document.createElement("span");
			this.instanceName.className = "instanceName";
			this.instanceName.textContent = "Not Connected.";
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
			this.mainBody.style.cssText = "padding: 10px; color: #E5EAF9; background: #1B1F2C; height: 80px;";
			this.mainBody.textContent = 'Place Holder for File Context'; // This will replaced.
			this.element.appendChild(this.mainBody);

	  }

	  toggleMinimizeTray() {
			let tray = document.querySelector(".zesty-tray")
			let button = document.querySelector(".zesty-tray .minimizeButton")
			button.classList.toggle('icon-chevron-down')
			button.classList.toggle('icon-chevron-up')
			tray.classList.toggle('minimize')
	  }
		getMinimizeButton(){
			return this.toggleMinimize;
		}

	  setMessage(text) {
	    this.instanceName.textContent = text;
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
