var Instance = require('../../instance');
var Device = require('../../device');
var devices = require('../../devices');
var _ = require('lodash');

describe("instance should", function() {
  'use strict';
  devices.init({devices:[
    new Device({
      "label": "testdevice",
      "status": "idle",
      "updated": 1416218768715
    })
  ]})
  var options = {
    devices: devices,
    config: {
      deviceWallAppURL: 'http://localhost'
    }
  };

  it("start and stop browserSync", function(done) {
    var instance = new Instance({}, options);
    instance.start({url: 'http://localhost', labels: ['testdevice']})
      .then(function() {
        expect(instance.get('status')).toBe('running');
        instance.stop()
          .then(function() {
            expect(instance.get('status')).toBe('stopped');
            done();
          })
          .fail(function(err) {
            console.error(err);
          })
          .catch(function(err) {
            console.error(err);
          });
      })
      .fail(function(err) {
        console.error(err);
      })
      .catch(function(err) {
        console.error(err);
      });
  });


  it("handle location command to browserSync", function(done) {
    var instance = new Instance({}, options);
    instance.start({url: 'http://localhost', labels: ['testdevice']})
      .then(function() {
        instance.location('http://localhost/test').then(function() {
          instance.stop()
            .then(done)
            .fail(function(err) {
              console.error("instance.stop failed",err.stack);
            })
            .catch(function(err) {
              console.error(err.stack);
            });
        }).fail(function(err) {
            console.error("instance.location failed", err.stack);
          })
          .catch(function(err) {
            console.error(err.stack);
          });
      })
      .fail(function(err) {
        console.error("instance.start failed", err.stack);
      })
      .catch(function(err) {
        console.error(err.stack);
      });
  });

  it("mark devices with an user information and set status", function() {
    var instance = new Instance({}, options);
    instance.markDevices({user: {
      id: "userid",
      displayName: "sepesus"
    }}, 'running');
    _.each(instance.getDevices(), function(device) {
      expect(device.get('userId')).toBe('userid');
      expect(device.get('displayName')).toBe('sepesus');
      expect(device.get('status')).toBe('running');
    });
  })
});