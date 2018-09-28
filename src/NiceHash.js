import axios from 'axios';

/**
 * An importable JavaScript class to make REST requests to the NiceHash APi
 */
class NiceHash {
	/**
	 * instantiate a NiceHash class that you can use to make REST requests to the NiceHash API
	 * @param {Object} settings - api settings
	 * @param {string|number} settings.id - NiceHash api id
	 * @param {string} settings.key - NiceHash api key
	 */

	constructor(settings) {
		this.base_url = "https://api.nicehash.com/api";

		if (settings && settings.key && settings.id) {
			this.key = settings.key;
			this.id = settings.id
		}
	}

	async testAuthorization(){
		let api = this.api("")
		try {
			return (await api.get()).data
		} catch(err) {
			throw new Error(`Test Authorization request failed: ${err}`)
		}
	}

	api(endpoint, params) {
		return axios.create({
			baseURL: `${this.base_url}${endpoint}`,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
			params
		})
	}
}

export default NiceHash