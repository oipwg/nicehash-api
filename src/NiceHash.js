import axios from 'axios';
import algorithms from './algorithms'

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

	/**
	 * Test Authorization
	 * @returns {Promise<Object>}
	 */
	async testAuthorization(){
		let api = this.api("");
		try {
			let res = (await api.get()).data;
			return !!res.result
		} catch(err) {
			throw new Error(`Test Authorization request failed: ${err}`)
		}
	}

	/**
	 * Get current profitability (price) and hashing speed for all algorithms. Refreshed every 30 seconds.
	 * ${number} [location] - 0 for Europe, 1 for USA. Both if omitted.
	 */
	async getCurrentGlobalStats(location) {
		let params = {
			method: "stats.global.current",
			location
		};
		let api = this.api("", params)
		try {
			let res = (await api.get()).data;
			if (res.result && res.result.stats) {
				for (let stat of res.result.stats) {
					stat.algo = algorithms[stat.algo]
				}
				return res.result.stats
			}
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Build initial AxiosInstance with baseURL = "https://api.nicehash.com/api"
	 * @param endpoint
	 * @param {Object} [params]
	 * @returns {AxiosInstance}
	 */
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