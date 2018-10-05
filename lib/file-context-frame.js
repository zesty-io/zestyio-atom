'use babel';

module.exports = {

	fileTrayView: function(file,webEngineRoutes) {
		let mainDiv = document.createElement('div');
		mainDiv.className = "gridWrapper";

		let leftDiv = document.createElement('div');

		leftDiv.className = "gridItem"
		leftDiv.innerHTML = `
		<h4>File Context</h4>
		<hr>
		<table>
			<tbody>
				<tr>
					<td>Filename</td><td>${file.filename}</td>
				</tr>
				<tr>
					<td>ZUID</td><td>${file.zuid}</td>
				</tr>
				<tr>
					<td>Associated Model</td><td>${file.model}</td>
				</tr>
			</tbody>
		</table>

	`;


		mainDiv.appendChild(leftDiv);

		let rightDiv = document.createElement('div');
		rightDiv.className = "gridItem";

		rightDiv.innerHTML = `
			<h4>Web Engine URLs <a class="documentation-link" href="https://www.zesty.org/services/web-engine"><span class="icon icon-question"></a></a></h4>
			<hr>
			`;
		rightDiv.innerHTML += module.exports.webEngineRoutesHTML(webEngineRoutes);

		mainDiv.appendChild(rightDiv);

		return mainDiv;
	},
	webEngineRoutesHTML: function(webEngineRoutes){
		let html = '<table class="webEngineRoutes">';
		for (var i = 0; i < webEngineRoutes.length; i++) {
			html += `<tr><td><strong>${webEngineRoutes[i].name}</strong> <span>${webEngineRoutes[i].path}</span><br><a href="${webEngineRoutes[i].url}">${webEngineRoutes[i].url}</a></td></tr>`;
		}
		return html + '</table>'
	}


}
