require('../spec_helper')

const fs = require(`${lib}/fs`)
const makeUserPackageFile = require('../../scripts/build')
const snapshot = require('../support/snapshot')
const la = require('lazy-ass')
const is = require('check-more-types')

const hasVersion = (json) => {
  return la(is.semver(json.version), 'cannot find version', json)
}

const changeVersion = (o) => ({ ...o, version: 'x.y.z' })

describe('package.json build', () => {
  beforeEach(function () {
    // stub package.json in CLI
    // with a few test props
    // the rest should come from root package.json file
    sinon.stub(fs, 'readJsonAsync').resolves({
      name: 'test',
      engines: 'test engines',
    })

    sinon.stub(fs, 'outputJsonAsync').resolves()
  })

  it('version', () => {
    return makeUserPackageFile()
    .tap(hasVersion)
  })

  it('outputs expected properties', () => {
    return makeUserPackageFile()
    .then(changeVersion)
    .then(snapshot)
  })
})
