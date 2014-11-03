// Devices object
var _ = require('lodash'),
    Q = require('q'),
    Instance = require('./server-instance');

var Instances = {
  init: function(options) {
    this.instances = [];
    this.config = options.config;
    this.devices = options.devices;
  },
  find: function(needle) {
    if (_.isArray(needle)) {
      return _.filter(this.instances, function(instance) {
        return _.indexOf(needle, instance.get('userId')) !== -1;
      });
    } else {
      return _.find(this.instances, function(instance) {
        return instance.get('userId') === needle;
      });
    }

  },
  removeInstance: function(userId) {
    this.instances = _.filter(this.instances, function(instance) {
      return instance.get('userId') !== userId;
    });
  },
  start: function(data) {
    var that = this,
        deferred = Q.defer(),
        instance = this.find(data.user.id);

    if (!instance) {
      instance = new Instance(data, {config: this.config, devices: this.devices});
      this.instances.push(instance);
      instance.start(data).then(
        function() {
          deferred.resolve();
        },
        function(reason) {
          that.stop(data.user.id).then(function() {
            deferred.reject(reason);
          });
        }
      );
    } else {
      // todo update
    }
    return deferred.promise;
  },
  // Resolves when instance is stopped and removed
  stop: function(userId) {
    var that = this,
        deferred = Q.defer(),
        instance = this.find(userId);

    if (instance) {
      instance.stop().then(function() {
        that.removeInstance(userId);
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
    return deferred.promise;    
  },
  stopAll: function() {
    var that = this,
        deferred = Q.defer(),
        promises = [];
    _.each(this.instances, function(instance) {
      promises.push(instance.stop());
    });
    Q.all(promises).fin(function() {
      that.instances = [];
      deferred.resolve();
    });
    return deferred.promise;
  }
};

module.exports = Instances;
