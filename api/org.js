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

class OrgApi extends Api {
  static get (opts) {
    return new OrgApi(opts)
  }

  async getOrg (opts) {
    opts = opts || {}
    const orgId = opts.id || opts.orgId || await this.client.getOrgId()
    let route = `/orgs/${orgId}`

    // params: withCounts (boolean), from (date), to (date), fiscalYearId (string), fiscalPeriodId (string)
    if (opts.withCounts === true) {
      route += '?withCounts=true'
      if (opts.from && opts.to) route += `&from=${opts.from}&to=${opts.to}`
      if (opts.fiscalYearId) route += `&fiscalYearId=${opts.fiscalYearId}`
      if (opts.fiscalPeriodId) route += `&fiscalPeriodId=${opts.fiscalPeriodId}`
    }

    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async putExternalOrgKey (system, key, opts) {
    opts = opts || {}
    const orgId = opts.id || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/external-orgs/${system}/${key}`

    const body = {}
    if (opts.name || opts.companyName) body.name = opts.name || opts.companyName

    const r = await this.client.put(route, body, opts)
    return r && r.body
  }
}

module.exports = OrgApi
