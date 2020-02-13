import config from './config'
import NiceHashApi from './api'

var log = function() {
    return console.log(...arguments)
}
const api = new NiceHashApi(config)

// api.getBalance()
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
