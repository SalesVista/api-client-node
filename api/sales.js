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

  /**
   * @deprecated Use listSales instead
   */
  async getSales (opts = {}) {
    const {
      page = 1,
      size = 5,
      externalKey
    } = opts

    const orgId = opts.orgId || await this.client.getOrgId()
    let route = `/orgs/${orgId}/sales?page=${page}&size=${size}`
    if (externalKey) route += `&externalKeyLike=${externalKey}`

    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async listSales (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/sales` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'teamId', // string or array
      'includeChildTeams', // boolean
      'productCategoryId', // string or array
      'customerCategoryId', // string or array
      'labelId', // string or array
      'repId', // string or array
      'id', // string or array
      'productId', // string or array
      'customerId', // string or array
      'from', // string representing date e.g. '2023-01-01', applies to effectiveDate
      'to', // string representing date e.g. '2023-01-31', applies to effectiveDate
      'fiscalYearId', // string, applies to effectiveDate
      'fiscalPeriodId', // string, applies to effectiveDate, may be id or one of 'current', 'previous', 'next'
      'effectiveDate', // string or array
      'effectiveDateAfter', // string like '2022-02-12'
      'effectiveDateBefore', // string
      'transactionDate', // string or array
      'transactionDateAfter', // string
      'transactionDateBefore', // string
      'reportId', // string or array
      'batchId', // string or array
      'referenceId', // string
      'noteLike', // string (multiple values requires multiple params)
      'transactionNum', // integer or array
      'transactionNumLike', // partial-integer string or array
      'source', // string or array
      'externalKey', // string or array
      'externalKeyLike', // string or array
      'deferredAccrual', // boolean
      'withWarnings', // boolean
      'status', // string or array
      'type' // string or array, values like 'txn', 'event', 'churn'
    )
    // TODO check params for possible custom field property names and apply to qs
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async getSaleTotals (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/sale-totals` + this.qs(
      params,
      'from', // string representing date e.g. '2023-01-01', applies to effectiveDate
      'to', // string representing date e.g. '2023-01-31', applies to effectiveDate
      'fiscalYearId', // string, applies to effectiveDate
      'fiscalPeriodId', // string, applies to effectiveDate, may be id or one of 'current', 'previous', 'next'
      'type', // string or array, values like 'txn', 'event', 'churn'
      'includeBreakdown', // boolean
      'breakdownIntervals' // integer
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  /**
   * @deprecated Use listSaleBatches2 instead
   */
  async listSaleBatches (opts) {
    opts = opts || {}
    const orgId = opts.orgId || await this.client.getOrgId()
    const url = `/orgs/${orgId}/sale-batches` + this.qs(opts, 'page', 'size', 'deleted', 'name')
    const r = await this.client.get(url, opts)
    return r && r.body
  }

  async listSaleBatches2 (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const url = `/orgs/${orgId}/sale-batches` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'deleted', // boolean
      'name', // string or array
      'includeAggregates', // boolean
      'id', // string or array
      'appId', // string or array
      'source' // string or array ('file' and 'integration' are treated as enums)
    )
    const r = await this.client.get(url, opts)
    return r && r.body
  }

  /**
   * @deprecated Use createExternalBatch or createFileBatch instead
   */
  async createBatch (opts) {
    const {
      name,
      externalOrg,
      sales // verify it is an array?
    } = opts

    const orgId = opts.orgId || await this.client.getOrgId()

    const request = {
      name,
      externalOrg
    }

    if (sales) request.sales = sales

    const route = `/orgs/${orgId}/sale-external-batches`
    const r = await this.client.post(route, request, opts)
    return r && r.body
  }

  async createExternalBatch (batch, opts) {
    opts = opts || {}
    const orgId = opts.orgId || await this.client.getOrgId()
    // externalOrg required
    const request = this.pick(batch, 'name', 'rawName', 'rawNumBytes', 'rawNumRows', 'rawFormat', 'sales', 'externalOrg')
    const r = await this.client.post(`/orgs/${orgId}/sale-external-batches`, request, opts)
    return r && r.body
  }

  async createFileBatch (batch, opts) {
    opts = opts || {}
    const orgId = opts.orgId || await this.client.getOrgId()
    // rawName required
    const request = this.pick(batch, 'name', 'rawName', 'rawNumBytes', 'rawNumRows', 'rawFormat', 'sales')
    const r = await this.client.post(`/orgs/${orgId}/sale-file-batches`, request, opts)
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

    const route = `/sale-batches/${batchId}`
    const r = await this.client.put(route, request, opts)
    return r && r.body
  }
}
module.exports = SalesApi
