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
  var devicesUrl = config.protocol + '://' + config.host + ':' + config.port + '/devices';
  var clientUrl = config.protocol + '://' + config.host + ':' + config.port + '/client';
  var clientReturnUrl = '/client';
  var testUrl = config.protocol + '://' + config.host + ':' + config.port + '/test';
  //var anotherTestUrl = config.protocol + '://' + config.host + ':' + config.testServerPort + '/test';
  var anotherTestUrl = testUrl;
  var resetUrl = config.protocol + '://' + config.host + ':' + config.port + '/test/reset';

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

  it('should restart testing if device navigates back to device mode page when testing is on going', function() {
    // setup localStorage label for client
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.get(clientUrl);

    // open control panel
    browser.get(devicesUrl);
    browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function (url) {
        return url === devicesUrl;
      });
    }).then(function() {
      // start test
      element(by.id('url_value')).click();
      utils.clear(element(by.id('url_value')));
      element(by.id('url_value')).sendKeys(testUrl);
      element(by.id("go-button")).click();

      // go back to client url
      browser.get(clientUrl);

      // clientUrl should redirect to test page automatically
      browser.driver.wait(function() {
        return browser.driver.getCurrentUrl().then(function (url) {
          var state = url !== clientUrl && /\/test/.test(url);
          return state;
        });
      });
    });
  });

  it('should handle 301 redirects properly when testing started', function() {
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.refresh();
    socket.start(user, [label], anotherTestUrl + '/301');
    browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function (url) {
        return url !== clientUrl;
      });
    }).then(function() {
      socket.stopAll();
      browser.driver.wait(function() {
        return browser.driver.getCurrentUrl().then(function (url) {
          return url.indexOf(clientReturnUrl) > -1;
        });
      }).then(function() {
        expect(browser.getCurrentUrl()).to.eventually.contain(clientReturnUrl);
      });
    });
  });

  it('should handle 302 redirects properly when testing started', function() {
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.refresh();
    socket.start(user, [label], anotherTestUrl + '/302');
    browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function (url) {
        return url !== clientUrl;
      });
    }).then(function() {
      browser.sleep(5000);
      socket.stopAll().then(function(){
        browser.driver.wait(function() {
          return browser.driver.getCurrentUrl().then(function (url) {
            return url.indexOf(clientReturnUrl) > -1;
          });
        }).then(function() {
          expect(browser.getCurrentUrl()).to.eventually.contain(clientReturnUrl);
        });
      });
    });
  });
});