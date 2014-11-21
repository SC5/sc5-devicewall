var expect = require('../expect');
var config = require('../../../config.test.json');
var utils = require('../utils');
var socket = require('../socket');

describe('Device', function() {
  var label = 'testdevice';
  var user = {
    id: 'testuser',
    displayName: 'testuser'
  };
  var clientUrl = 'http://' + config.host + ':' + config.port + '/client';
  var clientReturnUrl = '/client';
  var testUrl = 'http://' + config.host + ':' + config.port + '/test';
  var anotherTestUrl = 'http://' + config.host + ':' + config.testServerPort + '/test';
  var resetUrl = 'http://' + config.host + ':' + config.port + '/test/reset';
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

  it('should restart testing if device navigates back to device mode page when testing is on going', function() {
    browser.executeScript('localStorage.setItem("label", "' + label + '");');
    browser.refresh();
    socket.start(user, [label], testUrl);

    browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function (url) {
        return url !== clientUrl;
      });
    }).then(function() {
      // test url ok
      expect(ptor.getCurrentUrl()).to.eventually.contain('/test');
      // go back to client mode
      browser.get(clientUrl);
      // now should be redirected back to test url
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
      socket.stopAll()
      browser.driver.wait(function() {
        return browser.driver.getCurrentUrl().then(function (url) {
          return url.indexOf(clientReturnUrl) > -1;
        });
      }).then(function() {
        expect(ptor.getCurrentUrl()).to.eventually.contain(clientReturnUrl);
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
      ptor.sleep(5000);
      socket.stopAll().then(function(){
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