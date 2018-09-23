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
		let html = '<table><tbody>';
		for (var i = 0; i < models.length; i++) {
			html += `<tr><td><strong>${models[i].label}</strong> (<a href="${models[i].managerURL}">edit</a>)</td><td><strong>[${models[i].ZUID}]</strong> ${models[i].name}</td></tr>`;
		}
		return html + '</tbody></table>'
	}


}
