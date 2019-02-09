'use babel';

import { TextEditor } from 'atom'
import packageConfig from './config-schema.json'

// const request = require('request-promise') // TODO is this needed?
const request = require('request')

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

        // Put these in their own div?
        this.loginContentArea = document.createElement('div')
        this.loginContentArea.id = 'zestyLoginContentArea'

        this.loginContentArea.appendChild(this.emailMessage)
        this.loginContentArea.appendChild(this.emailEditor.element)
        this.loginContentArea.appendChild(this.passwordMessage)
        this.loginContentArea.appendChild(this.passwordEditor.element)

        const loginButtonArea = document.createElement('span')
        loginButtonArea.innerHTML = `<button id="zestyLoginButton" class="btn loginFormButton">Log In</button>`
        this.loginContentArea.appendChild(loginButtonArea)

        const cancelButtonArea = document.createElement('span')
        cancelButtonArea.innerHTML = `<button id="zestyLoginCancelButton" class="btn loginFormButton">Cancel</button>`
        this.loginContentArea.appendChild(cancelButtonArea)

        this.element.appendChild(this.loginContentArea)

        this.mfaContentArea = document.createElement('div')
        this.mfaContentArea.id = 'zestyLoginMfaArea'
        this.mfaContentArea.className = 'hidden'

        // TODO... add label and input, plus Check 2FA Token and Cancel buttons
        this.authyTokenMessage = document.createElement('div')
        this.authyTokenMessage.className = 'fieldLabel'
        this.authyTokenMessage.innerHTML = 'Enter Authy Token:'

        this.authyTokenEditor = new TextEditor({ mini : true })

        this.mfaContentArea.appendChild(this.authyTokenMessage)
        this.mfaContentArea.appendChild(this.authyTokenEditor.element)
        // TODO need Check 2FA Token and Cancel buttons

        this.element.appendChild(this.mfaContentArea)

        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        })

        const loginButton = this.loginContentArea.querySelector('#zestyLoginButton')
        loginButton.addEventListener('click', async () => { 
            const email = this.emailEditor.getBuffer().getText()
            const password = this.passwordEditor.getBuffer().getText()
            console.log(`YOUR EMAIL: ${email}`)
            console.log(`YOUR PASSWORD: ${password}`)

            try {
                const loginResponse = await zestyLogin(email, password)

                if (loginResponse.statusCode === 202) {
                    // MFA Required
                    this.loginContentArea.className = 'hidden'
                    this.mfaContentArea.className = ''


                    // Start One Touch 2FA Timer
                    console.log('2FA One Touch Timer checking...')                
                    const mfaTimer = setInterval(() => {
                        request.get({
                            url: `${packageConfig.authURL}/verify-2fa`,
                            headers: {
                                Authorization: `Bearer ${loginResponse.token}`
                            },
                            json: true                    
                        }, (error, response, body) => {
                            if (body.code === 200) {
                                clearInterval(mfaTimer)
                                console.log('Got 2FA via One Touch.')
                                this.loggedInCallback(loginResponse.token)         
                            }
                        })
                    }, 2000)
                } else {
                    // Got token without needing MFA
                    this.loggedInCallback(loginResponse.token)
                }
                
            } catch (e) {
                console.log(e)
                alert (`Error:`)
            }
        })

        const cancelButton = this.loginContentArea.querySelector('#zestyLoginCancelButton')
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
    
    open(loggedInCallback) {
        this.loggedInCallback = loggedInCallback

        if (this.panel.isVisible()) {
            return
        }

        this.panel.show()
    }
}