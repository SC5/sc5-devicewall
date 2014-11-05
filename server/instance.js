// Instance class
var _ = require('lodash'),
    fork = require('child_process').fork,
    url = require('url'),
    utils = require('./utils'),
    Q = require('q');

var Instance =  function (data, options) {
  this.properties = _.defaults(data, {
    status: 'starting',
    updated: +new Date()
  });
  this.devices = options.devices;
  this.config = options.config;
};

Instance.prototype.start = function(data) {
  var that = this,
      deferred = Q.defer(),
      testUrl = data.url.trim(),
      parsedUrl;

  if (testUrl.match(/:\/\//)) {
    if (!testUrl.match(/^http[s]*/)) {
      testUrl.replace(/.*:\/\//, 'http://');
    }
  } else {
    testUrl = 'http://' + testUrl;
  }
  parsedUrl = url.parse(testUrl);

  this.set('status', 'starting');
  utils.checkProxyTarget(parsedUrl, function(err, parsedUrl) {
    if (err) {
      deferred.reject('Target URL unreachable.');
    } else {
      // Set and update devices for the instance
      var instanceLabels = [];
      _.each(that.getDevices(), function(device) {
        if (!device.get('usedId') || device.get('userId') === data.user.id) {
          device.update({
            userId: data.user.id,
            userName: data.user.displayName,
            status: 'starting',
            lastUsed: +new Date()
          });
          instanceLabels.push(device.get('label'));
        }
      });
      if (!instanceLabels.length) {
        deferred.reject('No devices selected');
        return deferred.promise;
      }
      that.set('labels', instanceLabels);

      that.startBrowserSyncProcess(parsedUrl.href, data).then(deferred.resolve, deferred.reject);

    }
  });
  return deferred.promise;
};

Instance.prototype.stop = function() {
  var that = this,
      deferred = Q.defer();

  this.set('status', 'stopping');

  this.process.send({
    type: 'location',
    url: this.config.deviceWallAppURL,
    timeout: 5000,
    completeMessageType: 'browserSyncExit'
  });

  _.each(that.getDevices(), function(device) {
    device.update({
      userId: null,
      userName: null,
      status: 'idle',
      lastUsed: +new Date()
    });
  });

  return this.stopDeferred.promise;
};

Instance.prototype.startBrowserSyncProcess = function(url, data) {
  var that = this;
  this.startDeferred = Q.defer();
  this.stopDeferred = Q.defer();
  this.process = fork('./server/browsersync.js');

  this.process.on('message', function(message) {
    switch (message.type) {
      case 'browserSyncInit':
          that.set('startUrl', message.browserSync);
          that.startDeferred.resolve({startUrl: message.browserSync});
        break;
      case 'browserSyncExit':
          that.process.send({type: 'exit'});
          that.stopDeferred.resolve();
        break;
    }
  });

  this.process.send({type: 'init', url: url});

  return this.startDeferred.promise;
};

Instance.prototype.getDevices = function() {
  return this.devices.find(this.get('labels'));
};

Instance.prototype.update = function(data) {
  _.extend(this.properties, data, {
    updated: +new Date()
  });
};

Instance.prototype.set = function(property, value) {
  this.properties[property] = value;
  this.properties.updated = +new Date();
};

Instance.prototype.get = function(property) {
  return this.properties[property] || null;
};

Instance.prototype.toJSON = function() {
  return this.properties;
};

module.exports = Instance;
