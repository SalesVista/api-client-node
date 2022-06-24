/*
Copyright 2019 SalesVista, LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const { SVError, SVApiError } = require('./errors')

class SVClient {
  static get defaultBaseUrl () {
    return 'https://api.salesvista.app'
  }

  static get (opts) {
    return new SVClient(opts)
  }

  constructor (opts) {
    this.orgId = null
    this.configure(opts)
  }

  configure (opts) {
    opts = opts || {}

    // credentials
    const id = opts.id || process.env.SALESVISTA_CLIENT_ID
    if (id && this.id !== id) {
      this.id = id
      this._basicAuth = null
    }
    const secret = opts.secret || process.env.SALESVISTA_CLIENT_SECRET
    if (secret && this.secret !== secret) {
      this.secret = secret
      this._basicAuth = null
    }
    this.orgSecret = opts.orgSecret || process.env.SALESVISTA_ORG_SECRET || this.orgSecret

    // configuration
    this._userAgent = opts.userAgent || this._userAgent
    if (opts.defaultHeaders) this.defaultHeaders = { ...this.defaultHeaders, ...opts.defaultHeaders }

    // can configure one baseUrl
    this.baseUrl = opts.baseUrl || this.baseUrl
    // or separate ones for oauth vs rest
    this._oauthBaseUrl = opts.oauthBaseUrl || this._oauthBaseUrl
    this._restBaseUrl = opts.restBaseUrl || this._restBaseUrl

    this._oauthRoot = opts.oauthRoot || this._oauthRoot
    this._restRoot = opts.restRoot || this._restRoot

    // TODO ignore invalid https (e.g. false)
    // TODO proxy agent (https-proxy-agent or http-proxy-agent or global-tunnel)
    // see https://github.com/slackapi/node-slack-sdk/tree/master/packages/webhook#proxy-requests-with-a-custom-agent
    // see https://www.npmjs.com/package/got#proxies

    // dependency injection
    this._got = opts.got || this._got
    this._cacheStrategy = opts.cacheStrategy || this._cacheStrategy

    // api modules
    this._customerCategories = opts.customerCategories || this._customerCategories
    this._customers = opts.customers || this._customers
    this._customFields = opts.customFields || this._customFields
    this._labels = opts.labels || this._labels
    this._org = opts.org || this._org
    this._productCategories = opts.productCategories || this._productCategories
    this._products = opts.products || this._products
    this._reps = opts.reps || this._reps
    this._sales = opts.sales || this._sales
    this._triggerEvents = opts.triggerEvents || this._triggerEvents

    return this
  }

  get crypto () {
    if (!this._crypto) {
      try {
        this._crypto = require('crypto')
      } catch (err) {
        throw new SVError('You are using a version of Node.js that doesn\'t support the `crypto` module. Signatures cannot be verified without it.').withCause(err)
      }
    }
    return this._crypto
  }

  async got () {
    if (!this._got) this._got = (await import('got')).default
    return this._got
  }

  get cacheStrategy () {
    if (!this._cacheStrategy) this._cacheStrategy = require('./cache-strategy').get()
    return this._cacheStrategy
  }

  get userAgent () {
    if (!this._userAgent) {
      const pkg = require('./package.json')
      let ua = pkg.name + '/' + pkg.version
      try {
        const host = require('os').hostname()
        if (host) ua += ` (${host})`
      } catch (_) {}
      this._userAgent = ua
    }
    return this._userAgent
  }

  get basicAuth () {
    if (!this._basicAuth && this.id && this.secret) {
      this._basicAuth = Buffer.from(this.id + ':' + this.secret, 'utf8').toString('base64')
    }
    return this._basicAuth
  }

  get oauthBaseUrl () {
    if (!this._oauthBaseUrl) {
      this._oauthBaseUrl = this._restBaseUrl || this.baseUrl || SVClient.defaultBaseUrl
    }
    return this._oauthBaseUrl
  }

  get oauthRoot () {
    if (!this._oauthRoot) this._oauthRoot = '/oauth/v1'
    return this._oauthRoot
  }

  get restBaseUrl () {
    if (!this._restBaseUrl) {
      this._restBaseUrl = this._oauthBaseUrl || this.baseUrl || SVClient.defaultBaseUrl
    }
    return this._restBaseUrl
  }

  get restRoot () {
    if (!this._restRoot) this._restRoot = '/rest/v1'
    return this._restRoot
  }

  buildUrl (route, oauth = false) {
    const baseUrl = oauth ? this.oauthBaseUrl : this.restBaseUrl
    const root = oauth ? this.oauthRoot : this.restRoot
    return stripTrailingSlash(baseUrl) + stripTrailingSlash(root) + stripTrailingSlash(route)
  }

  oauthUrl (route) {
    return this.buildUrl(route, true)
  }

  restUrl (route) {
    return this.buildUrl(route, false)
  }

  async fetch (route, data, opts) {
    opts = opts || {}

    const gotOpts = {
      method: opts.method || 'GET',
      responseType: 'json', // accept: application/json
      headers: {
        'User-Agent': this.userAgent,
        ...this.defaultHeaders,
        ...opts.headers
      },
      ...opts.gotOpts
    }

    if (data && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(String(gotOpts.method).toUpperCase())) {
      // form = content-type: application/x-www-form-urlencoded
      // json = content-type: application/json
      const bodyPropName = opts.oauth ? 'form' : 'json'
      gotOpts[bodyPropName] = data
    }

    if (opts.oauth) {
      gotOpts.headers.Authorization = `Basic ${this.basicAuth}`
    } else {
      // TODO cache token locally somehow
      const token = await this.getToken(true)
      if (token && token.access_token) {
        gotOpts.headers.Authorization = `${token.token_type || 'Bearer'} ${token.access_token}`
      }
    }

    const url = opts.oauth ? this.oauthUrl(route) : this.restUrl(route)

    let got, response
    try {
      got = await this.got()
      response = await got(url, gotOpts)
    } catch (err) {
      if (err.response) response = err.response
      const status = response && response.statusCode
      if (!opts.oauth && status === 401) {
        // fetch new token and retry
        const token = await this.getToken(false)
        if (token && token.access_token) {
          gotOpts.headers.Authorization = `${token.token_type || 'Bearer'} ${token.access_token}`
          try {
            response = await got(url, gotOpts)
          } catch (err2) {
            throw new SVApiError(url, err2)
          }
        }
      } else {
        throw new SVApiError(url, err)
      }
    }
    return response
  }

  async get (route, opts) {
    return this.fetch(route, null, { ...opts, ...{ method: 'GET' } })
  }

  async post (route, data, opts) {
    return this.fetch(route, data, { ...opts, ...{ method: 'POST' } })
  }

  async put (route, data, opts) {
    return this.fetch(route, data, { ...opts, ...{ method: 'PUT' } })
  }

  async del (route, data, opts) {
    return this.fetch(route, data, { ...opts, ...{ method: 'DELETE' } })
  }

  async getToken (tryCache = true) {
    let token

    // check cache first
    if (tryCache) {
      token = await this.cacheStrategy.getToken()
      if (token && token.access_token) return token
    }

    // fetch oauth token
    const data = { grant_type: 'client_credentials' }
    if (this.orgSecret) data.scope = this.orgSecret

    const r = await this.post('/token', data, { oauth: true })
    token = r.body

    if (token && token.access_token) {
      await this.cacheStrategy.setToken(token)
    }

    return token
  }

  async getOrgId () {
    if (this.orgId) return this.orgId
    const token = await this.getToken(true)
    if (token && token.org_id) this.orgId = token.org_id
    return this.orgId
  }

  get customerCategories () {
    if (!this._customerCategories) this._customerCategories = require('./api/customer-categories').get({ client: this })
    return this._customerCategories
  }

  get customers () {
    if (!this._customers) this._customers = require('./api/customers').get({ client: this })
    return this._customers
  }

  get customFields () {
    if (!this._customFields) this._customFields = require('./api/custom-fields').get({ client: this })
    return this._customFields
  }

  get labels () {
    if (!this._labels) this._labels = require('./api/labels').get({ client: this })
    return this._labels
  }

  get org () {
    if (!this._org) this._org = require('./api/org').get({ client: this })
    return this._org
  }

  get productCategories () {
    if (!this._productCategories) this._productCategories = require('./api/product-categories').get({ client: this })
    return this._productCategories
  }

  get products () {
    if (!this._products) this._products = require('./api/products').get({ client: this })
    return this._products
  }

  get reps () {
    if (!this._reps) this._reps = require('./api/reps').get({ client: this })
    return this._reps
  }

  get sales () {
    if (!this._sales) this._sales = require('./api/sales').get({ client: this })
    return this._sales
  }

  get triggerEvents () {
    if (!this._triggerEvents) this._triggerEvents = require('./api/trigger-events').get({ client: this })
    return this._triggerEvents
  }

  // this method will throw an error for any of the following 4 scenarios:
  // 1. no secrets configured
  // 2. version of node doesn't support crypto module
  // 3. payload cannot be stringified
  // 4. system does not support the hash algorithm used in the signature
  // otherwise this method returns a boolean
  isValidSignature (signature, payload) {
    // fail-fast if no secrets configured
    if (!this.orgSecret && !this.secret) {
      throw new SVError('You must configure this client with a `secret` and `orgSecret` before signatures can be validated.')
    }

    // do this to fail-fast on "no crypto module"
    const c = this.crypto

    // fail-fast if payload cannot be stringified (e.g. if whole request given)
    let stringifiedPayload
    try {
      stringifiedPayload = JSON.stringify(payload)
    } catch (err) {
      throw new SVError('The given payload could not be stringified - did you pass the request object instead of the request body?').withCause(err)
    }

    const algo = extractAlgo(signature)
    if (!algo) return false

    // trySignature with this.orgSecret first (if we have it), then with this.secret
    let isValid = false
    if (this.orgSecret) {
      isValid = trySignature(c, algo, signature, stringifiedPayload, this.orgSecret)
    }
    if (!isValid && this.secret) {
      isValid = trySignature(c, algo, signature, stringifiedPayload, this.secret)
    }

    return isValid
  }
}

// signature should be a string in the form '<algorithm>=<hex_encoded_hash>'
// examples:
// 'sha1=c9bd3c44a91cfe176f71afcc1e08240555f0ce8b'
// 'sha256=2677ad3e7c090b2fa2c0fb13020d66d5420879b8316eb356a2d60fb9073bc778'
// 'sha512=e571f6f0e16aee15000c83130954f01ac6db0c14eb2202083ad10c3075b9bab729ab09e8e183e4c5955b3617ed00c5dca9510f50d572abf1e279d5fd2321c2a2'
function extractAlgo (signature) {
  const s = String(signature)
  const i = s.indexOf('=')
  return i === -1 ? null : s.slice(0, i)
}

function trySignature (crypto, algo, signature, stringifiedPayload, secret) {
  let hmac
  try {
    hmac = crypto.createHmac(algo, secret)
  } catch (err) {
    throw new SVError(`Your system does not support the "${algo}" algorithm.`).withCause(err)
  }
  const expectedSignature = algo + '=' + hmac.update(stringifiedPayload).digest('hex')
  const expectedBuffer = buffer(expectedSignature)
  return crypto.timingSafeEqual(expectedBuffer, buffer(signature, expectedBuffer.length))
}

function buffer (content, length) {
  let b
  if (length) {
    b = Buffer.alloc(length)
    b.write(content, 0, 'utf8')
  } else {
    b = Buffer.from(content)
  }
  return b
}

function stripTrailingSlash (s) {
  s = String(s)
  if (s.endsWith('/')) return s.slice(0, -1)
  return s
}

module.exports = SVClient
