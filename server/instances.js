// Devices object
var _ = require('lodash'),
    Q = require('q'),
    url = require('url'),
    Instance = require('./instance'),
    utils = require('./utils');

var Instances = {
  init: function(options) {
    'use strict';
    this.instances = [];
    this.config = options.config;
    this.devices = options.devices;
  },
  // if needle is array, return is array of matched objects
  find: function(needle) {
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
  removeInstance: function(userId) {
    'use strict';
    this.instances = _.filter(this.instances, function(instance) {
      return instance.get('user').id !== userId;
    });
  },
  start: function(data) {
    'use strict';
    var that = this,
        deferred = Q.defer(),
        userId = data.user.id || 'singleuser',
        instance = this.find(userId),
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
            that.stop(userId).then(function() {
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
  },
  startInstance: function(data, deferred) {
    console.log('Ready to start new browserSync instance');
    console.log(deferred);
    var that = this;
    var instance = new Instance(data, {config: that.config, devices: that.devices});
    that.instances.push(instance);

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
  },
  // Resolves when instance is stopped and removed
  stop: function(userId) {
    'use strict';
    var that = this,
        deferred = Q.defer(),
        instance = this.find(userId);

    if (instance) {
      console.log("Stopping instance", userId);
      instance.stop().then(function() {
        console.log("instance stopped:", userId);
        that.removeInstance(userId);
        deferred.resolve();
      });
    } else {
      console.log("no instance:", userId);
      deferred.resolve();
    }
    return deferred.promise;    
  },
  stopAll: function() {
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
  },
  forceStopAll: function() {
    _.each(this.instances, function(instance) {
      instance.forceStop();
    });
  }
};

module.exports = Instances;
