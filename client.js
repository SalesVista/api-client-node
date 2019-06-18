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
class SVClient {
  static get (opts) {
    return new SVClient(opts)
  }

  constructor (opts) {
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
    this._cacheStrategy = opts.cacheStrategy || this._cacheStrategy
    this._got = opts.got || this._got

    return this
  }

  get got () {
    if (!this._got) this._got = require('got')
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
      this._oauthBaseUrl = this._restBaseUrl || this.baseUrl || 'https://salesvista.app'
    }
    return this._oauthBaseUrl
  }

  get oauthRoot () {
    if (!this._oauthRoot) this._oauthRoot = '/oauth/v1'
    return this._oauthRoot
  }

  get restBaseUrl () {
    if (!this._restBaseUrl) {
      this._restBaseUrl = this._oauthRoot || this.baseUrl || 'https://salesvista.app'
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
      json: true, // accept: application/json
      headers: {
        'User-Agent': this.userAgent,
        ...this.defaultHeaders,
        ...opts.headers
      }
    }

    if (data && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(String(gotOpts.method).toUpperCase())) {
      gotOpts.body = data
      if (opts.oauth) gotOpts.form = true // content-type: application/x-www-form-urlencoded
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

    let response
    try {
      response = await this.got(url, gotOpts)
    } catch (err) {
      response = err.response
      const status = response && response.statusCode
      if (!opts.oauth && status === 401) {
        // fetch new token and retry
        const token = await this.getToken(false)
        if (token && token.access_token) {
          gotOpts.headers.Authorization = `${token.token_type || 'Bearer'} ${token.access_token}`
          try {
            response = await this.got(url, gotOpts)
          } catch (err2) {
            response = err2.response
          }
        }
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
}

function stripTrailingSlash (s) {
  s = String(s)
  if (s.endsWith('/')) return s.slice(0, -1)
  return s
}

module.exports = SVClient
