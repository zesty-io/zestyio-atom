'use babel';

import packageConfig from './config-schema.json'
import pluginPackageJSON from '../package.json'
import { Emitter, CompositeDisposable } from 'atom'
const instanceInfoView = require('./instance-info-frame')
const contentModelsView = require('./content-models-frame')
const fileContextView = require('./file-context-frame')

export default class ZestyioAtomPluginView {
	tabs = [ 'File Context', 'Content Models', 'Instance Info', 'Connector Logs' ]

	constructor(serializedState) {

		// Create root element
		this.element = document.createElement('div')
		this.element.classList.add('zesty-tray')

		// Create message element
		const header = document.createElement('div')
		header.className = 'header'
		header.textContent = 'Zesty.io Cloud Content Instance Connector' // Title
		header.addEventListener('dblclick', this.toggleMinimizeTray)

		const versionTag = document.createElement('span')
		versionTag.className = 'versionTag'
		versionTag.textContent = `[${pluginPackageJSON.version} beta]`

		header.appendChild(versionTag)

		const warningTag = document.createElement('span')
		warningTag.className = 'warningTag'
		warningTag.textContent = `Warning: Local files may be out-of-sync with newer remote changes.`

		header.appendChild(warningTag)

		this.headerItem = document.createElement('span')
		this.headerItem.className = 'header-item pull-right'

		this.instanceName = document.createElement('span')
		this.instanceName.className = 'instanceName'
		this.instanceName.textContent = 'Not Connected'
		this.headerItem.appendChild(this.instanceName)
		// button
		this.toggleMinimize = document.createElement('button')
		this.toggleMinimize.className = 'btn icon icon-chevron-down minimizeButton'
		this.toggleMinimize.addEventListener('click', this.toggleMinimizeTray)
		this.headerItem.appendChild(this.toggleMinimize)

		header.appendChild(this.headerItem)
		
		var zestyLogo = document.createElement('img')
		zestyLogo.src = packageConfig.zestyWhiteLogo
		zestyLogo.align = 'left'
		zestyLogo.width = '24'
		zestyLogo.className = 'headerLogo'
		header.appendChild(zestyLogo)

		this.element.appendChild(header)

		this.mainBody = document.createElement('div')
		this.mainBody.className = 'wrapper'

		this.leftContainer = document.createElement('div')
		this.leftContainer.className = 'leftContainer'

		// scroll container to control overflow while hiding the scroll bar
		let scrollContainer = document.createElement('div')
		scrollContainer.className = 'scrollContainer'
		this.setupTabFrames(scrollContainer)
		this.leftContainer.appendChild(scrollContainer)

		this.mainBody.appendChild(this.leftContainer)

		this.rightContainer = document.createElement('div')
		this.rightContainer.className = 'rightContainer'
		this.setupTabs(this.rightContainer)
		this.mainBody.appendChild(this.rightContainer)

		this.element.appendChild(this.mainBody)
	}

	setupTabs(injectElement) {
		let tabName = ''
		let tabElement = null
		let tabUL = document.createElement('ul')
		tabUL.className = 'zestyTabs'

		for (const tabName of this.tabs) {
			tabElement = document.createElement('li')
			tabElement.textContent = tabName
			tabElement.setAttribute('data-id', tabName.replace(' ', '-').toLowerCase())
			tabElement.className = 'zestyTab ' + tabName.replace(' ', '-').toLowerCase()

			if (atom.config.get('zestyio-atom.defaultTrayTabOnStart') === tabName.replace(' ','-').toLowerCase()) {
				tabElement.classList.add('active')
			}

			tabElement.addEventListener('click', this.selectTab)
			tabUL.appendChild(tabElement)
		}
		injectElement.appendChild(tabUL)
	}

	setupTabFrames(injectElement) {
		for (const tabName of this.tabs) {
			const tabFrameElement = document.createElement('div')
			tabFrameElement.textContent = tabName
			tabFrameElement.setAttribute('data-id', tabName.replace(' ', '-').toLowerCase())
			tabFrameElement.className = `zestyTabFrame ${tabName.replace(' ', '-').toLowerCase()}`
			tabFrameElement.setAttribute('id', tabName.replace(' ','-').toLowerCase())

			if (atom.config.get('zestyio-atom.defaultTrayTabOnStart') === tabName.replace(' ', '-').toLowerCase()) {
				tabFrameElement.classList.add('active')
			}

			injectElement.appendChild(tabFrameElement)
		}
	}

	toggleMinimizeTray() {
		const tray = document.querySelector('.zesty-tray')
		const button = document.querySelector('.zesty-tray .minimizeButton')
		button.classList.toggle('icon-chevron-down')
		button.classList.toggle('icon-chevron-up')
		tray.classList.toggle('minimize')
	}

	selectTab() {
		const nodes = document.querySelectorAll('.zestyTab')

		nodes.forEach(function(tab) {
			const frame = document.getElementById(tab.getAttribute('data-id'))
			frame.classList.remove('active')
			tab.classList.remove('active')
		})

		atom.config.set('zestyio-atom.defaultTrayTabOnStart', this.getAttribute('data-id'))

		this.classList.add('active')

		document.getElementById(this.getAttribute('data-id')).classList.add('active')
	}

	setMessage(text) {
		this.instanceName.textContent = text
	}

	writeLog(text,color='white') {
		const logsDiv = document.querySelector('.connector-logs')

		if (logsDiv) {
			const pLog = document.createElement('p')
			const ts = document.createElement('strong')
			const d = new Date()
			ts.textContent = d.toUTCString()
			pLog.textContent = `: ${text}`
			pLog.prepend(ts)
			pLog.style.color = color

			logsDiv.prepend(pLog)
		}
	}

	updateInstanceInfo(data){
		const instanceInfo = document.querySelector('.instance-info')

		if (instanceInfo) {
			instanceInfo.innerHTML = ''
			instanceInfo.prepend(instanceInfoView.instanceTrayView(data))
		}
	}

	updateContentModels(data){
		const contentModels = document.querySelector('.content-models')

		if (contentModels) {
			contentModels.innerHTML = ''
			contentModels.prepend(contentModelsView.modelsTrayView(data))
		}
	}

	updateFileContext(data,routes){
		const fileContext = document.querySelector('.file-context')

		if (fileContext) {
			fileContext.innerHTML = ''
			fileContext.prepend(fileContextView.fileTrayView(data,routes))
		}
	}

	// Returns an object that can be retrieved when package is activated
	serialize() {
		//return this.serialize()
	}

	// Tear down any state and detach
	destroy() {
		this.element.remove()
	}

	getElement() {
		return this.element
	}
}
