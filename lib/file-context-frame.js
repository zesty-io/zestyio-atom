'use babel';

module.exports = {

	modelsTrayView: function(instance) {
		let mainDiv = document.createElement('div');
		mainDiv.className = "gridWrapper";

		let leftDiv = document.createElement('div');

		leftDiv.className = "gridItem"
		leftDiv.innerHTML = `
		<h4>Content Models</h4>
		<hr>
	`;
		leftDiv.innerHTML += module.exports.modelsHTML(instance.models);

		mainDiv.appendChild(leftDiv);

		// let rightDiv = document.createElement('div');
		// rightDiv.className = "gridItem";
		//
		// rightDiv.innerHTML = `
		// 	<h4></h4>
		// 	<hr>
		// 	`;
		//
		// mainDiv.appendChild(rightDiv);

		return mainDiv;
	},
	modelsHTML: function(models){
		let html = '<table>';
		html += '<thead><tr><th>ZUID</th><th>Label</th><th>Name</th><th>Headless Access</th></tr></thead>';
		html += '<tbody>';
		for (var i = 0; i < models.length; i++) {
			html += `<tr><td>${models[i].ZUID}</td><td>${models[i].label}</td><td>${models[i].name} (<a href="${models[i].managerURL}">edit</a>)</td><td><a href="${models[i].instantContentURL}">${models[i].instantContentURL}</a></td></tr>`;
		}
		return html + '</tbody></table>'
	}


}
