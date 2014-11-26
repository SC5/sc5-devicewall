var Device = require('../../device');

describe("device model should", function() {
  'use strict';

  it("set and get properties", function() {
    var d = new Device({label: 'testdevice'});
    expect(d.get('label')).toBe('testdevice');

    d.set('platform', 'mandrake');
    expect(d.get('platform')).toBe('mandrake');
  });

  it("update timestamp when model updated", function() {
    var d = new Device({label: 'testdevice', updated: 1});
    var timestamp = d.get('updated');
    d.update({platform: 'android'});
    expect(d.get('updated')).toBeGreaterThan(timestamp);
  });

  it("give properties", function() {
    var d = new Device({myKey: 'myVal'});
    var obj = d.toJSON();
    expect(obj.myKey).toBe('myVal');
  })

});