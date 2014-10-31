var expect = require('../expect');
var config = require('../../../config.test.json');
var utils = require('../utils');
var socket = require('../socket');

describe('Control panel', function() {
  var ptor;
  var testUrl = 'http://' + config.host + ':' + config.port + '/test';
  var devicesUrl = 'http://' + config.host + ':' + config.port + '/#!/devices';

  beforeEach(function() {
    ptor = protractor.getInstance();

    // PhantomJS crashing randomly if this was not set
    browser.ignoreSynchronization = true;

    browser.get(devicesUrl);
    browser.executeScript('localStorage.clear();');
    browser.get(devicesUrl);
  });

  afterEach(function() {
    utils.clearAfterEach();
    browser.executeScript('localStorage.clear();');
  });

  it('should render correctly', function() {
    expect(element(by.id('go-button')).isDisplayed()).to.eventually.equal(true);
    expect(element(by.id('stop-button')).isDisplayed()).to.eventually.equal(false);
    expect(element(by.id('stop-all-button')).isDisplayed()).to.eventually.equal(false);
    expect(element(by.css('#available-devices h2')).getText()).to.eventually.contain('Available devices');
    expect(element(by.id('select-all')).isDisplayed()).to.eventually.equal(true);
    expect(element(by.id('select-none')).isDisplayed()).to.eventually.equal(true);
    expect(element.all(by.css('#available-devices-table-heading th')).count()).to.eventually.equal(9);
  });

  it('should toggle the accordion when clicked', function() {
    expect(utils.hasClass(element(by.id('available-devices')), 'collapsed')).to.eventually.equal(false);
    element(by.css('#available-devices h2')).click();
    expect(utils.hasClass(element(by.id('available-devices')), 'collapsed')).to.eventually.equal(true);
    element(by.css('#available-devices h2')).click();
    expect(utils.hasClass(element(by.id('available-devices')), 'collapsed')).to.eventually.equal(false);
  });

  it('should show device in the device list', function() {
    utils.addSingleTestDevice("testdevice1");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice1']"));
    });
    expect(element.all(by.css('#available-devices table tr')).count()).to.eventually.equal(2);
  });

  it('should show devices in the device list', function() {
    utils.addMultipleTestDevices(["testdevice2", "testdevice1"]);
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice2']"));
    });
    expect(element.all(by.css('#available-devices table tr')).count()).to.eventually.equal(3);
  });

  it('should enable Go button if at least one device is selected', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    expect(element(by.id('go-button')).isEnabled()).to.eventually.equal(true);
  });

  it('should enable Go button if Open website on this browser checkbox is checked', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    element(by.css('#devices-list tr:nth-child(1) input[type="checkbox"]')).click();
    expect(element(by.id('go-button')).isEnabled()).to.eventually.equal(false);
    element(by.id('openUrl')).click();
    expect(element(by.id('openUrl')).isSelected()).to.eventually.equal(true);
    expect(element(by.id('go-button')).isEnabled()).to.eventually.equal(true);
  });

  it('should set url value to http://www when clicked', function() {
    element(by.id('url')).click();
    expect(element(by.id('url')).getAttribute('value')).to.eventually.equal('http://www.');
  });

  it('should have user inputted URL in the input field', function() {
    element(by.id('url')).click();
    element(by.id('url')).sendKeys('domain.com');
    expect(element(by.id('url')).getAttribute('value')).to.eventually.equal('http://www.domain.com');
  });

  it('should show Stop buttons if Go button is clicked', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    expect(element(by.id('go-button')).isEnabled()).to.eventually.equal(true);
    expect(element(by.css('#available-devices table input[type=checkbox]')).isSelected()).to.eventually.equal(true);
    element(by.id('url')).click();
    utils.clear(element(by.id('url')));
    element(by.id('url')).sendKeys(testUrl);
    element(by.id("go-button")).click();
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//div[@id='server-status' and text()='running']"));
    });
    expect(element(by.id('stop-all-button')).isDisplayed()).to.eventually.equal(true);
  });

  it('should hide Stop buttons if Stop all button is clicked', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    element(by.id('url')).click();
    utils.clear(element(by.id('url')));
    element(by.id('url')).sendKeys(testUrl);
    element(by.id("go-button")).click();
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//div[@id='server-status' and text()='running']"));
    });
    expect(element(by.id('stop-all-button')).isDisplayed()).to.eventually.equal(true);
    element(by.id('stop-all-button')).click();
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//div[@id='server-status' and text()='stopped']"));
    });
    expect(element(by.id('stop-all-button')).isDisplayed()).to.eventually.equal(false);
  });

  it('should select all if Select all clicked', function() {
    utils.addMultipleTestDevices(["testdevice2", "testdevice1"]);
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice2']"));
    });
    element(by.css('#devices-list tr:nth-child(1) input[type="checkbox"]')).click();
    expect(element.all(by.css('#devices-list input[type="checkbox"]:checked')).count()).to.eventually.equal(1);
    element(by.id('select-all')).click();
    expect(element.all(by.css('#devices-list input[type="checkbox"]:checked')).count()).to.eventually.equal(2);
    element(by.css('#devices-list tr:nth-child(1) input[type="checkbox"]')).click();
    element(by.css('#devices-list tr:nth-child(2) input[type="checkbox"]')).click();
    expect(element.all(by.css('#devices-list input[type="checkbox"]:checked')).count()).to.eventually.equal(0);
    element(by.id('select-all')).click();
    expect(element.all(by.css('#devices-list input[type="checkbox"]:checked')).count()).to.eventually.equal(2);
  });

  it('should select none if Select none clicked', function() {
    utils.addMultipleTestDevices(["testdevice2", "testdevice1"]);
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice2']"));
    });
    element(by.id('select-none')).click();
    expect(element.all(by.css('#devices-list input[type="checkbox"]:checked')).count()).to.eventually.equal(0);
    element(by.css('#devices-list tr:nth-child(1) input[type="checkbox"]')).click();
    expect(element.all(by.css('#devices-list input[type="checkbox"]:checked')).count()).to.eventually.equal(1);
    element(by.id('select-none')).click();
    expect(element.all(by.css('#devices-list input[type="checkbox"]:checked')).count()).to.eventually.equal(0);
  });

  it('should display tooltip error if website to be tested is not responding', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    element(by.id('url')).click();
    element(by.id('url')).sendKeys('dsfkjasdfasdfasdfasdflassdkjajskd.sad');
    element(by.id("go-button")).click();
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//span[@id='tooltip-error' and text()='Target URL unreachable.']"));
    });
    expect(element(by.id('stop-all-button')).isDisplayed()).to.eventually.equal(false);
  });

  it('should remove device when trash icon clicked', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    element(by.css('#devices-list tr .remove')).click();
    expect(element.all(by.css('#devices-list tr')).count()).to.eventually.equal(0);
  });

  it('should persist added model, platform and version data input by user', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    element(by.css('#devices-list input[data-ng-model="device.model"]')).click();
    element(by.css('#devices-list input[data-ng-model="device.model"]')).sendKeys('iPhone');
    element(by.css('#devices-list input[data-ng-model="device.platform"]')).click();
    element(by.css('#devices-list input[data-ng-model="device.platform"]')).sendKeys('iOS');
    element(by.css('#devices-list input[data-ng-model="device.version"]')).click();
    element(by.css('#devices-list input[data-ng-model="device.version"]')).sendKeys('6.1');
    element(by.css('#devices-list input[data-ng-model="device.model"]')).click();
    browser.get(devicesUrl);
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    expect(element(by.css('#devices-list input[data-ng-model="device.model"]')).getAttribute('value')).to.eventually.equal('iPhone');
    expect(element(by.css('#devices-list input[data-ng-model="device.platform"]')).getAttribute('value')).to.eventually.equal('iOS');
    expect(element(by.css('#devices-list input[data-ng-model="device.version"]')).getAttribute('value')).to.eventually.equal('6.1');
  });
});
