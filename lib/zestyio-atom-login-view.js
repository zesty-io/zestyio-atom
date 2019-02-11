'use babel';

import { TextEditor } from 'atom'
import packageConfig from './config-schema.json'

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

const zestyVerify2FA = async(mfaToken, userToken) => {
    return new Promise((resolve, reject) => {
        request.post({
            url: `${packageConfig.authURL}/verify-2fa`,
            headers: {
                Authorization: `Bearer ${userToken}`
            },
            formData: {
                token: mfaToken
            },
            json: true
        }, (error, response, body) => {
            if (error) {
                return reject({
                    statusCode: -1,
                    errorMessage: 'Unexpected error.'
                })
            }

            if (body.code === 200) {
                return resolve({
                    statusCode: 200,
                    token: mfaToken
                })
            }

            return reject({
                statusCode: body.code
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
        loginButtonArea.innerHTML = '<button id="zestyLoginButton" class="btn loginFormButton">Log In</button>'
        this.loginContentArea.appendChild(loginButtonArea)

        const cancelButtonArea = document.createElement('span')
        cancelButtonArea.innerHTML = '<button id="zestyLoginCancelButton" class="btn loginFormButton">Cancel</button>'
        this.loginContentArea.appendChild(cancelButtonArea)

        this.element.appendChild(this.loginContentArea)

        this.mfaContentArea = document.createElement('div')
        this.mfaContentArea.id = 'zestyLoginMfaArea'
        this.mfaContentArea.className = 'hidden'

        this.authyTokenMessage = document.createElement('div')
        this.authyTokenMessage.className = 'fieldLabel'
        this.authyTokenMessage.innerHTML = 'Enter Authy Token:'

        const check2FAButtonArea = document.createElement('span')
        check2FAButtonArea.innerHTML = '<button id="zestyCheck2FAButton" class="btn loginFormButton">Check 2FA Token</button>'
        
        const cancel2FAButtonArea = document.createElement('span')
        cancel2FAButtonArea.innerHTML = '<button id="zestyCancel2FAButton" class="btn loginFormButton">Cancel</button>'

        this.authyTokenEditor = new TextEditor({ mini : true })

        this.mfaContentArea.appendChild(this.authyTokenMessage)
        this.mfaContentArea.appendChild(this.authyTokenEditor.element)
        this.mfaContentArea.appendChild(check2FAButtonArea)
        this.mfaContentArea.appendChild(cancel2FAButtonArea)

        this.element.appendChild(this.mfaContentArea)

        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        })

        const loginButton = this.loginContentArea.querySelector('#zestyLoginButton')
        loginButton.addEventListener('click', async () => { 
            const email = this.emailEditor.getBuffer().getText()
            const password = this.passwordEditor.getBuffer().getText()

            try {
                const loginResponse = await zestyLogin(email, password)

                if (loginResponse.statusCode === 202) {
                    // MFA Required
                    this.loginContentArea.className = 'hidden'
                    this.mfaContentArea.className = ''

                    this.userToken = loginResponse.token

                    // Start One Touch 2FA Timer
                    this.mfaTimer = setInterval(() => {
                        request.get({
                            url: `${packageConfig.authURL}/verify-2fa`,
                            headers: {
                                Authorization: `Bearer ${loginResponse.token}`
                            },
                            json: true                    
                        }, (error, response, body) => {
                            if (body.code === 200) {
                                clearInterval(this.mfaTimer)
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
                alert (`Error!`)
            }
        })

        const cancelButton = this.loginContentArea.querySelector('#zestyLoginCancelButton')
        cancelButton.addEventListener('click', () => {
            this.panel.hide()
        })

        // TODO MFA manual entry button...
        const check2FAButton = this.mfaContentArea.querySelector('#zestyCheck2FAButton')
        check2FAButton.addEventListener('click', async () => {
            const authyToken = this.authyTokenEditor.getBuffer().getText()

            try {
                const mfaResponse = await zestyVerify2FA(authyToken, this.userToken)
                
                if (mfaResponse.statusCode === 200) {
                    if (this.mfaTimer) {
                        clearInterval(this.mfaTimer)
                        this.mfaTimer = undefined
                        console.log('Cleared MFA timer.')
                    }
                    
                    this.loggedInCallback(this.userToken)
                } 
            } catch (e) {
                console.log(e)
                alert (`Error!`)
            }            
        })

        const cancel2FAButton = this.mfaContentArea.querySelector('#zestyCancel2FAButton')
        cancel2FAButton.addEventListener('click', () => {
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