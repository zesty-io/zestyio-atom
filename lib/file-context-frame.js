'use babel';
import { Emitter, CompositeDisposable } from 'atom'

module.exports = {
	hello: function() {
		this.emitter = new Emitter()
		this.emitter.emit('start')

	},
	createRow: function(label,value) {

		const tr  = document.createElement('tr')
		const td1  = document.createElement('td')
		td1.textContent = label
		tr.appendChild(td1)
		const td2  = document.createElement('td')
		td2.textContent = value
		tr.appendChild(td2)

		return tr 
	},
	fileTrayView: function(file,webEngineRoutes) {
		const mainDiv = document.createElement('div')
		mainDiv.className = 'gridWrapper'

		const leftDiv = document.createElement('div')
		leftDiv.className = 'gridItem'
		

		const h4 = document.createElement('h4')
		h4.textContent = 'File Context'
		h4.addEventListener('click', this.hello)
		
		leftDiv.appendChild(h4)
		leftDiv.appendChild(document.createElement('hr'))

		const table = document.createElement('table')

		const tbody = document.createElement('tbody')
		tbody.appendChild(this.createRow("Filename",file.filename))
		tbody.appendChild(this.createRow("ZUID",file.zuid))
		tbody.appendChild(this.createRow("Type",file.fileType + " " + file.zestyFileType))
		let modelZuid = file.model ? file.model : 'None'
		tbody.appendChild(this.createRow("Associated Model",modelZuid))
		
		table.appendChild(tbody)
		leftDiv.appendChild(table)
		mainDiv.appendChild(leftDiv)

		

		const rightDiv = document.createElement('div')
		rightDiv.className = 'gridItem'

		rightDiv.innerHTML = `
			<h4>Web Engine URLs <a class="documentation-link" href="https://www.zesty.org/services/web-engine"><span class="icon icon-question"></a></a></h4>
			<hr>
			`
		rightDiv.innerHTML += module.exports.webEngineRoutesHTML(webEngineRoutes)

		mainDiv.appendChild(rightDiv)

		return mainDiv
	},

	webEngineRoutesHTML: function(webEngineRoutes){
		let html = '<table class="webEngineRoutes">'
		for (let i = 0; i < webEngineRoutes.length; i++) {
			html = `${html}<tr><td><strong>${webEngineRoutes[i].name}</strong> <span>${webEngineRoutes[i].path}</span><br><a href="${webEngineRoutes[i].url}">${webEngineRoutes[i].url}</a></td></tr>`
		}
		
		return `${html}</table>`
	}
}
