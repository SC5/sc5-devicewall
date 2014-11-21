var devices = require('../../devices');

describe("devices collection should", function() {
  'use strict';

  beforeEach(function() {
    devices.init({config: {
      devicesJson: 'server/test/fixtures/devices.json'
    }});
    devices.read();
  });

  afterEach(function() {

  });

  it("find device", function() {
    var d = devices.find('testdevice');
    expect(d.get('label')).toBe('testdevice');
  });

  it("add device", function() {
    devices.update({label: 'testdevice2'});
    var d = devices.find('testdevice2')
    expect(d.get('label')).toBe('testdevice2');
  });

  it("remove device", function() {
    devices.update({label: 'testdevice2'});
    devices.update({label: 'testdevice3'});
    devices.update({label: 'testdevice4'});

    // remove #2
    var d = devices.find('testdevice2')
    expect(d.get('label')).toBe('testdevice2');
    devices.remove(d.label);

    // should be undefined now
    expect(devices.find(d.label)).toBe(undefined);

    // and rest should be found
    expect(devices.find('testdevice3')).not.toBe(undefined);
    expect(devices.find('testdevice4')).not.toBe(undefined);
  });

  it("update device", function() {
    var d = devices.find('testdevice');
    expect(d.get('status')).toBe('running');

    d.set('status', 'idle');
    devices.update(d.toJSON());

    d = devices.find('testdevice');
    expect(d.get('status')).toBe('idle');
  });

});