import axios from 'axios';
import qs from 'qs';
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
			this.apikey = {key: this.key, id: this.id}
		}
	}

	//----------------------------PUBLIC----------------------------------
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
			throw new Error(`Failed to get payments for provider: ${err}`)
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
			throw new Error(`Failed to get stats for provider's workers: ${err}`)
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
			throw new Error(`Failed to get orders for algo: ${err}`)
		}
	}

	/**
	 * Get information about Mult-Algorithm Mining
	 * @async
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
			throw new Error(`Failed to get multi algo info: ${err}`)
		}
	}

	/**
	 * Get information about Simple Multi-Algorithm Mining
	 * @async
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
			throw new Error(`Failed to get single multi algo info: ${err}`)
		}
	}

	/**
	 * Get needed information for buying hashing power using NiceHashBot.
	 * @async
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
			throw new Error(`Failed to get buy info: ${err}`)
		}
	}

	//----------------------------PRIVATE----------------------------------
	/**
	 * Get all orders for certain algorithm owned by the customer. Refreshed every 30 seconds.
	 * @param {Object} options
	 * @param {number} [options.location=0] - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {number|string} [options.algo="scrypt"] - Algorithm ID or name
	 * @async
	 * @returns {Promise<Array.<Object>>}
	 */
	async getOrders(options = {}) {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		options = {
			method: "orders.get",
			my: '',
			...this.apikey,
			location: options.location || 0,
			algo: checkAlgo(options.algo) || 0
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result.orders
			}
		} catch (err) {
			throw new Error(`Failed to get orders: ${err}`)
		}
	}

	/**
	 * Create new order. Only standard orders can be created with use of API.
	 * @param options
	 * @param {string|number} options.location - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {string|number} options.algo - Algorithm name or ID
	 * @param {string|number} options.amount - Pay amount in BTC;
	 * @param {string|number} options.price - Price in BTC/GH/day or BTC/TH/day;
	 * @param {string|number} options.limit=0 - Speed limit in GH/s or TH/s (0 for no limit);
	 * @param {string} options.pool_host - Pool hostname or IP;
	 * @param {string} options.pool_port - Pool port
	 * @param {string} options.pool_user - Pool username
	 * @param {string} options.pool_pass - Pool password
	 * @param {string|number} [options.code] - This parameter is optional. You have to provide it if you have 2FA enabled. You can use NiceHash2FA Java application to generate codes.
	 * @async
	 * @returns {Promise<Object>}
	 */
	async createOrder(options = {}) {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		options = {
			method: "orders.create",
			...this.apikey,
			location: options.location || 0,
			algo: checkAlgo(options.algo) || 0,
			amount: options.amount || 0.01,
			price: options.price || 2.9,
			limit: options.limit || 0,
			pool_host: options.pool_host,
			pool_port: options.pool_port,
			pool_user: options.pool_user,
			pool_pass: options.pool_pass,
			code: options.code || undefined
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result
			}
		} catch (err) {
			throw new Error(`Failed to create orders: ${err}`)
		}
	}

	/**
	 * Create new order. Only standard orders can be created with use of API.
	 * @param options
	 * @param {string|number} options.location=0 - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {string|number} options.algo="scrypt" - Algorithm name or ID
	 * @param {string|number} options.amount - Pay amount in BTC;
	 * @param {string|number} options.order - Order ID
	 * @async
	 * @returns {Promise<Object>}
	 */
	async refillOrder(options = {}) {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		options = {
			method: "orders.refill",
			...this.apikey,
			location: options.location || 0,
			algo: checkAlgo(options.algo) || 0,
			order: options.order,
			amount: options.amount,
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result
			}
		} catch (err) {
			throw new Error(`Failed to refill orders: ${err}`)
		}
	}

	/**
	 * Remove existing order.
	 * @param options
	 * @param {string|number} options.location=0 - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {string|number} options.algo="scrypt" - Algorithm name or ID
	 * @param {string|number} options.order - Order ID
	 * @async
	 * @returns {Promise<Object>}
	 */
	async removeOrder(options = {}) {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		options = {
			method: "orders.remove",
			...this.apikey,
			location: options.location || 0,
			algo: checkAlgo(options.algo) || 0,
			order: options.order,
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result
			}
		} catch (err) {
			throw new Error(`Failed to remove orders: ${err}`)
		}
	}

	/**
	 * Set new price for the existing order. Only increase is possible.
	 * @param options
	 * @param {string|number} options.location=0 - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {string|number} options.algo="scrypt" - Algorithm name or ID
	 * @param {string|number} options.price - Price in BTC/GH/Day or BTC/TH/Day.
	 * @param {string|number} options.order - Order ID/number
	 * @async
	 * @returns {Promise<Object>}
	 */
	async setOrderPrice(options = {}) {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		options = {
			method: "orders.set.price",
			...this.apikey,
			location: options.location || 0,
			algo: checkAlgo(options.algo) || 0,
			order: options.order,
			price: options.price,
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result
			}
		} catch (err) {
			throw new Error(`Failed to set order price: ${err}`)
		}
	}

	/**
	 * Decrease price for the existing order. Price decrease possible every 10 minutes
	 * @param options
	 * @param {string|number} options.location=0 - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {string|number} options.algo="scrypt" - Algorithm name or ID
	 * @param {string|number} options.order - Order ID/number
	 * @async
	 * @returns {Promise<Object>}
	 */
	async decreaseOrderPrice(options = {}) {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		options = {
			method: "orders.set.price.decrease",
			...this.apikey,
			location: options.location || 0,
			algo: checkAlgo(options.algo) || 0,
			order: options.order,
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result
			}
		} catch (err) {
			throw new Error(`Failed to decrease order price: ${err}`)
		}
	}

	/**
	 * Set new limit for the existing order.
	 * @param options
	 * @param {string|number} options.location=0 - 0 for Europe (NiceHash), 1 for USA (WestHash);
	 * @param {string|number} options.algo="scrypt" - Algorithm name or ID
	 * @param {string|number} options.amount - Pay amount in BTC;
	 * @param {string|number} options.order - Order ID/number;
	 * @param {string|number} options.limit=0 - Speed limit in GH/s or TH/s (0 for no limit);
	 * @async
	 * @returns {Promise<Object>}
	 */
	async setOrderLimit(options = {}) {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		options = {
			method: "orders.set.limit",
			...this.apikey,
			location: options.location || 0,
			algo: checkAlgo(options.algo) || 0,
			limit: options.limit || 0,
			order: options.order
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result
			}
		} catch (err) {
			throw new Error(`Failed to set order limit: ${err}`)
		}
	}

	/**
	 * Get current confirmed Bitcoin balance.
	 * @async
	 * @returns {Promise<Object>}
	 */
	async getBalance() {
		if (!this.id || !this.key)
			throw new Error('Must provide api key and api id on initialize')
		let options = {
			method: "balance",
			...this.apikey
		}
		let api = this.api("", options);
		try {
			let res = (await api.get()).data;
			if (res.result) {
				return res.result.balance_confirmed
			}
		} catch (err) {
			throw new Error(`Failed to get balance: ${err}`)
		}
	}
	//-----------------------------UTIL------------------------------------
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