import CryptoJS from 'crypto-js'
import request from 'request-promise-native'
import qs from 'qs'
import algorithms from './algorithms'

var log = function() {
    return console.log(...arguments)
}

function createNonce() {
    var s = '',
        length = 32
    do {
        s += Math.random()
            .toString(36)
            .substr(2)
    } while (s.length < length)
    s = s.substr(0, length)
    return s
}

const getAuthHeader = (
    apiKey,
    apiSecret,
    time,
    nonce,
    organizationId = '',
    request = {}
) => {
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, apiSecret)

    hmac.update(apiKey)
    hmac.update('\0')
    hmac.update(time)
    hmac.update('\0')
    hmac.update(nonce)
    hmac.update('\0')
    hmac.update('\0')
    if (organizationId) hmac.update(organizationId)
    hmac.update('\0')
    hmac.update('\0')
    hmac.update(request.method)
    hmac.update('\0')
    hmac.update(request.path)
    hmac.update('\0')
    if (request.query)
        hmac.update(
            typeof request.query == 'object'
                ? qs.stringify(request.query)
                : request.query
        )
    if (request.body) {
        hmac.update('\0')
        hmac.update(
            typeof request.body == 'object'
                ? JSON.stringify(request.body)
                : request.body
        )
    }

    return apiKey + ':' + hmac.finalize().toString(CryptoJS.enc.Hex)
}

class NicehHashApi {
    constructor({ locale, apiHost, apiKey, apiSecret, orgId }) {
        this.locale = locale || 'en'
        this.host = apiHost
        this.key = apiKey
        this.secret = apiSecret
        this.org = orgId
        this.localTimeDiff = null
    }

    getTime() {
        return request({
            uri: this.host + '/api/v2/time',
            json: true,
        }).then(res => {
            this.localTimeDiff = res.serverTime - +new Date()
            this.time = res.serverTime
            return res
        })
    }

    apiCall(method, path, { query, body, time } = {}) {
        if (this.localTimeDiff === null) {
            return Promise.reject(new Error('Get server time first .getTime()'))
        }

        // query in path
        var [pathOnly, pathQuery] = path.split('?')
        if (pathQuery) query = { ...qs.parse(pathQuery), ...query }

        const nonce = createNonce()
        const timestamp = (time || +new Date() + this.localTimeDiff).toString()
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
                'X-Auth': getAuthHeader(
                    this.key,
                    this.secret,
                    timestamp,
                    nonce,
                    this.org,
                    {
                        method,
                        path: pathOnly,
                        query,
                        body,
                    }
                ),
            },
            qs: query,
            body,
            json: true,
        }

        return request(options)
    }

    get(path, options) {
        return this.apiCall('GET', path, options)
    }

    post(path, options) {
        return this.apiCall('POST', path, options)
    }

    put(path, options) {
        return this.apiCall('PUT', path, options)
    }

    delete(path, options) {
        return this.apiCall('DELETE', path, options)
    }

    /* ----------------------- TEST-------------------------------------- */

    testAuthorization() {
        if (!!this.key && !!this.org && !!this.secret) {
            this.getTime()
                .then(res => {
                    log('good to go 200', res)
                    return true
                })
                .catch(err => {
                    throw new Error(`Something went wrong... ${err}`)
                })
        } else {
            log('check config file')
            return false
        }
    }

    /* ----------------------- PUBLIC API -------------------------------------- */

    async getCurrentGlobalStats() {
        this.getTime()
            .then(() => this.get('/main/api/v2/public/stats/global/current'))
            .then(res => {
                if (res.algos) {
                    for (let stat of res.algos) {
                        stat.algo = algorithms[stat.a]
                    }
                    return res.algos
                }
            })
            .catch(err => {
                throw new Error(`Failed to get current global stats: ${err}`)
            })
    }

    /**
     * Get average profitability (price) and hashing speed for all algorithms in past 24 hours.
     * @async
     * @return {Promise<Array.<Object>>}
     */
    async getCurrentGlobalStats24h() {
        this.getTime()
            .then(() => this.get('/main/api/v2/public/stats/global/24h'))
            .then(res => {
                if (res.algos) {
                    for (let stat of res.algos) {
                        stat.algo = algorithms[stat.a]
                    }
                    return res.algos
                }
            })
            .catch(err => {
                throw new Error(
                    `Failed to get current global stats 24h: ${err}`
                )
            })
    }

    /**
     * Get all orders for certain algorithm. Refreshed every 30 seconds.
     * @param {number} location - 1 for Europe (NiceHash), 2 for USA (WestHash);
     * @param {number|string} algo - Algorithm marked with ID or its name.
     * @async
     * @return {Promise<Array.<Object>>}
     */
    async getOrdersForAlgorithm(market = 0, algo = 0) {
        if (typeof algo === 'number') {
            algo = convertIDtoAlgo(algo)
        }

        if (typeof market === 'number') {
            market = convertLocation(market)
        }

        let query = {
            market: market,
            algorithm: algo,
        }

        this.getTime()
            .then(() => this.get('/main/api/v2/public/orders/', { query }))
            .then(res => {
                return res.list
            })
            .catch(err => {
                throw new Error(
                    `Failed to get all orders for alogrithm: ${err}`
                )
            })
    }

    /**
     * Get information about Simple Multi-Algorithm Mining
     * @async
     * {
        miningAlgorithms:[List of mining algorithms ...
            {
                paying:string (Big decimal scaled to 8 decimal points)Mining algorithm price ...
                speed:string (Big decimal scaled to 8 decimal points)Mining algorithm speed ...
                title:string Title ...
                algorithm: SCRYPT | SHA256 | SCRYPTNF | X11 | X13 | KECCAK | X15 | NIST5 | NEOSCRYPT | LYRA2RE | WHIRLPOOLX | QUBIT | QUARK | AXIOM | LYRA2REV2 | SCRYPTJANENF16 | BLAKE256R8 | BLAKE256R14 | BLAKE256R8VNL | HODL | DAGGERHASHIMOTO | DECRED | CRYPTONIGHT | LBRY | EQUIHASH | PASCAL | X11GOST | SIA | BLAKE2S | SKUNK | CRYPTONIGHTV7 | CRYPTONIGHTHEAVY | LYRA2Z | X16R | CRYPTONIGHTV8 | SHA256ASICBOOST | ZHASH | BEAM | GRINCUCKAROO29 | GRINCUCKATOO31 | LYRA2REV3 | CRYPTONIGHTR | CUCKOOCYCLE | GRINCUCKAROOD29 | BEAMV2 | X16RV2 | RANDOMXMONERO | EAGLESONG | CUCKAROOM | GRINCUCKATOO32Algorithm ...
            }
        ]
    }       
     */
    async getSingleMultiAlgoInfo() {
        this.getTime()
            .then(() => this.get('/main/api/v2/public/simplemultialgo/info/'))
            .then(res => {
                return res.miningAlgorithms
            })
            .catch(err => {
                throw new Error(`Failed to get single multi algo info ${err}`)
            })
    }

    async getBuyInfo() {
        this.getTime()
            .then(() => this.get('/main/api/v2/public/buy/info/'))
            .then(res => {
                return res.miningAlgorithms
            })
            .catch(err => {
                throw new Error(`Failed to get buy info: ${err}`)
            })
    }

    /* ----------------------- PRIVATE API -------------------------------------- */

    //getBalance
    /**
     *
     * @param {string} currency - BTC | ETH | XRP | BCH | LTC | ZEC | DASH | XLM | EOS
     *                              | USDT | BSV | LINK | BAT | PAX | ZRX | HOT | OMG | REP
     *                              | NEXO | EURKM | TBTC | TETH | TXRP | TBCH | TLTC | TZEC
     *                              | TDASH | TXLM | TEOS | TERC | TBSV | TEURKM
     */
    // returns list of currency and balance;
    async getBalance(currency = '') {
        let query = {
            currency: currency.toUpperCase(),
        }

        this.getTime()
            .then(() => this.get('/main/api/v2/accounting/accounts', { query }))
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to get balance: ${err}`)
            })
    }

    async getExchangeSetting() {
        this.getTime()
            .then(() => this.get('/exchange/api/v2/info/status'))
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to get exchange setting: ${err}`)
            })
    }

    // not allowed in the U.S.
    async getOrderBook(marketSymbol = '', limit = 25) {
        let query = {
            market: marketSymbol,
            limit,
        }

        this.getTime()
            .then(() => this.get('/exchange/api/v2/orderbook/', { query }))
            .then(res => {
                log(res)
                return res
            })
            .catch(err => {
                throw new Error(`Failed to get exchange order book: ${err}`)
            })
    }

    async getAlgoSetting() {
        this.getTime()
            .then(() => this.get('/main/api/v2/mining/algorithms'))
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to get algorithm setting: ${err}`)
            })
    }

    //----------------------THEM POOLS----------------------------
    //! enable buying - api or on website
    //   CREATE OR EDIT POOL
    // Create or edit pool info
    // Required permissions:

    // Marketplace / Manage pools (MAPO)
    // creates pool - config for user
    // username is equvilent to flo addy - workername
    //! potential bug - check for typeof algo
    async createOrEditPool(
        id = '',
        algorithm = 0,
        name,
        username,
        password = 'x',
        stratumHostname,
        stratumPort
    ) {
        this.getTime()
            .then(() => {
                let body = {
                    algorithm: convertIDtoAlgo(algorithm),
                    name,
                    username,
                    password,
                    stratumHostname,
                    stratumPort,
                    id, //Pool id (Required only if editing pool data)
                }
                return this.post('/main/api/v2/pool', { body })
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to create or edit pool: ${err}`)
            })
    }

    async getPoolInfo(poolId) {
        this.getTime()
            .then(() => {
                return this.get(`/main/api/v2/pool/${poolId}`)
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to get pool info: ${err}`)
            })
    }

    // delete pool - pass poolId
    async deletePool(poolId) {
        this.getTime()
            .then(() => {
                return this.delete(`/main/api/v2/pool/${poolId}`)
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to delete pool: ${err}`)
            })
    }

    async getPools(size = 100, page = 0) {
        let query = {
            size,
            page,
        }

        this.getTime()
            .then(() => {
                return this.get(`/main/api/v2/pools/`, { query })
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to get pools: ${err}`)
            })
    }

    async verifyPool(
        password,
        username,
        stratumPort,
        stratumHost,
        miningAlgorithm = 'SCRYPT',
        poolVerificationServiceLocation = 'USA'
    ) {
        let body = {
            password,
            username,
            stratumPort, //number
            stratumHost,
            miningAlgorithm: miningAlgorithm.toUpperCase(),
            poolVerificationServiceLocation: poolVerificationServiceLocation.toUpperCase(), //EUROPE | USA
        }

        this.getTime()
            .then(() => {
                return this.post(`/main/api/v2/pools/verify/`, { body })
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to verify pool: ${err}`)
            })
    }

    //---------------------- HASHPOWER ORDERS ----------------------------

    /*
CREATE ORDER
Create order
Headers: X-Request-Id: (required, unique identifier of specific request, client should have local awareness that some app action should be done only once on server, if for some reason request is processed by server and client does not know anything about it (request failed). This ID will provide server information that it will not repeat action if it was already processed)

Required permissions:
Marketplace / Place, refill and cancel hashpower orders (PRCO)
  */

    async getOrders(
        algo,
        status = '',
        active = '',
        market = 'EU',
        ts,
        op,
        maxResults
    ) {
        if (typeof algo === 'number') {
            algo = convertIDtoAlgo(algo)
        }

        if (typeof market === 'number') {
            market = convertLocation(market)
        }

        this.getTime()
            .then(() => {
                let query = {
                    algorithm: algo ? algo.toUpperCase() : '', //optional
                    status, //optional
                    active, //optional - /* 	Show only active or not active orders (optional, active orders: PENDING, ACTIVE, PENDING_CANCELLATION, not active orders: CANCELLED, EXPIRED, ERROR, COMPLETED, ...) */
                    market, //optional
                    ts: ts || this.time, //! right now;
                    op: op || 'LE', //Less equal to.
                    limit: maxResults || 100,
                }
                return this.get('/main/api/v2/hashpower/myOrders/', { query })
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to create order: ${err}`)
            })
    }

    /**
     * Create new order. Only standard orders can be created with use of API.
     * @param {string} type - Hash power order type
     * @param {string|number} [limit=0.01] - Speed limit in GH/s or TH/s (0 for no limit);
     * @param {string} poolId - Pool id
     * @param {string|number} [price=] - Price in BTC/GH/day or BTC/TH/day;
     * @param {string} marketFactor - (Big decimal scaled to 8 decimal points )Used display market factor (numeric)
     * @param {string} displayMarketFactor - Used display market factor
     * @param {string|} amount=0.005  - Pay amount in BTC;
     * @param {string} algorithm - - Algorithm name or ID
     * @param {number} market - 1 for Europe (NiceHash), 2 for USA (WestHash)
     * @param {string|number} [code] - This parameter is optional. You have to provide it if you have 2FA enabled. You can use NiceHash2FA Java application to generate codes.
     * @async
     * @returns {Promise<Object> created order}
     * 
     * 
amount:string (Big decimal scaled to 8 decimal points)Amount in BTC ...
algorithm:SCRYPT | SHA256 | SCRYPTNF | X11 | X13 | KECCAK | X15 | NIST5 | NEOSCRYPT | LYRA2RE | WHIRLPOOLX | QUBIT | QUARK | AXIOM | LYRA2REV2 | SCRYPTJANENF16 | BLAKE256R8 | BLAKE256R14 | BLAKE256R8VNL | HODL | DAGGERHASHIMOTO | DECRED | CRYPTONIGHT | LBRY | EQUIHASH | PASCAL | X11GOST | SIA | BLAKE2S | SKUNK | CRYPTONIGHTV7 | CRYPTONIGHTHEAVY | LYRA2Z | X16R | CRYPTONIGHTV8 | SHA256ASICBOOST | ZHASH | BEAM | GRINCUCKAROO29 | GRINCUCKATOO31 | LYRA2REV3 | CRYPTONIGHTR | CUCKOOCYCLE | GRINCUCKAROOD29 | BEAMV2 | X16RV2 | RANDOMXMONERO | EAGLESONG | CUCKAROOM | GRINCUCKATOO32Algorithm ...
market:EU | USAMarket ...
}
     */

    async createOrder(
        type = 'STANDARD',
        limit,
        poolId,
        price,
        marketFactor,
        displayMarketFactor,
        amount,
        market,
        algorithm = 'SCRYPT'
    ) {
        if (typeof algo === 'number') {
            algo = convertIDtoAlgo(algo)
        }

        if (typeof market === 'number') {
            market = convertLocation(market)
        }

        this.getTime()
            .then(() => {
                var body = {
                    type: type.toUpperCase(),
                    limit,
                    poolId,
                    price,
                    marketFactor,
                    displayMarketFactor,
                    amount,
                    market: market,
                    algorithm: algorithm.toUpperCase(),
                }

                return this.post('/main/api/v2/hashpower/order', { body })
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to create order: ${err}`)
            })
    }

    /**
     * @param {string} orderId - Order Id
     * @param {string|number} amount - amount in BTC
     */
    async refillOrder(orderId, amount) {
        this.getTime()
            .then(() => {
                var body = {
                    amount,
                }
                return this.post(
                    `/main/api/v2/hashpower/order/${orderId}/refill/`,
                    { body }
                )
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to refill order: ${err}`)
            })
    }

    async updatePriceandLimit(
        orderId,
        limit,
        price,
        marketFactor = '1000000000000',
        displayMarketFactor = 'TH'
    ) {
        this.getTime()
            .then(() => {
                var body = {
                    marketFactor: marketFactor || '1000000000000',
                    displayMarketFactor: displayMarketFactor || 'TH',
                    limit,
                    price,
                }
                return this.post(
                    `/main/api/v2/hashpower/order/${orderId}/updatePriceAndLimit/`,
                    { body }
                )
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to update price and limit ${err}`)
            })
    }

    async cancelOrder(orderId) {
        this.getTime()
            .then(() => {
                return this.delete(`/main/api/v2/hashpower/order/${orderId}/`)
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Failed to cancel order: ${err}`)
            })
    }

    async setOrderPrice() {
        log('not built')
    }

    async decreaseOrderPrice() {
        log('not built')
    }

    async setOrderLimit() {
        log('not built')
    }

    //----------------------------- Withdrawl ------------------------------------

    async createWithdrawlAddress(
        // token, optional 2FA
        type,
        address,
        name,
        currency
    ) {
        let body = {
            type: type.toUpperCase(),
            address,
            name,
            currency: currency.toUpperCase(),
        }

        this.getTime()
            .then(() => {
                return this.post(`/main/api/v2/accounting/withdrawalAddress/`, {
                    body,
                })
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Fail create withdrawl address ${err}`)
            })
    }

    async createWithdrawlRequest(withdrawalAddressId, amount, currency) {
        let body = {
            withdrawalAddressId,
            amount,
            currency: currency.toUpperCase(),
        }

        this.getTime()
            .then(() => {
                return this.post(`/main/api/v2/accounting/withdrawal/`, {
                    body,
                })
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Fail create withdrawl address ${err}`)
            })
    }

    async getWithdrawalAddresses(currency, size = 100, page = 0) {
        let query = {
            currency: currency.toUpperCase(),
            size,
            page,
        }

        this.getTime()
            .then(() => {
                return this.get(
                    `/main/api/v2/accounting/withdrawalAddresses/`,
                    { query }
                )
            })
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(`Fail get withdrawal addys ${err}`)
            })
    }

    // Deposit Address
    async getDepositAddresses(currency) {
        let query = {
            currency: currency.toUpperCase(),
        }

        this.getTime()
            .then(() =>
                this.get('/main/api/v2/accounting/depositAddresses/', { query })
            )
            .then(res => {
                return res
            })
            .catch(err => {
                throw new Error(
                    `Failed to get deposit addresses, pass in currency: ${err}`
                )
            })
    }
}
//-----------------------------Helper Functions------------------------------------
const checkAlgo = algoName => {
    if (typeof algoName === 'string') {
        return convertAlgoToID(algoName)
    }
    return algoName
}

const convertIDtoAlgo = algo => {
    if (typeof algo === 'number') {
        return algorithms[algo].toUpperCase()
    }
}

const convertAlgoToID = algo => {
    if (typeof algo === 'string') {
        for (let id in algorithms) {
            if (algorithms[id].toLowerCase() === algo.toLowerCase()) {
                return id
            }
        }
    } else if (typeof algo === 'number') {
        if (algorithms[algo]) return algorithms.algo
    } else return algo
}

const convertLocation = location => {
    switch (location) {
        case 1:
            return 'EU'
        case 2:
            return 'USA'
        default:
            return ''
    }
}

export default NicehHashApi
