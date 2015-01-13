// Instance class
var _ = require('lodash'),
  fork = require('child_process').fork,
  Q = require('q');

var STATUS_STARTING = 'starting';
var STATUS_RUNNING = 'running';
var STATUS_STOPPING = 'stopping';
var STATUS_STOPPED = 'stopped';

var Instance = function (data, options) {
  this.devices = options.devices;
  this.config = options.config;
  this.emitter = options.emitter;
  this.returned = [];
  this.stopping = false;
  this.properties = _.defaults(data, {
    status: STATUS_STOPPED,
    updated: +new Date()
  });
};

Instance.prototype.start = function(data) {
  'use strict';
  var deferred = Q.defer();

  if (this.canBeStarted() === false) {
    deferred.reject('Instance start rejected because it cannot be started when its already running!');
    return deferred.promise;
  }
  this.markDevices(data, STATUS_STARTING);

  this.set('status', STATUS_STARTING);
  this.set('labels', data.labels);

  return this._startBrowserSyncProcess(data);
};


Instance.prototype.clearDevice = function(device) {
  if (device) {
    device.update({
      userId: null,
      userName: null,
      status: 'idle',
      lastUsed: +new Date()
    });
  }
};

Instance.prototype.callDeviceHome = function(device) {
  var deferred = Q.defer();
  if (this.isConnected()) {
    var timer = 5000;
    var timeout = setTimeout(function() {
      deferred.reject();
    }, timer);

    this.returned.push({
      device: device,
      deferred: deferred,
      timeout: timeout,
      done: false
    });

    this.childProcess.send({
      type: 'returnDeviceHome',
      device: device
    });

  } else {
    console.error('Instance::No child process or child process is not connected.');
    this.stop();
    deferred.reject();
  }
  return deferred.promise;
};

Instance.prototype.shouldInstanceStop = function() {
  if (this.stopping === true) {
    console.info('Instance::Already stopping.');
    return;
  }
  var that = this;
  var original = this.getDevices().length;
  var recalled = this.returned.length;

  if (recalled >= original) {
    this.stopping = true;
    console.log('Instance::Stopping Empty Instance.');
    this.stop()
    .then(function() {
      console.log('Instance::Empty Instance Stopped.');
    })
    .fail(function() {
      console.error('Instance::Failed to stop instance, force stopping.');
      that.forceStop();
    });
  }
};

Instance.prototype.stop = function(options) {
  'use strict';
  console.info("instance.stop current status: ", this.get('status'));
  var that = this;
  var deferred = Q.defer();
  options = options || {};
  if (this.canBeStopped() === false) {
    deferred.reject('Instance.stop(): Instance is not in running state');
    return deferred.promise;
  }

  that.set('status', STATUS_STOPPING);
  console.log("instance stopping");

  if (options.all) {
    _.each(that.getDevices(), function(device) {
      that.clearDevice(device);
    });
  }

  if (options.timedout) {
    _.each(that.getActiveDevices(), function(device) {
      that.clearDevice(device);
    });
  }

  if (that.isConnected()) {
    console.log("instance.stop sending browserSyncExit");

    // listen exit event
    // what if browserSync refuses to stop?
    // TODO maybe use some force? http://nodejs.org/api/child_process.html#child_process_child_kill_signal
    this.childProcess.on('exit', function() {
      that.set('status', STATUS_STOPPED);
      console.info("child_process exited");
      deferred.resolve();
    });
    this.childProcess.send({
      type: 'location',
      url: this.config.deviceWallAppURL,
      timeout: 8000,
      completeMessageType: 'browserSyncExit'
    });
  } else {
    console.log("instance.stop child not connected");
    this.set('status', STATUS_STOPPED);
    deferred.resolve();
  }

  return deferred.promise;
};

Instance.prototype.forceStop = function() {
  if (this.childProcess) {
    this.childProcess.kill('SIGHUP');
  }
};

Instance.prototype.location = function(urlPath) {
  var deferred = Q.defer();
  if (this.isConnected()) {
    this.childProcess.on('message', function(message) {
      if (message.type === 'browserSyncUpdate') {
        deferred.resolve();
      }
    });
    this.childProcess.send({
      type: 'location',
      url: urlPath,
      timeout: 5000,
      completeMessageType: 'browserSyncUpdate'
    });
  }
  return deferred.promise;
};

Instance.prototype.syncClientLocations = function() {
  if (this.isConnected()) {
    this.childProcess.send({
      type: 'syncLocations',
      timeout: 5000
    });
  }
};

Instance.prototype._startBrowserSyncProcess = function(data) {
  var that = this;
  var deferred = Q.defer();
  var debug = process.execArgv.indexOf('--debug') !== -1;
  var forkArgs = {};
  console.log('Starting new browserSync process');
  if (debug) {
    console.log("debug enabled");
    // use different debug port for fork, so it does not override main debugger
    // http://stackoverflow.com/questions/16840623/how-to-debug-node-js-child-forked-process
    forkArgs.execArgv = ['--debug-brk=6001'];
  }
  this.childProcess = fork('./server/browsersync.js', forkArgs);
  this.childProcess.setMaxListeners(this.config.maxListeners);

  this.childProcess.on('message', function(message) {
    switch (message.type) {
      case 'browserSyncInit':
        console.log('instance: browserSync init confirm');
        that.update({
          'status': STATUS_RUNNING,
          'startUrl': message.browserSync
        });
        deferred.resolve({startUrl: message.browserSync});
        break;
      case 'browserSyncExit':
        that.set('status', STATUS_STOPPED);
        console.log('instance.js: browsersync stop');
        that.childProcess.send({type: 'exit'});
        break;
      case 'browserSyncSocketId':
        var device =_.find(that.getDevices(), function(device) {
          return device.get('devicewall') === message.devicewall;
        });
        if (device) {
          device.set('browsersync', message.browsersync);
        }
        break;
      case 'browserSyncSocketRoomsUpdate':
        var device = _.find(that.getDevices(), function(device) {
          return _.intersection(message.browsersync, device.get('browsersync')).length > 0;
        });
        if (device) {
          device.set('browsersync', message.browsersync);
        }
        break;
      case 'browserSyncReturnedDeviceHome':
        if (message.device && message.device.label) {
          var msgLabel = message.device.label;
          _.each(that.returned, function(obj) {
            var objLabel = obj.device.properties.label;
            if (obj.done === false && objLabel.indexOf(msgLabel) > -1) {
              clearTimeout(obj.timeout);
              obj.deferred.resolve();
              obj.done = true;
            }
          });
          that.shouldInstanceStop();
        } else {
          console.error('Instance::No device object in ReturnedDeviceHome message.');
        }
        break;
      case 'browserSyncExternalUrl':
        if (message.href) {
          that.emitter.emit('click:externalurl', {
            url: message.href,
            labels: that.getActiveDeviceLabels(),
            user: that.properties.user,
            userAgentHeader: that.properties.userAgentHeader
          });
        }
        break;
      case 'browserSyncIdleTimeout':
        console.log('BrowserSync timeout, stopping.');
        that.stop({ timedout: true });
        break;
    }
  });

  console.info(">> childProcess init url:", data.url);
  this.childProcess.send({type: 'init', url: data.url, userAgentHeader: data.userAgentHeader});

  return deferred.promise;
};

Instance.prototype.getDevices = function() {
  return this.devices.find(this.get('labels'));
};

Instance.prototype.getActiveDevices = function() {
  var activeDevices = this.getActiveDeviceLabels();
  return _.filter(this.getDevices(), function(device) {
    return activeDevices.indexOf(device.get('label')) > -1;
  });
};

Instance.prototype.getDeviceLabels = function() {
  return _.map(this.getDevices(), function(device) {
    return device.get('label');
  });
};

Instance.prototype.getReturnedDeviceLabels = function() {
  return _.map(this.returned, function(obj) {
    return obj.device.get('label');
  });
};

Instance.prototype.getActiveDeviceLabels = function() {
  return _.difference(this.getDeviceLabels(), this.getReturnedDeviceLabels());
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
  return this.childProcess && this.childProcess.connected;
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

Instance.prototype.canBeStarted = function() {
  return this.get('status') === STATUS_STOPPED;
};

Instance.prototype.canBeStopped = function() {
  return this.get('status') === STATUS_RUNNING;
};

Instance.prototype.markDevices = function(data, status) {
  _.each(this.getDevices(), function(device) {
    if (!device.get('usedId') || device.get('userId') === data.user.id) {
      device.update({
        userId: data.user.id,
        userName: data.user.displayName,
        status: status,
        lastUsed: +new Date()
      });
    }
  });
};

module.exports = Instance;
