'use babel';
import packageConfig from './config-schema.json';

export default class ZestyioAtomPluginView {

	message = null;

	  constructor(serializedState) {
	    // Create root element
	    this.element = document.createElement('div');
			this.element.style.cssText = "height: 40px;";

	    // Create message element
	    const message = document.createElement('div');
	    message.textContent = 'Zesty.io Plugin'; // This will replaced.
	    message.classList.add('message');

			var zestyLogo = document.createElement("img");
			zestyLogo.src = packageConfig.zestyWhiteLogo;
			zestyLogo.align="left";
			zestyLogo.width="24";
			zestyLogo.style.cssText = "margin: 10px; width: 24px;";

			// add the text node to the newly created div
			this.element.appendChild(zestyLogo);
			this.element.appendChild(message);


	  }

	  fadeOut() {
	    this.element.parentElement.classList.add('encourage-hidden');
	  }

	  setMessage(text) {
	    this.element.firstChild.textContent = text;
	    this.element.parentElement.classList.remove('encourage-hidden');
	  }

	  // Returns an object that can be retrieved when package is activated
	  serialize() {}

	  // Tear down any state and detach
	  destroy() {
	    this.element.remove();
	  }

	  getElement() {
	    return this.element;
	  }

}
