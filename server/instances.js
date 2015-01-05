// Devices object
var _ = require('lodash'),
    Q = require('q'),
    url = require('url'),
    events = require('events'),
    Instance = require('./instance'),
    utils = require('./utils');


var Instances = function(options) {
  'use strict';
  this.instances = [];
  this.config = options.config;
  this.devices = options.devices;
};

// Event emitters
Instances.prototype.__proto__ = events.EventEmitter.prototype;

Instances.prototype.externalUrl = function(options) {
  this.emit('click:externalurl', options);
};

// if needle is array, return is array of matched objects
Instances.prototype.find = function(needle) {
  'use strict';
  if (_.isArray(needle)) {
    return _.filter(this.instances, function(instance) {
      return _.indexOf(needle, instance.get('user').id) !== -1;
    });
  } else {
    return _.find(this.instances, function(instance) {
      return instance.get('user').id === needle;
    });
  }
},

Instances.prototype.findInstanceByUrl = function(urlString) {
  'use strict';
  return _.find(this.instances, function(instance) {
    return instance.get('url') === urlString;
  });
};

Instances.prototype.removeInstance = function(urlString) {
  'use strict';
  this.instances = _.filter(this.instances, function(instance) {
    return instance.get('url') !== urlString;
  });
};

Instances.prototype.start = function(data) {
  'use strict';
  var that = this,
      deferred = Q.defer(),
      userId = data.user.id || 'singleuser',
      urlString = data.url,
      instance = this.findInstanceByUrl(urlString),
      proxyOptions = {};

  proxyOptions.userAgentHeader = data.userAgentHeader || false;
  var parsedUrl = url.parse(data.url);
  if (parsedUrl.protocol === null) {
    parsedUrl.protocol = 'http';
  }

  utils.checkProxyTarget(parsedUrl, proxyOptions, function(err, resolvedUrl) {
    utils.resetRedirectCounter();
    if (err) {
      console.warn('Target URL unreachable.', err);
      deferred.reject(err);
    } else {
      console.log("url after checking all the redirections: ", resolvedUrl.href);
      data.url = resolvedUrl.href;
      if (instance && instance.isConnected()) {
        var previousUrlObject = url.parse(instance.get('url'));
        var nextUrlObject = resolvedUrl;
        if (previousUrlObject.host === nextUrlObject.host) {
          // same host, just send new location
          instance.set('url', resolvedUrl.href);
          instance.location(resolvedUrl.path);
          deferred.resolve();
        } else {
          // stop before relaunch
          that.stop(urlString).then(function() {
            that.startInstance(data, deferred);
          });
        }
      } else {
        // make new instance
        that.startInstance(data, deferred);
      }
    }
  });
  return deferred.promise;
};

Instances.prototype.startInstance = function(data, deferred) {
  console.log('Ready to start new browserSync instance');
  var that = this;

  that._callDevices(data)
    .then(function(usedLabels) {
    var clone = _.clone(that.devices);
    clone.devices = _.filter(clone.devices, function(device) {
      return usedLabels.indexOf(device.get('label')) > -1;
    });
    var instance = new Instance(data, {config: that.config, devices: clone});
    that.instances.push(instance);

    // Bind event listener for exteranl URL clicks
    instance.on('click:externalurl', function(options) {
      that.externalUrl(options);
    });

    instance.start(data)
      .then(function(data) {
        console.info("Instance.start: browserSync started", data.url);
        deferred.resolve(data);
      })
      .fail(function(reason) {
        console.error("failed to start new instance", reason);
        that.stop(data.user.id).then(function() {
          deferred.reject(reason);
        });
      });
  })
    .fail(function() {
      console.error('Instances::Devices did not return, stopping all processes.');
      that.stopAll().then(function() {
        console.error('Instances::All processes stopped.');
      });
    });
};

Instances.prototype._callDevices = function(data) {
  var deferred = Q.defer();
  var promises = [];
  var returnedDevices = [];

  if (this.instances.length > 0) {
    // Check if we have to call any devices back home first
    _.each(this.instances, function(instance) {
      var devicesToBeCalledHome = _.filter(instance.getDevices(), function(device) {
        return data.labels.indexOf(device.get('label')) > -1;
      });
      if (devicesToBeCalledHome.length > 0) {
        _.each(devicesToBeCalledHome, function(device) {
          returnedDevices.push(device);
          instance.clearDevice(device);
          promises.push(instance.callDeviceHome(device));
        });
      }
    });
  }
  var timer = 30000;
  var timeout = setTimeout(function() {
    deferred.reject();
  }, timer);

  Q.all(promises).fin(function() {
    clearTimeout(timeout);
    // The devices that were called home
    var labels = _.map(returnedDevices, function(device) {
      return device.get('label');
    });
    // The devices that were in the original UI request
    labels = _.union(labels, data.labels);
    deferred.resolve(labels);
  });
  return deferred.promise;
};

Instances.prototype._addInstanceListeners = function(instance) {
  instance.on('foobar', function(msg) {
    console.info('GOT A MESSAGE! ', msg);
  });
};

// Resolves when instance is stopped and removed
Instances.prototype.stop = function(urlString) {
  'use strict';
  var that = this,
      deferred = Q.defer(),
      instance = this.findInstanceByUrl(urlString);

  if (instance) {
    console.log("Stopping instance", urlString);
    instance.stop().then(function() {
      console.log("instance stopped:", urlString);
      that.removeInstance(urlString);
      deferred.resolve();
    });
  } else {
    console.log("no instance:", urlString);
    deferred.resolve();
  }
  return deferred.promise;
};

Instances.prototype.stopAll = function() {
  'use strict';
  var that = this,
      deferred = Q.defer(),
      promises = [];
  console.log("instances.stopAll");
  _.each(this.instances, function(instance) {
    promises.push(instance.stop());
  });
  Q.all(promises).fin(function() {
    that.instances = [];
    deferred.resolve();
  }, function(err) {
    console.error(err);
  });
  return deferred.promise;
};

Instances.prototype.forceStopAll = function() {
  _.each(this.instances, function(instance) {
    instance.forceStop();
  });
};

module.exports = Instances;
