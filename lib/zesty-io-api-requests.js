'use babel';
const request = require('request').defaults({strictSSL: false})

export default class ZestyioAPIRequests {

	instancesAPIURL = "https://INSTANCE_ZUID.api.zesty.io/v1";
	instancesAPIEndpoints = {
		"viewsGET" : "/web/views",
		"viewGET" : "/web/views/VIEW_ZUID",
		"viewPOST" : "/web/views",
		"viewPUT" : "/web/views/VIEW_ZUID",
		"viewPUTPUBLISH" : "/web/views/VIEW_ZUID?publish=true",
    "modelsGET" : "/content/models",
		"itemsGET" : "/content/models/MODEL_ZUID/items",
		"stylesheetsGET" : "/web/stylesheets",
		"scriptsGET" : "/web/scripts"
	};

	accountsAPIURL = "https://accounts.api.zesty.io/v1";
	accountsAPIEndpoints = {
		"instanceGET" : "/instances/INSTANCE_ZUID",
		"instanceUsersGET" : "/instances/INSTANCE_ZUID/users/roles"
	};

	defaultAccessError = "Error";

	constructor(instanceZUID, token, options = {}) {
		this.instanceZUID = instanceZUID;
		this.token = token;
		this.instancesAPIURL = this.makeInstancesAPIURL();

	}

	makeInstancesAPIURL(){
		this.apiURL = this.replaceInURL(this.instancesAPIURL, {'INSTANCE_ZUID':this.instanceZUID});
	}
	buildAPIURL(uri, api){
		return (api == "accounts") ? this.accountsAPIURL + uri : this.instancesAPIURL + uri;
	}

	replaceInURL(url, replacementObject){
		for (var key in replacementObject) {
			url = url.replace(key, replacementObject[key])
		}
		return url
	}

	async getItems(modelZUID){
		let itemsURL = this.buildAPIURL(
			this.replaceInURL(this.instancesAPIEndpoints.itemsGET,
				{'MODEL_ZUID':modelZUID})
			);
		let items = await this.getRequest(itemsURL);
		return JSON.parse(items);
	}

	async getInstance(){
		let instanceGET = this.replaceInURL(
			this.buildAPIURL(this.accountsAPIEndpoints.instanceGET, "accounts"),
			{'INSTANCE_ZUID': this.instanceZUID}
		);
		let instance = await this.getRequest(instanceGET);
		return JSON.parse(instance);
	}



	async getRequest(url) {
		$this = this
		return new Promise((resolve, reject) => {
			request.get(url, {
				'auth': {
					'bearer': $this.token
				}
			}, (error, response, body) => {
				console.log(response)
				if (!error && response.statusCode == 200) {
					resolve(body)
				} else {
					console.log(error)
					reject({
						reason: this.defaultAccessError + ': ' + 'errr'
					})
				}
			})
		})
	}

}
