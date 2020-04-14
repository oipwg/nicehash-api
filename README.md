[![npm version](https://badge.fury.io/js/nicehash-api.svg)](https://badge.fury.io/js/nicehash-api)
[![Build Status](https://travis-ci.org/oipwg/nicehash-api.svg?branch=master)](https://travis-ci.org/oipwg/nicehash-api)

# NiceHash API

nicehash-api is a JavaScript wrapper library over the NiceHash API,
using es6/7 async functionality. Create a NiceHash account first, generate an API key and id,
and enable API functionality within the Nice Hash settings.
Then simply download and import the library to
start using it. Initialize the NiceHash class with your api key and id, and
call any method defined in the documentation!

## Installation

To install `nicehash-api` for use in an application, install the latest version
from NPM and save it to your `package.json`. For this example
we're using `npm`

```bash
$ npm install nicehash-api
```

## Getting Started

To get started using the library, first import the `NiceHash` class
from the `nicehash-api` module.

```javascript
import NiceHash from 'nicehash-api'
```

After you have imported the api, you can go ahead and spawn a new
`NiceHash` Object. You must pass it your NiceHash api key and id or else
the class will not be able to make the API calls.

```javascript
let NiceHash = new NiceHash(config)
```

# Create config.js file

```javascript
export default {
    //two different keys for production and testing. 
    apiHost: 'https://api2.nicehash.com', //use https://api-test.nicehash.com for development
    apiKey: '',
    //get it here: https://test.nicehash.com/my/settings/keys
    //or
    //https://new.nicehash.com/my/settings/keys
    apiSecret: '',
    orgId: '',
}
```

## Using your first method

To make sure the class was initiliazed correctly, we can test authorization by
calling:

```javascript
await NiceHash.testAuthorization()
```

This library wraps every function in a es7 async/await wrapper. If instead you
wish to deal with promises in a different way, feel free to do:

```javascript
NiceHash.testAuthorization()
    .then(success => success)
    .catch(err => err)
```

We recommend using `async/await` as it makes the code more terse. `await` will
resolve the promise in a synchronous manner that allows one to expect deterministic
behavior.

If `NiceHash.testAuthorization()` returns true then you are good to go!
Check out the rest of the documentation to see what else you can do!

## Documentation (not up to date);

https://oipwg.github.io/nicehash-api/

### Current list of methods

all params are type string - unless specified.

```javascript

// public api
.getCurrentGlobalStats()
.getCurrentGlobalStats24h()
.getOrdersForAlgorithm(market, algorithm)
.getSingleMultiAlgoInfo()
.getBuyInfo()

// private api
.getBalance(currency) //currency param optional
.getExchangeSetting()
.getAlgoSetting()

// pools
.createOrEditPool(
        id, // //Pool id (Required only if editing pool data)
        algorithm // Number | String
        name,
        username,
        password = 'x',
        stratumHostname,
        stratumPort //Number
    )
.getPoolInfo(poolId)
.deletePool(poolId)
.getPools(size = 100, page = 0) //default params
.verifyPool(
        password,
        username,
        stratumPort, //Number
        stratumHost,
        miningAlgorithm = 'SCRYPT',
        poolVerificationServiceLocation = 'USA'
    )
// Orders
.getOrders(
        algorithm,
        status = '',
        active = '',
        market = 'EU', //String | Number 1 = EU, 2 = USA
        ts,
        op,
        maxResults
    )
.createOrder(
        type = 'STANDARD',
        limit, //String | Number
        poolId,
        price, //String | Number
        marketFactor, //(Big decimal scaled to 8 decimal points ) String
        displayMarketFactor,
        amount, //Pay amount in BTC;
        market, //1 for Europe (NiceHash), 2 for USA (WestHash)
        algorithm = 'SCRYPT' //String | Number
    )
.refillOrder(orderId, amount)
.updatePriceandLimit(
        orderId,
        limit,
        price,
        marketFactor = '1000000000000',
        displayMarketFactor = 'TH'
    )
.cancelOrder(orderId)

// Withdrawl
.createWithdrawlAddress(
        type,
        address,
        name,
        currency
    )
.createWithdrawlRequest(withdrawalAddressId, amount, currency)
.getWithdrawalAddresses(currency, size = 100, page = 0)

// Deposit Address
.getDepositAddresses(currency)


```
