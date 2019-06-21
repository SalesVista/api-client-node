# ![@salesvista/client](logo.png)

> Node.js SDK for the SalesVista REST API

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

The official Node.js SDK for the SalesVista REST API.

## Install

```console
$ npm i @salesvista/client
```

## API

### Quick Start

```js
// use a singleton instance
const svClient = require('@salesvista/client')
// or construct your own instance
const { SVClient } = require('@salesvista/client')
const svClient = new SVClient()

// configure the instance
svClient.configure({
  id: process.env.SALESVISTA_CLIENT_ID,
  secret: process.env.SALESVISTA_CLIENT_SECRET,
  orgSecret: process.env.SALESVISTA_ORG_SECRET
})

// request some data
const reps = await svClient.reps.getSearchableReps()

// validate a webhook request
const signature = req.header('SalesVista-Signature')
const payload = req.body
const isValid = svClient.isValidSignature(signature, payload)
```

### Auth token storage

Configure the client instance with your own cache strategy.

Here's an example using Redis:

```js
const { SVClient, CacheStrategy } = require('@salesvista/client')
const Redis = require('ioredis')

class RedisCacheStrategy extends CacheStrategy {
  constructor () {
    this.redis = new Redis(
      process.env.REDIS_PORT || 6379,
      process.env.REDIS_HOST || 'localhost',
      { password: process.env.REDIS_PASSWORD || null }
    )
    this.tokenKey = 'sv_client_token'
  }

  async getToken () {
    const token = await this.redis.get(this.tokenKey)
    return token && JSON.parse(token)
  }

  async setToken (token) {
    if (token.expires_in > 180) {
      await this.redis.setex(this.tokenKey, token.expires_in - 120, JSON.stringify(token))
    }
  }
}

const svClient = new SVClient({
  id: process.env.SALESVISTA_CLIENT_ID,
  secret: process.env.SALESVISTA_CLIENT_SECRET,
  orgSecret: process.env.SALESVISTA_ORG_SECRET,
  cacheStrategy: new RedisCacheStrategy()
})
```

## License

Apache 2.0 © SalesVista, LLC
