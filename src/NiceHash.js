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
	 * @async
	 * @returns {Promise<Boolean>}
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
	 * @async
	 * @return {Promise<Array.<Object>>}
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
	 * Get average profitability (price) and hashing speed for all algorithms in past 24 hours.
	 * @async
	 * @return {Promise<Array.<Object>>}
	 */
	async getCurrentGlobalStats24h() {
		let params = {
			method: "stats.global.24h",
		};
		let api = this.api("", params);
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
	 * Get current stats for provider for all algorithms. Refreshed every 30 seconds. It also returns past 56 payments
	 * @param {string} addr - Provider's BTC address.
	 * @async
	 * @return {Promise<Object>}
	 */
	async getProviderStats(addr) {
		let params = {
			method: "stats.provider",
			addr
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			return res.result
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Get detailed stats for provider for all algorithms including history data and payments in past 7 days.
	 * @param {string} addr - Provider's BTC address.
	 * @param {number} [from] - Get history data from this time (UNIX timestamp). This parameter is optional and is by default considered to be 0 (return complete history)
	 * @async
	 * @return {Promise<Object>}
	 */
	async getProviderStatsEx(addr, from) {
		let params = {
			method: "stats.provider.ex",
			addr,
			from
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			return res.result
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Get payments for provider.
	 * @param {string} addr - Provider's BTC address.
	 * @param {number} [from] - Get history data from this time (UNIX timestamp). This parameter is optional and is by default considered to be 0 (return complete history)
	 * @async
	 * @return {Promise<Object>}
	 */
	async getProviderPayments(addr, from) {
		let params = {
			method: "stats.provider.payments",
			addr,
			from
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			return res.result
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Get detailed stats for provider's workers (rigs).
	 * @param {string} addr - Provider's BTC address;
	 * @param {number|number} algo - Algorithm marked with ID or its name
	 * @async
	 * @return {Promise<Object>}
	 */
	async getWorkersStats(addr, algo) {
		let params = {
			method: "stats.provider.workers",
			addr,
			algo: checkAlgo(algo)
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			return res.result
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Get all orders for certain algorithm. Refreshed every 30 seconds.
	 * @param {number} location - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {number|string} algo - Algorithm marked with ID or its name.
	 * @async
	 * @return {Promise<Array.<Object>>}
	 */
	async getOrdersForAlgorithm(location, algo) {
		let params = {
			method: "orders.get",
			location,
			algo: checkAlgo(algo)
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result.orders
			}
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Get information about Mult-Algorithm Mining
	 * @returns {Promise<Array.<Object>>}
	 */
	async getMultiAlgoInfo() {
		let params = {
			method: "multialgo.info"
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result.multialgo
			}
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Get information about Simple Multi-Algorithm Mining
	 * @returns {Promise<Array.<Object>>}
	 */
	async getSingleMultiAlgoInfo() {
		let params = {
			method: "simplemultialgo.info"
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result.simplemultialgo
			}
		} catch (err) {
			throw new Error(`Failed to get current global state: ${err}`)
		}
	}

	/**
	 * Get needed information for buying hashing power using NiceHashBot.
	 * @returns {Promise<Array.<Object>>}
	 */
	async getBuyInfo() {
		let params = {
			method: "buy.info"
		};
		let api = this.api("", params);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result.algorithms
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

const checkAlgo = (algoName) => {
	if (typeof algoName === 'string')
		return convertAlgoToID(algoName)
	return algoName
}
const convertAlgoToID = (algo) => {
	if (typeof algo === 'string') {
		for (let id in algorithms) {
			if (algorithms[id].toLowerCase() === algo.toLowerCase()) {
				return id
			}
		}
	} else if (typeof algo === 'number') {
		if (algorithms[algo])
			return algorithms.algo
	} else return algo
}

export default NiceHash