// Devices object
var _ = require('lodash'),
    fs = require('fs'),
    Device = require('./server-device');

var Devices = {
  init: function(options) {
    this.config = options.config;
    this.updated = false;
    this.read();
  },
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
    if (!device) {
      this.devices.push(new Device(data));
    } else {
      // TODO: start to browsersync isntance if needed
      device.update(data);
    }
    this.updated = true;
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
    this.devices = [];
    if (fs.existsSync(this.config.devicesJson)) {
      devices = require(this.config.devicesJson);
      _.each(devices, function(data) {
        that.devices.push(new Device(data));
      });
    }
  },
  write: function() {
    if (this.updated) {
      this.updated = false;
      fs.writeFileSync(this.config.devicesJson, JSON.stringify(this.toJSON(), null, 2));
      console.log('Updated devices.json');
    }
  }
};

module.exports = Devices;
