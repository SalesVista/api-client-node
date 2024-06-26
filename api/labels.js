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

class LabelsApi extends Api {
  static get (opts) {
    return new LabelsApi(opts)
  }

  async getLabels (opts = {}) {
    const orgId = opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/labels` + this.qs(
      opts,
      { page: 1 },
      { size: 50 },
      'sort',
      { type: 'sale' }, // string or array
      'reportId', // string
      'includeDeleted', // boolean
      'name' // string or array
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async listLabels (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/labels` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      { type: 'sale' }, // string or array
      'reportId', // string
      'includeDeleted', // boolean
      'name' // string or array
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async createLabel (label, opts) {
    opts = opts || {}
    const orgId = opts.orgId || await this.client.getOrgId()
    const request = this.pick(label, 'type', 'name', 'description', 'color', 'icon', 'svExecId')
    const r = await this.client.post(`/orgs/${orgId}/labels`, request, opts)
    return r && r.body
  }
}

module.exports = LabelsApi
