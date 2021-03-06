/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('../../webpack.config')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  if (config.testingType !== 'component') {
    return config
  }

  if (!webpackConfig.resolve) {
    webpackConfig.resolve = {}
  }

  webpackConfig.resolve.alias = {
    ...webpackConfig.resolve.alias,
    '@vue/compiler-core$': '@vue/compiler-core/dist/compiler-core.cjs.js',
  }

  require('@cypress/code-coverage/task')(on, config)
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
