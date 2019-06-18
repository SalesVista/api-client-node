const test = require('ava')

test('uhh 1', t => {
  const c = require('./')
  t.truthy(c)
})

test('uhh 2', t => {
  const { SVClient } = require('./')
  t.truthy(new SVClient())
  t.truthy(SVClient.get())
})

test('uhh 3', t => {
  const { CacheStrategy } = require('./')
  t.truthy(new CacheStrategy())
})
