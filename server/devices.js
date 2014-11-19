// Devices object
var _ = require('lodash'),
    fs = require('fs'),
    Device = require('./device');

var Devices = {
  init: function(options) {
    this.config = options.config;
    this.devices = options.devices || [];
    this.updated = false;
  },
  // if needle is array, return is array of matched objects
  find: function(needle) {
    if (_.isArray(needle)) {
      return _.filter(this.devices, function(device) {
        return _.indexOf(needle, device.get('label')) !== -1;
      });
    } else {
      return _.find(this.devices, function(device) {
        return device.get('label') === needle;
      });
    }
  },
  update: function(data) {
    var device = this.find(data.label);
    if (!data.label) {
      console.error("empty label", data);
      throw new Error('Trying to save an empty label');
    }
    if (!device) {
      device = new Device(data);
      this.devices.push(device);
    } else {
      device.update(data);
    }
    this.updated = true;
    return device;
  },
  remove: function(label) {
    'use strict';
    var removeIndex = -1;
    this.devices.forEach(function(device, index) {
      if (device.get('label') === label) {
        removeIndex = index;
      }
    });
    if (removeIndex >= 0) {
      this.devices.splice(removeIndex, 1);
      this.updated = true;
      return true;
    }
    return false;
  },
  toJSON: function() {
    var json = [];
    _.each(this.devices, function (device) {
      json.push(device.toJSON());
    });
    return json;
  },
  read: function() {
    var that = this, 
        devices;
    if (fs.existsSync(this.config.devicesJson)) {
      devices = JSON.parse(fs.readFileSync(this.config.devicesJson, 'utf8'));
      this.devices = [];
      _.each(devices, function(data) {
        that.devices.push(new Device(data));
      });
    }
  },
  write: function() {
    if (this.updated) {
      var dList = this.toJSON();
      this.updated = false;
      fs.writeFileSync(this.config.devicesJson, JSON.stringify(dList, null, 2));
    }
  },
  sort: function() {
    this.devices.sort(function (a, b) {
      if (a.location > b.location) {
        return 1;
      } else if (a.location < b.location) {
        return -1;
      } else {
        if (a.label > b.label) {
          return 1;
        } else if (a.label < b.label) {
          return -1;
        }
      }
      return 0;
    });
  }
};

module.exports = Devices;
