var config = require('../../server/config.js');
var testHost = config.protocol + '://' + config.host + ':' + config.port;
var socketApp = require('socket.io-client')(testHost + '/devicewallapp');
var socket = require('socket.io-client')(testHost + '/devicewall');
var Q = require('q');

function deferredEmit(socket, event, data, timeout) {
  var deferred = Q.defer();
  var t1;
  if (timeout) {
    t1 = setTimeout(function(){
      deferred.reject();
    }, timeout);
  }
  socket.emit(event, data, function(confirmation){
    if (t1) {
      clearTimeout(t1);
    }
    deferred.resolve();
  });
  return deferred.promise;
}

module.exports.start = function(user, labels, url) {
  socket.emit('start', {
    "user": user,
    "labels": labels,
    "url": url
  });
};

module.exports.stop = function(user, labels) {
  socket.emit('stop', {
    "user": user,
    "labels": labels
  });
};

module.exports.stopAll = function() {
  var deferred = Q.defer();
  socket.emit('stopall', {}, deferred.resolve);
  return deferred.promise;
};

module.exports.update = function() {
  var devicesJson = path.resolve(config.devicesJson);
  var devices = [];
  if (fs.existsSync(devicesJson)) {
    devices = JSON.parse(fs.readFileSync(devicesJson));
  }
  socket.emit('update', devices);
};

module.exports.addDevices = function(labels) {
  var deferreds = [];
  var deferred = protractor.promise.defer();
  var now = new Date().getTime();
  for(var i = 0; i < labels.length; i++) {
    deferreds.push(deferredEmit(socketApp, 'update', {
      "label": labels[i],
      "appPlatform": "browser",
      "lastSeen": now
    }, 500));
  }
  Q.all(deferreds).fin(function() {
    deferred.fulfill();
  });
  return deferred.promise;
};

module.exports.removeAllDevices = function() {
  var deferred = protractor.promise.defer();
  socket.emit('list', {}, function(devices) {
    var labels = [];
    for (var i = 0; i < devices.length; i++) {
      labels.push(devices[i].label);
    }
    deferredEmit(socket, 'remove', {
      "labels": labels
    }, 500).fin(function() {
      deferred.fulfill();
    });
  });
  return deferred.promise;
};


module.exports.reloadDevices = function() {
  var dfd = protractor.promise.defer();
  socket.emit('reload-devices', {}, dfd.fulfill);
  return dfd.promise;
};