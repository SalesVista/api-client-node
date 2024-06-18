/*
Copyright 2024 SalesVista, LLC

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

class BgpEventsApi extends Api {
  static get (opts) {
    return new BgpEventsApi(opts)
  }

  async logEventForOrg (event, opts) {
    opts = opts || {}
    const orgId = opts.orgId || await this.client.getOrgId()
    // required: execType, execKey, event, timestamp
    const request = this.pick(
      event,
      'execType', // string, max 64 chars, case-insensitive
      'execKey', // string, max 128 chars
      'event', // string, max 64 chars, case-insensitive
      'timestamp', // number or ISO string
      'eventKey', // string, max 128 chars
      'processName', // string, truncated to 64 chars, case-insensitive
      'execName', // string, truncated to 255 chars
      'sourceType', // string, truncated to 64 chars, case-insensitive
      'sourceName', // string, truncated to 255 chars
      'sourceRecordCount', // integer
      'percentageComplete', // number 0-100, up to 6 decimals
      'mainEntityType', // string, truncated to 63 chars, case-insensitive
      'hidden', // boolean
      'userMessage', // string
      'reason', // string or object or array
      'txnExternalKey', // string, truncated to 255 chars
      'rowId', // string, truncated to 36 chars
      'correlation' // string, truncated to 255 chars
    )
    const r = await this.client.post(`/orgs/${orgId}/bgp-events`, request, opts)
    return r && r.body // success (boolean), svExecId (string), svEventId (string)
  }

  async logEventForExec (svExecId, event, opts) {
    // required: event, timestamp
    const request = this.pick(
      event,
      'event', // string, max 64 chars, case-insensitive
      'timestamp', // number or ISO string
      'eventKey', // string, max 128 chars
      'processName', // string, truncated to 64 chars, case-insensitive
      'execName', // string, truncated to 255 chars
      'sourceType', // string, truncated to 64 chars, case-insensitive
      'sourceName', // string, truncated to 255 chars
      'sourceRecordCount', // integer
      'percentageComplete', // number 0-100, up to 6 decimals
      'mainEntityType', // string, truncated to 63 chars, case-insensitive
      'hidden', // boolean
      'userMessage', // string
      'reason', // string or object or array
      'txnExternalKey', // string, truncated to 255 chars
      'rowId', // string, truncated to 36 chars
      'correlation' // string, truncated to 255 chars
    )
    const r = await this.client.post(`/bgp-execs/${svExecId}/events`, request, opts)
    return r && r.body // success (boolean), svExecId (echoed string), svEventId (string)
  }

  async logManyEventsForExec (svExecId, wrapper, opts) {
    const request = this.pick(
      wrapper,
      'event', // string, max 64 chars, case-insensitive
      'timestamp', // number or ISO string
      'percentageComplete', // number 0-100, up to 6 decimals
      'hidden', // boolean
      'events' // array of event objects, must have unique eventKey or timestamp
      // events also expects: userMessage, reason, txnExternalKey, rowId, correlation
    )
    const r = await this.client.post(`/bgp-execs/${svExecId}/many-events`, request, opts)
    return r && r.body // success (boolean), numNewEvents (integer)
  }
}

module.exports = BgpEventsApi
