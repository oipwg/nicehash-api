import NiceHash from '../src/NiceHash'

import { config } from 'dotenv'
config();

const apiKey = {
	key: process.env.API_KEY,
	id: process.env.API_ID
};

describe('NiceHash', () => {
	describe('Initial Setup', () => {
		it('test authorization', async () => {
			let api = new NiceHash(apiKey)
			expect(await api.testAuthorization()).toBeTruthy()
		})
	})
	describe('Stats', () => {
		it('get current global stats', async () => {
			let api = new NiceHash(apiKey);
			let location = 1;
			let res = await api.getCurrentGlobalStats(location)
			expect(res.length).toEqual(34)
		})
	})
});
