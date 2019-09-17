'use babel';

import { TextEditor } from 'atom'
import packageConfig from './config-schema.json'

const request = require('request')

const zestyGetInstances = async () => {
 
}

export default class ZestyInstanceView {

    constructor(serializedState) {
        this.paneItem = null

        this.instanceEditor = new TextEditor({ mini : true })
        this.instanceEditor.setPlaceholderText('8-XxXxX-XxXxXxXX')
        this.instanceEditor.element.tabIndex = 1

        this.instanceMessage = document.createElement('div')
        this.instanceMessage.className = 'fieldLabel'
        this.instanceMessage.innerHTML = 'Enter your Instance ZUID'

        this.element = document.createElement('div')
        this.element.className = 'zestyInstanceInput'

        this.zestyLogo = document.createElement('img')
		this.zestyLogo.src = packageConfig.zestyWhiteUprightLogo
        this.zestyLogo.className = 'zLoginLogo'
        
        this.element.appendChild(this.zestyLogo)

        // Put these in their own div?
        this.instanceContentArea = document.createElement('div')
        this.instanceContentArea.id = 'zestyInstanceContentArea'

        this.instanceEditorArea = document.createElement('div')
        this.instanceEditorArea.className = 'zestyInstanceEntryArea'
        this.instanceEditorArea.appendChild(this.instanceMessage)
        this.instanceEditorArea.appendChild(this.instanceEditor.element)

        this.instanceContentArea.appendChild(this.instanceEditorArea)

        const instanceButtonArea = document.createElement('span')
        instanceButtonArea.innerHTML = '<button id="zestyConfirmInstanceButton" class="btn instanceFormButton">Confirm Instance</button>'
        this.instanceContentArea.appendChild(instanceButtonArea)

        const cancelButtonArea = document.createElement('span')
        cancelButtonArea.innerHTML = '<button id="zestyInstanceCancelButton" class="btn instanceFormButton">Cancel</button>'
        this.instanceContentArea.appendChild(cancelButtonArea)

        this.element.appendChild(this.instanceContentArea)

      
        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        })

        const instanceButton = this.instanceContentArea.querySelector('#zestyConfirmInstanceButton')

        instanceButton.addEventListener('keyup', e => {
            if (e.keyCode === 13) {
                instanceButton.click()
            }
        })

        instanceButton.addEventListener('click', async () => { 
            const instanceZUID = this.instanceEditor.getBuffer().getText()
            

            try {
                this.callback(instanceZUID)
                
            } catch (e) {
                
                console.log(e)
            }
        })

        const cancelButton = this.instanceContentArea.querySelector('#zestyInstanceCancelButton')
        cancelButton.addEventListener('click', () => {
            this.panel.hide()
        })

        cancelButton.addEventListener('keyup', e => {
            if (e.keyCode === 13) {
                this.panel.hide()
            }
        })

       
    }

	serialize() {
	}

	// Tear down any state and detach
	destroy() {
		this.element.remove()
	}

	getElement() {
		return this.element
    }    
    
    open(callback) {
        this.callback = callback

        if (this.panel.isVisible()) {
            return
        }

        this.panel.show()
        this.instanceEditor.element.focus()
    }
}