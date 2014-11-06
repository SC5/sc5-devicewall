// Instance class
var _ = require('lodash'),
    fork = require('child_process').fork,
    utils = require('./utils'),
    Q = require('q');

var Instance =  function (data, options) {
  this.devices = options.devices;
  this.config = options.config;
  this.properties = _.defaults(data, {
    status: 'new',
    updated: +new Date()
  });
  this.startDeferred = Q.defer();
  this.stopDeferred = Q.defer();
};

Instance.prototype.start = function(data) {
  'use strict';
  this.startDeferred = Q.defer();
  this.stopDeferred = Q.defer();

  var that = this,
      deferred = Q.defer();

  this.whenReady().then(function() {
    that.set('status', 'starting');
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

    that.startBrowserSyncProcess(data).then(deferred.resolve, deferred.reject);
  });

  return deferred.promise;
};

Instance.prototype.stop = function() {
  'use strict';
  var that = this;

  this.whenReady().then(function() {
    that.set('status', 'stopping');

    that.process.send({
      type: 'location',
      url: that.config.deviceWallAppURL,
      timeout: 5000,
      completeMessageType: 'browserSyncExit'
    });

    if (that.isConnected()) {
      that.process.send({
        type: 'location',
        url: that.config.deviceWallAppURL,
        timeout: 5000,
        completeMessageType: 'browserSyncExit'
      });
    }

    _.each(that.getDevices(), function(device) {
      device.update({
        userId: null,
        userName: null,
        status: 'idle',
        lastUsed: +new Date()
      });
    });
  });

  return this.stopDeferred.promise;
};

Instance.prototype.location = function(data) {
  var path = url.parse(data.url).path;

  this.startDeferred = Q.defer();
  this.stopDeferred = Q.defer();

  instance.process.send({
    type: 'location',
    url: path,
    timeout: 5000,
    completeMessageType: 'browserSyncUpdate'
  });

  return this.startDeferred.promise;
};

Instance.prototype.startBrowserSyncProcess = function(data) {
  var that = this;
  this.process = fork('./server/browsersync.js');

  this.process.on('message', function(message) {
    switch (message.type) {
      case 'browserSyncInit':
          that.update({
            'status': 'running',
            'startUrl': message.browserSync
          });
          that.startDeferred.resolve({startUrl: message.browserSync});
        break;
      case 'browserSyncUpdate':
          that.update({
            'status': 'running',
            'startUrl': data.url
          });
          that.startDeferred.resolve({startUrl: data.url});
        break;
      case 'browserSyncExit':
          that.set('status', 'stopped');
          console.log('instance.js: browsersync stop');
          that.process.send({type: 'exit'});
          that.stopDeferred.resolve();
        break;
    }
  });

  this.process.send({type: 'init', url: data.url});

  return this.startDeferred.promise;
};

Instance.prototype.whenReady = function() {
  if (this.get('status') === 'stopping') {
    return this.stopDeferred.promise;
  } else if (this.get('status') === 'starting') {
    return this.startDeferred.promise;
  } else {
    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise;
  }
};

Instance.prototype.getDevices = function() {
  return this.devices.find(this.get('labels'));
};

Instance.prototype.update = function(data) {
  _.each(data, function(d, k) {
    if (k === 'status') {
      console.log('status: '+d);
    }
  });
  _.extend(this.properties, data, {
    updated: +new Date()
  });
};

Instance.prototype.isConnected = function() {
  'use strict';
  return this.process && this.process.connected;
};

Instance.prototype.set = function(property, value) {
  if (property === 'status') {
    console.log('status: '+value);
  }
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
