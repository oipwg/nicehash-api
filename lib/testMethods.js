"use strict";

var _config = _interopRequireDefault(require("./config"));

var _api = _interopRequireDefault(require("./api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = function log() {
  return console.log(...arguments);
};

const api = new _api.default(_config.default); // api.getBalance()
// api.createOrder()
// api.createOrEditPool()
// api.getAlgoSetting()
// api.getPools()
// api.deletePool()
// api.getPoolInfo();
// api.getOrders()
// api.refillOrder()
// api.cancelOrder()
// api.updatePriceandLimit()
// api.getOrders()
// api.verifyPool()
// api.createWithdrawlAddress()
// api.createWithdrawlRequest()
// api.getWithdrawalAddresses()
// api.getExchangeSetting()
// api.getDepositAddresses()
// Public
// api.getCurrentGlobalStats()
// api.getCurrentGlobalStats24h()
// api.getOrdersForAlgorithm()
// api.getSingleMultiAlgoInfo();
// api.getBuyInfo()
// api.testAuthorization()