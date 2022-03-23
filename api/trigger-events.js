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

class TriggerEventsApi extends Api {
  static get (opts) {
    return new TriggerEventsApi(opts)
  }

  // types
  async listTriggerEventTypes (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/trigger-event-types` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'reportId', // string
      'includeDeleted', // boolean (mutually exclusive with reportId)
      'entityType', // string or array
      'name' // string // TODO URLSearchParams#append() for any values that contain comma
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async getTriggerEventType (eventTypeId, opts) {
    const r = await this.client.get(`/trigger-event-types/${eventTypeId}`, opts)
    return r && r.body
  }

  async createTriggerEventType (eventType, opts) {
    opts = opts || {}
    const orgId = eventType.orgId || opts.orgId || await this.client.getOrgId()
    const request = this.pick(eventType, { entityType: 'sale' }, 'name', 'description')
    const r = await this.client.post(`/orgs/${orgId}/trigger-event-types`, request, opts)
    return r && r.body
  }

  async updateTriggerEventType (eventType, opts) {
    const request = this.pick(eventType, 'version', 'name', 'entityType', 'description')
    const r = await this.client.put(`/trigger-event-types/${eventType?.id}`, request, opts)
    return r && r.body
  }

  // events
  async listTriggerEvents (params, opts) {
    params = params || {}
    opts = opts || {}
    const orgId = params.orgId || opts.orgId || await this.client.getOrgId()
    const route = `/orgs/${orgId}/trigger-events` + this.qs(
      params,
      { page: 1 },
      { size: 50 },
      'sort',
      'entityType', // string or array
      'entityId', // string or array
      'triggerEventTypeId' // string or array
    )
    const r = await this.client.get(route, opts)
    return r && r.body
  }

  async getTriggerEvent (eventId, opts) {
    const r = await this.client.get(`/trigger-events/${eventId}`, opts)
    return r && r.body
  }

  async createTriggerEvent (event, opts) {
    opts = opts || {}
    const orgId = event.orgId || opts.orgId || await this.client.getOrgId()
    const request = this.pick(event, 'entityId', { entityType: 'sale' }, 'triggerEventType', 'effectiveDate')
    const r = await this.client.post(`/orgs/${orgId}/trigger-events`, request, opts)
    return r && r.body
  }
}

module.exports = TriggerEventsApi
