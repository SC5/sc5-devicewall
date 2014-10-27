var expect = require('./expect');
var config = require('../../config.test.json');
var utils = require('./utils');

describe('Control panel', function() {
  var ptor;

  beforeEach(function() {
    ptor = protractor.getInstance();

    // PhantomJS crashing randomly if this was not set
    browser.ignoreSynchronization = true;

    browser.get('http://' + config.host + ':' + config.port + '/#!/devices');
  });

  afterEach(function() {
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
  it('should enable Go button if at least one device is selected', function() {});
  it('should show Stop buttons if Go button is clicked', function() {});
});
