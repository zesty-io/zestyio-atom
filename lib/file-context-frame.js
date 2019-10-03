'use babel';
import { Emitter, CompositeDisposable } from 'atom'

module.exports = {
	createRow: function(label,value) {

		const tr  = document.createElement('tr')
		const td1  = document.createElement('td')
		td1.innerHTML = `<strong>${label}</strong>`
		tr.appendChild(td1)
		const td2  = document.createElement('td')
		td2.innerHTML = `${value}`
		tr.appendChild(td2)

		return tr 
	},
	fileTrayView: function(file,webEngineRoutes,auditTrailEntries,publishCallback={}) {
		const mainDiv = document.createElement('div')
		mainDiv.className = 'gridWrapper'

		const leftDiv = document.createElement('div')
		leftDiv.className = 'gridItem'
		

		const h4 = document.createElement('h4')
		h4.textContent = 'File Context'
		
		let publishButton = document.createElement('button')
		if(publishCallback !== false){
			publishButton.innerHTML = '<span class="icon icon-cloud-upload"></span> Publish'
			publishButton.classList.add("publishButton")
			publishButton.onclick = publishCallback
			h4.appendChild(publishButton)
		}
		
		leftDiv.appendChild(h4)
		leftDiv.appendChild(document.createElement('hr'))

		const table = document.createElement('table')

		const tbody = document.createElement('tbody')
		tbody.appendChild(this.createRow("Filename",file.filename))
		tbody.appendChild(this.createRow("File ZUID",file.zuid))
		tbody.appendChild(this.createRow("File Type",file.fileType + " " + file.zestyFileType))
		
		if(file.model){
			let modelZuid = file.model ? file.model : 'None'
			tbody.appendChild(this.createRow("Associated Model",modelZuid))
		}
		table.appendChild(tbody)
		leftDiv.appendChild(table)
		

		// audit trail
		if(auditTrailEntries.length > 0){
			let h4at = document.createElement('h4')
			h4at.textContent = 'Cloud Publish / Edit History (Audit Trail)'
			leftDiv.appendChild(h4at)
			leftDiv.appendChild(document.createElement('hr'))
			let holder = document.createElement('div')
			holder.innerHTML = this.listAuditTrail(auditTrailEntries)
			leftDiv.appendChild(holder)
		}
		//add left div
		mainDiv.appendChild(leftDiv)

		const rightDiv = document.createElement('div')
		rightDiv.className = 'gridItem'

		rightDiv.innerHTML = `
			<h4>Web Engine URLs <a class="documentation-link" href="https://www.zesty.org/services/web-engine"><span class="icon icon-question"></span></a></h4>
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
	},

	listAuditTrail: function(auditTrailEntries){
		auditTrailEntries = auditTrailEntries.reverse()
		let html = '<table class="auditTrailEntries">'
		for (let i = 0; i < auditTrailEntries.length; i++) {
			html = `${html}<tr><td>`
			html += `<strong>${auditTrailEntries[i].firstName} ${auditTrailEntries[i].lastName}</strong> <span>(${auditTrailEntries[i].email})</span> ${auditTrailEntries[i].meta.message} on ${auditTrailEntries[i].happenedAt}`
			//html += `<br> `
			html += `</td></tr>`
		}
		
		return `${html}</table>`

	},


	publish(callback) {
        this.callback = callback
		console.log('publish hit')
    }
}
