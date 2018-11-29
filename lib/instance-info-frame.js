'use babel';

module.exports = {
	instanceTrayView: function(instance) {
		const mainDiv = document.createElement('div')
		mainDiv.className = 'gridWrapper'

		const leftDiv = document.createElement('div')

		leftDiv.className = 'gridItem'
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
		</table>`
		mainDiv.appendChild(leftDiv)

		const rightDiv = document.createElement('div')
		rightDiv.className = 'gridItem'

		rightDiv.innerHTML = `
			<h4>Users with Access</h4>
			<hr>
			`;
			rightDiv.innerHTML += module.exports.userWithAccessHTML(instance.users)
		mainDiv.appendChild(rightDiv)

		return mainDiv
	},
	
	userWithAccessHTML: function(users) {
		let html = '<table><tbody>'
		for (let i = 0; i < users.length; i++) {
			html = `${html}<tr><td><strong>${users[i].role}</strong></td><td>${users[i].firstName} ${users[i].lastName} (<a href="mailto:${users[i].email}">${users[i].email}</a>)</td></tr>`
		}
		return `${html}</tbody></table>`
	}
}
