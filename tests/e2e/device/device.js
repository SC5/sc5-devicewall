var expect = require('../expect');
var config = require('../../../server/config.js');
var utils = require('../utils');
var socket = require('../socket');

describe('Device', function() {
  var label = 'testdevice';
  var user = {
    id: 'testuser',
    displayName: 'testuser'
  };
  var clientUrl = config.protocol + '://' + config.host + ':' + config.port + '/client';
  var clientReturnUrl = '/client';
  var testUrl = config.protocol + '://' + config.host + ':' + config.port + '/test';
  var resetUrl = config.protocol + '://' + config.host + ':' + config.port + '/test/reset';
  var ptor = protractor.getInstance();

  // On CI the window size might be too small, so tests are trying to click out of bounds
  browser.driver.manage().window().setSize(1280, 1024);

  beforeEach(function() {
    utils.writeSingleTestDevice(label);
    utils.reloadDevices();
    browser.ignoreSynchronization = true;
    browser.get(clientUrl);
    browser.waitForAngular();
  });

  afterEach(function() {
    // reset env state
    browser.driver.get(resetUrl);
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//div[@id='test']"));
    });
  });

  it('should show label selection with ok button if no label in localStorage', function() {
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(false);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(true);
    expect(element(by.id('device_label')).isPresent()).to.eventually.equal(true);
    expect(element(by.css('#label button')).isPresent()).to.eventually.equal(true);
    expect(element(by.css('#label h2')).getText()).to.eventually.contain('Manage device');
  });

  it('should show ready for testing if label typed and go clicked', function() {
    element(by.id('device_label')).click();
    element(by.id('device_label')).sendKeys('testdevice');
    element(by.css('#label button')).click();
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(true);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(false);
  });

  it('should show ready for testing if label in localStorage', function() {
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.refresh();
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(true);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(false);
    expect(element(by.css('#connection h3')).getText()).to.eventually.contain('Ready for testing');
  });

  it('should navigate back to control panel if control panel button clicked', function() {
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.refresh();
    element(by.css('#connection .control-panel')).click();
    expect(ptor.getCurrentUrl()).to.eventually.contain('/devices');
  });

  it('should navigate back to label selection if device button clicked', function() {
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.refresh();
    element(by.css('#connection .settings')).click();
    expect(ptor.getCurrentUrl()).to.eventually.contain('/client');
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(false);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(true);
  });

  it('should navigate to tested website and back when server started and stopped', function() {
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.refresh();
    socket.start(user, [label], testUrl);
    browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function (url) {
          return url !== clientUrl;
      });
    }).then(function() {
      expect(ptor.getCurrentUrl()).to.eventually.contain('/test');
      expect(element(by.id('test')).isPresent()).to.eventually.equal(true);
      browser.driver.wait(function() {
        return browser.driver.isElementPresent(by.xpath("//div[@id='test']"));
      }).then(function() {
        socket.stopAll();
        browser.driver.wait(function() {
          return browser.driver.getCurrentUrl().then(function (url) {
            return url.indexOf(clientReturnUrl) > -1;
          });
        }).then(function() {
          expect(ptor.getCurrentUrl()).to.eventually.contain(clientReturnUrl);
        });
      });
    });
  });
});