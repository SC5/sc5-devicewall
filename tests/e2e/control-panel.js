var expect = require('./expect');
var config = require('../../config.test.json');
var utils = require('./utils');
var socket = require('./socket');

describe('Control panel', function() {
  var ptor;

  beforeEach(function() {
    ptor = protractor.getInstance();

    // PhantomJS crashing randomly if this was not set
    browser.ignoreSynchronization = true;

    browser.get('http://' + config.host + ':' + config.port + '/#!/devices');
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

  it('should enable Go button if Open website on this browser checkbox is checked', function() {});

  // PhantomJS not supporting sockets
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

  it('should have user inputted URL in the input field', function() {
    element(by.id('url')).click();
    element(by.id('url')).sendKeys('google.fi');
    expect(element(by.id('url')).getAttribute('value')).to.eventually.equal('http://www.google.fi');
  });

  iit('should show Stop buttons if Go button is clicked', function() {
    utils.addSingleTestDevice("testdevice");
    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.xpath("//td[text()='testdevice']"));
    });
    expect(element(by.id('go-button')).isEnabled()).to.eventually.equal(true);
    expect(element(by.css('#available-devices table input[type=checkbox]')).isSelected()).to.eventually.equal(true);
    element(by.id('url')).click();
    element(by.id('url')).sendKeys('google.fi');
    element(by.id("go-button")).click();
    //expect(element(by.id('tooltip-error')).isDisplayed()).to.eventually.equal(false);
    //expect(element(by.id('stop-button')).isDisplayed()).to.eventually.equal(true);
    expect(element(by.id('stop-all-button')).isDisplayed()).to.eventually.equal(true);
  });
});
