var config = require("../../config.test.json");
var fs = require("fs");
var path = require("path");
var socket = require("./socket");

module.exports.writeSingleTestDevice = function(label) {
  var devicesJson = path.resolve(config.devicesJson);
  var devices = [];
  if (fs.existsSync(devicesJson)) {
    devices = JSON.parse(fs.readFileSync(devicesJson));
  }
  var isDeviceInList = false;
  for (var i = 0; i < devices.length; i++) {
    if (devices[i].label === label) {
      isDeviceInList = true;
    }
  }
  if (!isDeviceInList) {
    devices.push({
      "label": label,
      "appPlatform": "browser"
    });
  }
  fs.writeFileSync(devicesJson, JSON.stringify(devices));
};

module.exports.addSingleTestDevice = function(label) {
  return socket.addDevices([label]);
};

module.exports.addMultipleTestDevices = function(labels) {
  return socket.addDevices(labels);
};

module.exports.removeTestDevices = function() {
  return socket.removeAllDevices();
};

module.exports.clearAfterEach = function() {
  socket.stopAll();
  return socket.removeAllDevices();
};

module.exports.hasClass = function (element, cls) {
  return element.getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf(cls) !== -1;
  });
};