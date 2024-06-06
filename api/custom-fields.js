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

class CustomFieldsApi extends Api {
  static get (opts) {
    return new CustomFieldsApi(opts)
  }

  async listCustomFields (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/custom-fields` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'displayName', // string
      'withoutArchived', // boolean
      'withOptions' // boolean
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async listOptionsForCustomField (customFieldId, params, opts) {
    params = params || {}
    opts = opts || {}
    const route = `/custom-fields/${customFieldId}/options` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'name', // string
      'id' // string or array
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async createOption (customFieldId, option, opts) {
    opts = opts || {}
    // name is required
    const request = this.pick(option, 'name', 'svExecId')
    const r = await this.client.post(`/custom-fields/${customFieldId}/options`, request, opts)
    return r && r.body
  }
}

module.exports = CustomFieldsApi
