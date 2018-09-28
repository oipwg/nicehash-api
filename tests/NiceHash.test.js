import NiceHash from '../src/NiceHash'

import { config } from 'dotenv'
config()

const apiKey = {
	key: process.env.API_KEY,
	id: process.env.API_ID
};

describe('NiceHash', () => {
	describe('Initial Setup', () => {
		it('test authorization', async () => {
			let api = new NiceHash(apiKey)
			expect(await api.testAuthorization()).toEqual({
				result: { api_version: '1.2.7' }, method: null
			});
		})
	})
});
