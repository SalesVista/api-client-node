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

  /**
   * @deprecated Use listProducts instead
   */
  async getProducts (opts = {}) {
    const orgId = opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/products` + this.qs(
      opts,
      { page: 1 },
      { size: 50 },
      'sort',
      'id',
      'name',
      'inAnyPcat', // boolean
      'withExternalKeys' // boolean
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async listProducts (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/products` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'id',
      'name',
      'inAnyPcat', // boolean
      'withExternalKeys' // boolean
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async createProduct (product, opts) {
    opts = opts || {}
    const orgId = product.orgId || opts.orgId || await this.client.getOrgId()
    // productCode and displayName required
    const request = this.pick(product, 'productCode', 'displayName', 'description', 'productCategory', 'externalOrg', 'externalKey')
    const r = await this.client.post(`/orgs/${orgId}/products`, request, opts)
    return r && r.body
  }

  async updateProduct (product, opts) {
    opts = opts || {}
    const request = this.pick(product, 'id', 'name', 'slug', 'version', 'productCategory')
    const r = await this.client.put(`/products/${request.id}`, request, opts)
    return r && r.body
  }

  async createExternalBatch (batch, opts) {
    opts = opts || {}
    const orgId = batch.orgId || opts.orgId || await this.client.getOrgId()
    // externalOrg required
    const request = this.pick(batch, 'name', 'rawName', 'rawNumBytes', 'rawNumRows', 'rawFormat', 'products', 'externalOrg')
    const r = await this.client.post(`/orgs/${orgId}/product-external-batches`, request, opts)
    return r && r.body
  }
}

module.exports = ProductsApi
