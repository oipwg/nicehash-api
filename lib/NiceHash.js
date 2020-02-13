"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.regexp.split");

require("core-js/modules/es6.regexp.to-string");

var _lodash = _interopRequireDefault(require("lodash"));

var _cryptoJs = _interopRequireDefault(require("crypto-js"));

var _axios = _interopRequireDefault(require("axios"));

var _algorithms = _interopRequireDefault(require("./algorithms"));

var _config = _interopRequireDefault(require("../config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const API_BASE_URL = 'https://api2.nicehash.com/';
const API_TIME_URL = '';
const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 1000 * 10
};
/**
 * An importable JavaScript class to make REST requests to the NiceHash APi
 */
//import { API_KEY, API_SECRET, API_ID } from '../apikey';

function createNonce() {
  var s = '',
      length = 32;

  do {
    s += Math.random().toString(36).substr(2);
  } while (s.length < length);

  s = s.substr(0, length);
  return s;
}

const getAuthHeader = function getAuthHeader(apiKey, apiSecret, time, nonce) {
  let organizationId = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';
  let request = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

  const hmac = _cryptoJs.default.algo.HMAC.create(_cryptoJs.default.algo.SHA256, apiSecret);

  hmac.update(apiKey);
  hmac.update('\0');
  hmac.update(time);
  hmac.update('\0');
  hmac.update(nonce);
  hmac.update('\0');
  hmac.update('\0');
  if (organizationId) hmac.update(organizationId);
  hmac.update('\0');
  hmac.update('\0');
  hmac.update(request.method);
  hmac.update('\0');
  hmac.update(request.path);
  hmac.update('\0');
  if (request.query) hmac.update(typeof request.query == 'object' ? qs.stringify(request.query) : request.query);

  if (request.body) {
    hmac.update('\0');
    hmac.update(typeof request.body == 'object' ? JSON.stringify(request.body) : request.body);
  }

  return apiKey + ':' + hmac.finalize().toString(_cryptoJs.default.enc.Hex);
};

class NiceHash {
  /**
   * instantiate a NiceHash class that you can use to make REST requests to the NiceHash API
   * @param {string} apiKey - NiceHash api key
   * @param {string|number} organizationId- NiceHash api id
   * @param {string} apiSecret - NiceHash api secret
   */
  constructor(_ref) {
    let {
      locale,
      apiHost,
      apiKey,
      orgId
    } = _ref;

    /**
     * Creates a new client
     * @param {object} options
     * @param options.apiKey - API Key
     * @param options.apiSecret - API Secret
     * @param options.orgsnizationId - Organization Id
     */
    this.locale = locale || 'en';
    this.host = apiHost;
    this.key = apiKey;
    this.secret = apiSecret;
    this.org = orgId;
    this.localTimeDiff = null; //todo: delme
    // this.apiKey = _.get(options, 'apiKey');
    // this.apiSecret = _.get(options, 'apiSecret');
    // this.organizationId = _.get(options, 'organizationId', '');
    // this.axios = axios.create(axiosConfig);
  } //! ----------------------------PUBLIC----------------------------------


  getTime() {
    return request({
      uri: this.host + '/api/v2/time',
      json: true
    }).then(res => {
      this.localTimeDiff = res.serverTime - +new Date();
      this.time = res.serverTime;
      return res;
    });
  }

  apiCall(method, path) {
    let {
      query,
      body,
      time
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (this.localTimeDiff === null) {
      return Promise.reject(new Error('Get server time first .getTime()'));
    } // query in path


    var [pathOnly, pathQuery] = path.split('?');
    if (pathQuery) query = _objectSpread({}, qs.parse(pathQuery), {}, query);
    const nonce = createNonce();
    const timestamp = (time || +new Date() + this.localTimeDiff).toString();
    const options = {
      uri: this.host + pathOnly,
      method: method,
      headers: {
        'X-Request-Id': nonce,
        'X-User-Agent': 'NHNodeClient',
        'X-Time': timestamp,
        'X-Nonce': nonce,
        'X-User-Lang': this.locale,
        'X-Organization-Id': this.org,
        'X-Auth': getAuthHeader(this.key, this.secret, timestamp, nonce, this.org, {
          method,
          path: pathOnly,
          query,
          body
        })
      },
      qs: query,
      body,
      json: true
    };
    return request(options);
  }

  get(path, options) {
    return this.apiCall('GET', path, options);
  }

  post(path, options) {
    return this.apiCall('POST', path, options);
  }

  put(path, options) {
    return this.apiCall('PUT', path, options);
  }

  delete(path, options) {
    return this.apiCall('DELETE', path, options);
  } // ! -----------------------

  /**
   * Test Authorization
   * @async
   * @returns {Promise<Boolean>}
   */


  testAuthorization() {
    console.log(this.apiKey);
    return !!this.apiKey && !!this.apiSecret;
  }

  getAuthParams() {
    return {
      key: this.apiKey,
      seccret: this.apiSecret
    };
  }

  getRandomString() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  generateInputBuffer(inputList) {
    // Generate list of Buffer
    let bufferList = [];

    for (let i = 0; i < inputList.length; i++) {
      if (inputList[i] != '') {
        bufferList.push(Buffer.from(inputList[i], 'latin1')); // assuming ISO-8859-1 and LATIN_1 are the same Charset
      } // Add zero byte (0x00) seperator between bytes of input's ordered fields


      if (i != inputList.length - 1) {
        bufferList.push(Buffer.from([0x00]));
      }
    } // Join all Buffer in list


    return Buffer.concat(bufferList);
  }

  generateHmacSha256Signature(inputList) {
    return 'signature';
  }

  async getHeaders(httpMethod, requestPath, params) {
    return 'headers';
  }

  getHeadersUnsigned() {
    return {
      'user-agent': "NiceHashJs/".concat(pkg.version, " (https://github.com/dannychua/nicehashjs2)")
    };
  }

  getRequestPromise(httpMethod, requestPath, params) {
    const payload = _lodash.default.merge({
      headers: this.getHeaders(httpMethod, requestPath, params)
    }, {
      params: params
    });

    let api = this.api('');
    console.log('payload is', payload);
    console.log('api', api);
    console.log('this', this.api);
    console.log('axios', this.axios);
    return this.axios.get(requestPath, payload);
  }

  getUnsignedRequestPromise(httpMethod, requestPath, params) {
    const payload = _lodash.default.merge({
      headers: this.getHeadersUnsigned()
    }, {
      params: params
    });

    return this.api.get(requestPath, payload);
  }
  /**
   * Get current profitability (price) and hashing speed for all algorithms. Refreshed every 30 seconds.
   * ${number} [location] - 0 for Europe, 1 for USA. Both if omitted.
   * @async
   * @return {Promise<Array.<Object>>}
   */


  async getCurrentGlobalStats(location) {
    let params = {
      method: 'GET',
      location
    };
    let api = this.api('main/api/v2/public/stats/global/current', params);

    try {
      let res = (await api.get()).data;

      if (res.algos) {
        for (let stat of res.algos) {
          stat.algos = _algorithms.default[stat.a];
        }

        return res.algos;
      }
    } catch (err) {
      throw new Error("Failed to get current global state: ".concat(err));
    }
  } // async getAllAlgos() {
  // https://api2.nicehash.com/main/api/v2/mining/algorithms/
  //   try {
  //     let res = await this.api.get().data;
  //     console.log(res);
  //   } catch (error) {}
  // }

  /**
   * Get average profitability (price) and hashing speed for all algorithms in past 24 hours.
   * @async
   * @return {Promise<Array.<Object>>}
   */


  async getCurrentGlobalStats24h() {
    let params = {
      method: 'GET'
    };
    let api = this.api('main/api/v2/public/stats/global/24h', params);

    try {
      let res = (await api.get()).data;

      if (res.algos) {
        for (let stat of res.algos) {
          stat.algos = _algorithms.default[stat.a];
        }

        return res.algos;
      }
    } catch (err) {
      throw new Error("Failed to get current global state: ".concat(err));
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
      method: 'GET',
      addr
    };
    let api = this.api('main/api/v2/public/stats/provider', params);

    try {
      let res = (await api.get()).data;
      return res.result;
    } catch (err) {
      throw new Error("Failed to get current global state: ".concat(err));
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
      method: 'stats.provider.ex',
      addr,
      from
    };
    let api = this.api('', params);

    try {
      let res = (await api.get()).data;
      return res.result;
    } catch (err) {
      throw new Error("Failed to get current global state: ".concat(err));
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
      method: 'stats.provider.payments',
      addr,
      from
    };
    let api = this.api('', params);

    try {
      let res = (await api.get()).data;
      return res.result;
    } catch (err) {
      throw new Error("Failed to get payments for provider: ".concat(err));
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
      method: 'stats.provider.workers',
      addr,
      algo: checkAlgo(algo)
    };
    let api = this.api('', params);

    try {
      let res = (await api.get()).data;
      return res.result;
    } catch (err) {
      throw new Error("Failed to get stats for provider's workers: ".concat(err));
    }
  }
  /**
   * Get all orders for certain algorithm. Refreshed every 30 seconds.
   * @param {number} location - 1 for Europe (NiceHash), 2 for USA (WestHash);
   * @param {number|string} algo - Algorithm marked with ID or its name.
   * @async
   * @return {Promise<Array.<Object>>}
   */


  async getOrdersForAlgorithm(location, algo) {
    let market;

    if (typeof algo === 'number') {
      algo = convertIDtoAlgo(algo);
    }

    switch (location) {
      case 1:
        market = 'EU';
        break;

      case 2:
        market = 'USA';
        break;

      default:
        market = '';
    }

    let params = {
      market: market,
      algorithm: algo.toUpperCase()
    };
    let api = this.api('main/api/v2/public/orders/', params);

    try {
      let res = (await api.get()).data;

      if (res.list) {
        return res.list;
      }
    } catch (err) {
      throw new Error("Failed to get orders for algo: ".concat(err));
    }
  }
  /**
   * Get information about Mult-Algorithm Mining
   * @async
   * @returns {Promise<Array.<Object>>}
   */


  async getMultiAlgoInfo() {
    let params = {
      method: 'multialgo.info'
    };
    let api = this.api('', params);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result.multialgo;
      }
    } catch (err) {
      throw new Error("Failed to get multi algo info: ".concat(err));
    }
  }
  /**
   * Get information about Simple Multi-Algorithm Mining
   * @async
   * @returns {Promise<Array.<Object>>}
   */


  async getSingleMultiAlgoInfo() {
    let params = {
      method: 'simplemultialgo.info'
    };
    let api = this.api('', params);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result.simplemultialgo;
      }
    } catch (err) {
      throw new Error("Failed to get single multi algo info: ".concat(err));
    }
  }
  /**
   * Get needed information for buying hashing power using NiceHashBot.
   * @async
   * @returns {Promise<Array.<Object>>}
   */


  async getBuyInfo() {
    let params = {
      method: 'buy.info'
    };
    let api = this.api('', params);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result.algorithms;
      }
    } catch (err) {
      throw new Error("Failed to get buy info: ".concat(err));
    }
  } //----------------------------PRIVATE----------------------------------

  /**
   * Get all orders for certain algorithm owned by the customer. Refreshed every 30 seconds.
   * @param {Object} options
   * @param {number} [options.location=0] - 0 for Europe (NiceHash), 1 for USA (WestHash);
   * @param {number|string} [options.algo="scrypt"] - Algorithm ID or name
   * @async
   * @returns {Promise<Array.<Object>>}
   */


  async getOrders() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (!this.id || !this.key) throw new Error('Must provide api key and api id on initialize');
    options = _objectSpread({
      method: 'orders.get',
      my: ''
    }, this.apikey, {
      location: options.location || 0,
      algo: checkAlgo(options.algo) || 0
    });
    let api = this.api('', options);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result.orders;
      }
    } catch (err) {
      throw new Error("Failed to get orders: ".concat(err));
    }
  }
  /**
   * Create new order. Only standard orders can be created with use of API.
   * @param options
   * @param {string} options.pool_host - Pool hostname or IP;
   * @param {string} options.pool_port - Pool port
   * @param {string} options.pool_user - Pool username
   * @param {string} options.pool_pass - Pool password
   * @param {string|number} [options.location=1] - 0 for Europe (NiceHash), 1 for USA (WestHash);
   * @param {string|number} [options.algo='scrypt'] - Algorithm name or ID
   * @param {string|number} [options.amount=0.005]  - Pay amount in BTC;
   * @param {string|number} [options.price=] - Price in BTC/GH/day or BTC/TH/day;
   * @param {string|number} [options.limit=0.01] - Speed limit in GH/s or TH/s (0 for no limit);
   * @param {string|number} [options.code] - This parameter is optional. You have to provide it if you have 2FA enabled. You can use NiceHash2FA Java application to generate codes.
   * @async
   * @returns {Promise<Object>}
   */


  async createOrder() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (!this.id || !this.key) throw new Error('Must provide api key and api id on initialize');
    options = _objectSpread({
      method: 'orders.create'
    }, this.apikey, {
      location: options.location || 1,
      algo: checkAlgo(options.algo) || 0,
      amount: options.amount || 0.005,
      price: options.price,
      limit: options.limit || 0.01,
      pool_host: options.pool_host,
      pool_port: options.pool_port,
      pool_user: options.pool_user,
      pool_pass: options.pool_pass || 'x',
      code: options.code || undefined
    });
    let api = this.api('', options);

    try {
      return (await api.get()).data;
    } catch (err) {
      throw new Error("Failed to create orders: ".concat(err));
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


  async refillOrder() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (!this.id || !this.key) throw new Error('Must provide api key and api id on initialize');
    options = _objectSpread({
      method: 'orders.refill'
    }, this.apikey, {
      location: options.location || 0,
      algo: checkAlgo(options.algo) || 0,
      order: options.order,
      amount: options.amount
    });
    let api = this.api('', options);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result;
      }
    } catch (err) {
      throw new Error("Failed to refill orders: ".concat(err));
    }
  }
  /**
   * Remove existing order.
   * @param {string|number} location=0 - 0 for Europe (NiceHash), 1 for USA (WestHash);
   * @param {string|number} algo="scrypt" - Algorithm name or ID
   * @param {string|number} order - Order ID
   * @async
   * @returns {Promise<Object>}
   */


  async removeOrder(id, location, algo) {
    if (!this.id || !this.key) throw new Error('Must provide api key and api id on initialize');

    let options = _objectSpread({
      method: 'orders.remove'
    }, this.apikey, {
      location: location || 1,
      algo: checkAlgo(algo) || 0,
      order: id
    });

    let api = this.api('', options);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result;
      }
    } catch (err) {
      throw new Error("Failed to remove orders: ".concat(err));
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


  async setOrderPrice() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (!this.id || !this.key) throw new Error('Must provide api key and api id on initialize');
    options = _objectSpread({
      method: 'orders.set.price'
    }, this.apikey, {
      location: options.location || 0,
      algo: checkAlgo(options.algo) || 0,
      order: options.order,
      price: options.price
    });
    let api = this.api('', options);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result;
      }
    } catch (err) {
      throw new Error("Failed to set order price: ".concat(err));
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


  async decreaseOrderPrice() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (!this.id || !this.key) throw new Error('Must provide api key and api id on initialize');
    options = _objectSpread({
      method: 'orders.set.price.decrease'
    }, this.apikey, {
      location: options.location || 0,
      algo: checkAlgo(options.algo) || 0,
      order: options.order
    });
    let api = this.api('', options);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result;
      }
    } catch (err) {
      throw new Error("Failed to decrease order price: ".concat(err));
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


  async setOrderLimit() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (!this.id || !this.key) throw new Error('Must provide api key and api id on initialize');
    options = _objectSpread({
      method: 'orders.set.limit'
    }, this.apikey, {
      location: options.location || 0,
      algo: checkAlgo(options.algo) || 0,
      limit: options.limit || 0,
      order: options.order
    });
    let api = this.api('', options);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result;
      }
    } catch (err) {
      throw new Error("Failed to set order limit: ".concat(err));
    }
  }
  /**
   * Get current confirmed Bitcoin balance.
   * @async
   * @returns {Promise<Number>}
   */
  // async getBalance() {
  //   if (!this.apiKey || !this.apiSecret)
  //     throw new Error('Must provide api key and api id on initialize');
  //   let options = {
  //     method: 'GET',
  //     headers: {
  //       API_KEY: this.apiKey,
  //       'X-Time': getCurrentTime(),
  //       'X-Nonce': 'dope',
  //       'X-Orgamization-ID': this.organizationId
  //     }
  //   };
  //   let api = this.api('main/api/v2/accounting/account2/BTC', options);
  //   try {
  //     let res = (await api.get()).data;
  //     if (res.result) {
  //       return res.result.balance_confirmed;
  //     }
  //   } catch (err) {
  //     throw new Error(`Failed to get balance: ${err}`);
  //   }
  // }


  async getBalance() {
    if (!this.org || !this.key) throw new Error('Must provide api key and api id on initialize');

    let options = _objectSpread({
      method: 'balance'
    }, this.key);

    let api = this.api('', options);

    try {
      let res = (await api.get()).data;

      if (res.result) {
        return res.result.balance_confirmed;
      }
    } catch (err) {
      throw new Error("Failed to get balance: ".concat(err));
    }
  } //-----------------------------UTIL------------------------------------

  /**
   * Build initial AxiosInstance with baseURL = "https://api.nicehash.com/api"
   * @param endpoint
   * @param {Object} [params]
   * @returns {AxiosInstance}
   */


  api(endpoint, params) {
    return _axios.default.create({
      baseURL: "".concat(API_BASE_URL).concat(endpoint),
      timeout: 1000 * 10,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      params
    });
  }

} //-----------------------------Helper Functions------------------------------------


const checkAlgo = algoName => {
  if (typeof algoName === 'string') {
    return convertAlgoToID(algoName);
  }

  return algoName;
};

const convertIDtoAlgo = algo => {
  if (typeof algo === 'number') {
    return _algorithms.default[algo];
  }
};

const convertAlgoToID = algo => {
  if (typeof algo === 'string') {
    for (let id in _algorithms.default) {
      if (_algorithms.default[id].toLowerCase() === algo.toLowerCase()) {
        return id;
      }
    }
  } else if (typeof algo === 'number') {
    if (_algorithms.default[algo]) return _algorithms.default.algo;
  } else return algo;
};

const getCurrentTime = () => {
  return Date.now().toString();
};

var _default = NiceHash;
exports.default = _default;