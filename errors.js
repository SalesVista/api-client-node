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
class SVError extends Error {
  get name () {
    return this.constructor.name
  }

  withCause (cause) {
    if (cause instanceof Error) this.stack += '\ncaused by: ' + cause.stack
    else if (typeof cause === 'string') this.stack += '\ncaused by: ' + cause
    return this
  }
}

module.exports = {
  SVError
}
