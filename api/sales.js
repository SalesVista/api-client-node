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

class SalesApi extends Api {
  static get (opts) {
    return new SalesApi(opts)
  }

  async getSales (opts = {}) {
    const {
      page = 1,
      size = 5,
      externalKey
    } = opts

    const orgId = opts.orgId || await this.client.getOrgId()
    let route = `/orgs/${orgId}/sales?page=${page}&size=${size}`
    if (externalKey) route += `&externalKeyLike=${externalKey}`

    const r = await this.client.get(route, opts) // TODO wrap this.client.get that throws on 4xx/5xx response
    return r && r.body
  }

  async createBatch (opts) {
    const { name,
      externalOrg,
      sales // verify it is an array?
    } = opts

    const orgId = opts.orgId || await this.client.getOrgId()

    const request = {
      name,
      externalOrg
    }

    if (sales) request.sales = sales

    let route = `/orgs/${orgId}/sale-external-batches`
    const r = await this.client.post(route, request, opts) // TODO wrap this.client.post that throws on 4xx/5xx response
    return r && r.body
  }

  async updateBatch (batchId, version, opts) {
    const {
      name,
      sales // verify it is an array?
    } = opts

    const request = {
      version,
      name
    }

    if (sales) request.sales = sales

    let route = `/sale-batches/${batchId}`
    const r = await this.client.put(route, request, opts) // TODO wrap this.client.put that throws on 4xx/5xx response
    return r && r.body
  }
}
module.exports = SalesApi
