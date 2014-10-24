exports.config = {
  seleniumPort: 4444,
  seleniumArgs: ['-Djava.security.egd=file:///dev/urandom'],

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'phantomjs'
  },
  rootElement: 'html',

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};