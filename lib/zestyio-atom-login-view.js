'use babel';

import { TextEditor } from 'atom'
import packageConfig from './config-schema.json'

const request = require('request-promise')

const zestyLogin = async (email, password) => {
    const loginURL = `${packageConfig.authURL}/login`

    return new Promise((resolve, reject) => {
        request.post({
            url: loginURL,
            formData: {
                email,
                password
            },
            json: true
        }, (error, response, body) => {
            if (error) {
                return reject({
                    errorCode: -1,
                    errorMessage: 'Unexpected error.'
                })
            }

            if (response.statusCode === 202 && body.hasOwnProperty('message') && body.message === '1FA success; 2FA required') {
                // 2FA is required
                return resolve({
                    statusCode: 202,
                    token: body.meta.token
                })
            }

            if (response.statusCode !== 200) {
                return reject({
                    errorCode: response.statusCode,
                    errorMessage: body.message || ''
                })
            }

            return resolve({
                statusCode: 200,
                token: body.meta.token
            })
        })
    })
}

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
        loginButton.addEventListener('click', async () => { 
            const email = this.emailEditor.getBuffer().getText()
            const password = this.passwordEditor.getBuffer().getText()
            console.log(`YOUR EMAIL: ${email}`)
            console.log(`YOUR PASSWORD: ${password}`)

            try {
                const loginResponse = await zestyLogin(email, password)

                if (loginResponse.statusCode === 202) {
                    // MFA Required
                    alert('Requires MFA...')
                } else {
                    // Got token without needing MFA
                    alert(`TOKEN: ${loginResponse.token}`)
                }
                
            } catch (e) {
                console.log(e)
                alert (`Error:`)
            }
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