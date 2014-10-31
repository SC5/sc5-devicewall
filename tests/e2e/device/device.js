var expect = require('../expect');
var config = require('../../../config.test.json');
var utils = require('../utils');
var socket = require('../socket');

describe('Device', function() {
  var ptor;
  var label = 'testdevice';
  var user = {
    id: 'testuser',
    displayName: 'testuser'
  };
  var clientUrl = 'http://' + config.host + ':' + config.port + '/client/#!/';
  var clientReturnUrl = '/client/return/#!';

  beforeEach(function() {
    ptor = protractor.getInstance();

    // PhantomJS crashing randomly if this was not set
    browser.ignoreSynchronization = true;

    browser.get(clientUrl);
  });

  afterEach(function() {
    utils.clearAfterEach();
    browser.executeScript('localStorage.clear();');
  });

  it('should show label selection with ok button if no label in localStorage', function() {
    browser.executeScript('localStorage.clear();');
    browser.get(clientUrl);
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(false);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(true);
    expect(element(by.id('device_label')).isPresent()).to.eventually.equal(true);
    expect(element(by.css('#label button')).isPresent()).to.eventually.equal(true);
    expect(element(by.css('#label h2')).getText()).to.eventually.contain('Manage device');
  });

  it('should show ready for testing if label typed and go clicked', function() {
    browser.executeScript('localStorage.clear();');
    browser.get(clientUrl);
    element(by.id('device_label')).click();
    element(by.id('device_label')).sendKeys('testdevice');
    element(by.css('#label button')).click();
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(true);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(false);
  });

  it('should show ready for testing if label in localStorage', function() {
    utils.writeSingleTestDevice(label);
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.get(clientUrl);
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(true);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(false);
    expect(element(by.css('#connection h3')).getText()).to.eventually.contain('Ready for testing');
  });

  it('should navigate back to control panel if control panel button clicked', function() {
    utils.writeSingleTestDevice(label);
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.get(clientUrl);
    element(by.css('#connection .control-panel')).click();
    expect(ptor.getCurrentUrl()).to.eventually.contain('/#!/devices');
  });

  it('should navigate back to label selection if device button clicked', function() {
    utils.writeSingleTestDevice(label);
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.get(clientUrl);
    element(by.css('#connection .settings')).click();
    expect(ptor.getCurrentUrl()).to.eventually.contain('/client/#!/');
    expect(utils.hasClass(element(by.id('label')), 'ng-hide')).to.eventually.equal(false);
    expect(utils.hasClass(element(by.id('connection')), 'ng-hide')).to.eventually.equal(true);
  });

  it('should navigate to tested website and back when server started and stopped', function() {
    utils.writeSingleTestDevice(label);
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.get(clientUrl);
    socket.start(user, [label], 'http://' + config.host + ':' + config.port + '/perf-test');
    browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function (url) {
          return url !== clientUrl;
      });
    }).then(function() {
      expect(ptor.getCurrentUrl()).to.eventually.contain('/perf-test');
      expect(element(by.id('perf-test')).isPresent()).to.eventually.equal(true);
      browser.driver.wait(function() {
        return browser.driver.isElementPresent(by.xpath("//div[@id='done']"));
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