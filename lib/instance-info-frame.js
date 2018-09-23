'use babel';

module.exports = {

	instanceTrayView: function(instance) {
		let mainDiv = document.createElement('div');
		mainDiv.className = "gridWrapper";

		let leftDiv = document.createElement('div');

		leftDiv.className = "gridItem"
		leftDiv.innerHTML = `
		<h4>Cloud Content Instance Details</h4>
		<hr>
		<table>
			<tbody>
				<tr>
					<td>Instance Name</td>
					<td>${instance.name} (<a href="${instance.accountsURL}">edit</a>)</td>
				</tr>
				<tr>
					<td>Instance ZUID</td>
					<td>${instance.ZUID}</td>
				</tr>
				<tr>
					<td>Stage URL</td>
					<td><a href="${instance.previewURL}">${instance.previewURL}</a></td>
				</tr>
				<tr>
					<td>Live Domain</td>
					<td><a href="${instance.domain}">${instance.domain}</a></td>
				</tr>
				<tr>
					<td>Created At</td>
					<td>${instance.createdAt}</td>
				</tr>

			</tbody>
		</table>`;
		mainDiv.appendChild(leftDiv);

		let rightDiv = document.createElement('div');
		rightDiv.className = "gridItem";

		rightDiv.innerHTML = `
			<h4>Users with Access</h4>
			<hr>
			<p>Coming Soon</p>
			`;
		mainDiv.appendChild(rightDiv);

		return mainDiv;
	}
}
