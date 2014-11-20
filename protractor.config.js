exports.config = {
  seleniumPort: 4444,

  // -Djava.security.egd=file:///dev/urandom needed for headless SSD configurations
  seleniumArgs: ['-role hub', '-Djava.security.egd=file:///dev/urandom'],

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },
  rootElement: 'html',

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 20000
  }
};