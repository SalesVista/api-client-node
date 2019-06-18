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

// this class is meant to be extended by the consumer
// so a custom instance can be plugged into SVClient
class CacheStrategy {
  static get (/* opts */) {
    return new CacheStrategy(/* opts */)
  }

  constructor (/* opts */) {
    // opts = opts || {}
    // this.tokenKeyPrefix = opts.tokenKeyPrefix || 'sv_client_token'
    this._token = null
  }

  async getToken () {
    /*
    const token = await redis.get(this.tokenKey)
    return token && JSON.parse(token)
    */
    return this._token
  }

  async setToken (token) {
    /*
    if (token.expires_in > 180) {
      await redis.setex(this.tokenKey, token.expires_in - 120, JSON.stringify(token))
    }
    */
    this._token = token
  }
}

module.exports = CacheStrategy
