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
const Api = require('./api')

class ProductsApi extends Api {
  static get (opts) {
    return new ProductsApi(opts)
  }

  async getProducts (opts = {}) {
    const {
      page = 1,
      size = 50
    } = opts

    // TODO params: name (1+ strings), inAnyPcat (boolean)

    const orgId = opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/products?page=${page}&size=${size}`
    const r = await this.client.get(route, opts)
    return r && r.body
  }
}

module.exports = ProductsApi