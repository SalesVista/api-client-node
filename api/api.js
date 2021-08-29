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
const querystring = require('querystring')

class Api {
  constructor (opts) {
    opts = opts || {}
    this._client = opts.client
  }

  get client () {
    if (!this._client) this._client = require('../client').get()
    return this._client
  }

  pick (src, ...props) {
    if (!src) return {}
    let p, d
    return [].concat(props).flat().filter(Boolean).reduce((dest, prop) => {
      if (typeof prop === 'string') {
        p = prop
        d = undefined
      } else {
        p = Object.keys(prop)[0]
        d = prop[p]
      }
      if (typeof src[p] !== 'undefined') dest[p] = src[p]
      else if (typeof d !== 'undefined') dest[p] = d
      return dest
    }, {})
  }

  qs (obj, ...props) {
    if (props.length) obj = this.pick(obj, ...props)
    const query = querystring.stringify(obj)
    return query ? '?' + query : ''
  }
}

module.exports = Api
