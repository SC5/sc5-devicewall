// Device class
var _ = require('lodash');

var Device =  function (data) {
  this.properties = _.defaults(data, {
    status: 'idle',
    updated: +new Date()
  });
};

Device.prototype.update = function(data) {
  _.extend(this.properties, data, {
    updated: +new Date()
  });
};

Device.prototype.set = function(property, value) {
  this.properties[property] = value;
  this.properties.updated = +new Date();
};

Device.prototype.get = function(property) {
  return this.properties[property] || null;
};

Device.prototype.toJSON = function() {
  return this.properties;
};

module.exports = Device;
