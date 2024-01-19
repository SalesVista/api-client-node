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

class ProductCategoriesApi extends Api {
  static get (opts) {
    return new ProductCategoriesApi(opts)
  }

  /**
   * @deprecated Use listProductCategories instead
   */
  async getProductCategories (opts = {}) {
    const {
      page = 1,
      size = 50
    } = opts

    const orgId = opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/product-categories?page=${page}&size=${size}`
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async listProductCategories (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/product-categories` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'search', // string
      'searchField', // string or array
      'withCounts' // boolean
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async createProductCategory (pcat, opts) {
    opts = opts || {}
    const orgId = pcat.orgId || opts.orgId || await this.client.getOrgId()
    // name is required
    const request = this.pick(pcat, 'name', 'parent')
    const r = await this.client.post(`/orgs/${orgId}/product-categories`, request, opts)
    return r && r.body
  }
}

module.exports = ProductCategoriesApi
