/*
Copyright 2022 SalesVista, LLC

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

class CustomersApi extends Api {
  static get (opts) {
    return new CustomersApi(opts)
  }

  /**
   * @deprecated Use listCustomers instead
   */
  async getCustomers (opts = {}) {
    const orgId = opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/customers` + this.qs(
      opts,
      { page: 1 },
      { size: 50 },
      'sort',
      'id', // string or array
      'name', // string or array
      'inAnyCcat', // boolean
      'withExternalKeys' // boolean
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async listCustomers (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/customers` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'id', // string or array
      'name', // string or array
      'inAnyCcat', // boolean
      'withExternalKeys' // boolean
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async createCustomer (customer, opts) {
    opts = opts || {}
    const orgId = customer.orgId || opts.orgId || await this.client.getOrgId()
    // name (Name) and slug (Customer Code) required
    const request = this.pick(customer, 'name', 'slug', 'customerCategory', 'description', 'externalOrg', 'externalKey')
    const r = await this.client.post(`/orgs/${orgId}/customers`, request, opts)
    return r && r.body
  }

  async createExternalBatch (batch, opts) {
    opts = opts || {}
    const orgId = batch.orgId || opts.orgId || await this.client.getOrgId()
    // externalOrg required
    const request = this.pick(batch, 'name', 'rawName', 'rawNumBytes', 'rawNumRows', 'rawFormat', 'customers', 'externalOrg')
    const r = await this.client.post(`/orgs/${orgId}/customer-external-batches`, request, opts)
    return r && r.body
  }
}

module.exports = CustomersApi
