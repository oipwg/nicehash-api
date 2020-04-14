import Api from '../src/api';
import config from '../src/config';

describe('api', () => {
  it('get btc balance', async () => {
    let api = new Api(config);
    let res = await api.getBalance();
    res = parseFloat(res);
    expect(res).not.toBeNaN();
  });
});
