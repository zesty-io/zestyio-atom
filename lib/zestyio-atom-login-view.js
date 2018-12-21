'use babel';

import { TextEditor } from 'atom'
import packageConfig from './config-schema.json'

export default class ZestyLoginView {
    constructor(serializedState) {
        this.paneItem = null

        this.loginMessage = document.createElement('div')
        this.loginMessage.className = 'loginMessage'
        this.loginMessage.innerHTML = 'Log in to Zesty.io'

        this.emailEditor = new TextEditor({ mini : true })
        this.emailEditor.setPlaceholderText('hello@zesty.io')

        this.emailMessage = document.createElement('div')
        this.emailMessage.className = 'fieldLabel'
        this.emailMessage.innerHTML = 'Email Address:'

        this.element = document.createElement('div')
        this.element.className = 'zestyLogin'

        this.passwordEditor = new TextEditor({ mini : true })

        this.passwordMessage = document.createElement('div')
        this.passwordMessage.className = 'fieldLabel'
        this.passwordMessage.innerHTML = 'Password:'

        this.zestyLogo = document.createElement('img')
		this.zestyLogo.src = packageConfig.zestyWhiteUprightLogo
        this.zestyLogo.className = 'zLoginLogo'
        
        this.element.appendChild(this.zestyLogo)
        this.element.appendChild(this.loginMessage)
        this.element.appendChild(this.emailMessage)
        this.element.appendChild(this.emailEditor.element)
        this.element.appendChild(this.passwordMessage)
        this.element.appendChild(this.passwordEditor.element)

        const loginArea = document.createElement('span')
        loginArea.innerHTML = `<button id="zestyLoginButton" class="btn loginFormButton">Log In</button>`
        this.element.appendChild(loginArea)

        const cancelArea = document.createElement('span')
        cancelArea.innerHTML = `<button id="zestyLoginCancelButton" class="btn loginFormButton">Cancel</button>`
        this.element.appendChild(cancelArea)

        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        })

        const loginButton = loginArea.querySelector('#zestyLoginButton')
        loginButton.addEventListener('click', () => { 
            console.log(`YOUR EMAIL: ${this.emailEditor.getBuffer().getText()}`)
            console.log(`YOUR PASSWORD: ${this.passwordEditor.getBuffer().getText()}`)
            alert('TODO: Perform login...')
        })

        const cancelButton = cancelArea.querySelector('#zestyLoginCancelButton')
        cancelButton.addEventListener('click', () => {
            this.panel.hide()
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
    
    open() {
        if (this.panel.isVisible()) {
            return
        }

        this.panel.show()
    }
}