var config = require("../../config.test.json");
var fs = require("fs");
var path = require("path");

module.exports.addSingleTestDevice = function(label) {
  var devicesJson = path.resolve(config.devicesJson);
  var devices = [];
  if (fs.existsSync(devicesJson)) {
    devices = JSON.parse(fs.readFileSync(devicesJson));
  }
  devices.push({
    "label": label,
    "appPlatform": "browser",
    "batteryStatus": {},
    "updated": +new Date()
  });
  fs.writeFileSync(devicesJson, JSON.stringify(devices));
};

module.exports.hasClass = function (element, cls) {
  return element.getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf(cls) !== -1;
  });
};