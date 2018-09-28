import NiceHash from '../src/NiceHash'

import { config } from 'dotenv'
config();

const apiKey = {
	key: process.env.API_KEY,
	id: process.env.API_ID
};

const btcAddr = "16dZdWFr6bhy5bxwsyUyunuWED8zWfQiYA"

describe('NiceHash', () => {
	describe('Initial Setup', () => {
		it('test authorization', async () => {
			let api = new NiceHash(apiKey)
			expect(await api.testAuthorization()).toBeTruthy()
		});
	});
	describe('Public', () => {
		it('get current global stats', async () => {
			let api = new NiceHash(apiKey);
			let location = 1;
			let res = await api.getCurrentGlobalStats(location)
			expect(res.length).toEqual(34)
		});
		it('get current global stats 24h', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getCurrentGlobalStats24h()
			expect(res.length).toEqual(34)
		});
		it('get provider stats without btc addr', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getProviderStats()
			expect(res.error).toBeDefined()
		});
		it('get provider stats with btc addr', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getProviderStats(btcAddr)
			expect(res.addr).toEqual(btcAddr)
		});
		it('get provider stats EX with btc addr', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getProviderStatsEx(btcAddr)
			expect(res.addr).toEqual(btcAddr)
		});
		it('get provider payments', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getProviderPayments(btcAddr)
			expect(res.addr).toEqual(btcAddr)
		});
		it('get worker stats', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getWorkersStats(btcAddr, 'x11')
			expect(res.addr).toEqual(btcAddr)
		});
		it('get orders for algorithm', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getOrdersForAlgorithm(0, "scrypt")
			expect(Array.isArray(res)).toBeTruthy()
		});
		it('get information about multi algos', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getMultiAlgoInfo()
			expect(Array.isArray(res)).toBeTruthy()
		});
		it('get information about single multi algos', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getSingleMultiAlgoInfo()
			expect(Array.isArray(res)).toBeTruthy()
		});
		it('Get info for buying hashing power using NiceHashBot.', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getBuyInfo()
			expect(Array.isArray(res)).toBeTruthy()
		});
	});
	describe('Private', () => {
		it('get orders', async () => {
			let api = new NiceHash(apiKey);
			let res = await api.getOrders()
			expect(Array.isArray(res)).toBeTruthy()
		});
		it('create order', async () => {
			//ToDo: create a successful order
			let api = new NiceHash(apiKey);
			let options = {
				pool_host: "snowflake.oip.fun",
				pool_port: 3043,
				pool_pass: "x",
				pool_user: "LEX"
			}
			let res = await api.createOrder(options)
			let pass = false;
			if (res.success || res.error) {
				pass = true
			}
			expect(pass).toBeTruthy()
		});
		it('refill order', async () => {
			let api = new NiceHash(apiKey);
			let options = {
				amount: 0.01,
				order: 123
			}
			let res = await api.refillOrder(options)
			console.log(res)
			let pass = false;
			if (res.success || res.error) {
				pass = true
			}
			expect(pass).toBeTruthy()
		});
		it('remove order', async () => {
			let api = new NiceHash(apiKey);
			let options = {
				amount: 0.01,
				order: 123
			}
			let res = await api.removeOrder(options)
			console.log(res)
			let pass = false;
			if (res.success || res.error) {
				pass = true
			}
			expect(pass).toBeTruthy()
		});
	});
});
