"use strict";

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
      this.id = settings.id;
    }

    this.api = querystring => {
      return (0, _axios.default)().create({
        baseURL: `${this.base_url}${querystring}`,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }.params
      });
    };
  }

  async testAuthorization() {
    let endpoint = '/api';

    try {
      return await this.api.get(endpoint);
    } catch (err) {
      throw new Error(`Test Authorization request failed: ${err}`);
    }
  }

}