(function () {
  'use strict';

  angular.module('DeviceWall').factory('DeviceList', function(lodash) {
    return {
      deviceList: {},
      add: function(device) {
        if (lodash.has(this.deviceList, device.label)) {
          this.update(device);
        } else {
          this.deviceList[device.label] = device;
        }
      },
      update: function(device) {
        if (lodash.has(this.deviceList, device.label)) {
          this.deviceList[device.label] = angular.extend(this.deviceList[device.label], device);
        }
      },
      remove: function(device) {
        if (lodash.has(this.deviceList, device.label)) {
          delete this.deviceList[device.label];
        }
      },
      has: function(device) {
        return lodash.has(this.deviceList, device.label);
      },
      toArray: function() {
        var keys = Object.keys(this.deviceList);
        var deviceList = this.deviceList;
        return lodash.map(keys, function(key) {
          return deviceList[key];
        });
      }
    };
  });
})();