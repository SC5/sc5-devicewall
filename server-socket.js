module.exports = function (app, options) {
  var
    io = options.io,
    config = options.config,
    childProcesses = {},
    fork = require('child_process').fork,
    fs = require('fs'),
    nsApp = io.of('/devicewallapp'),
    ns = io.of('/devicewall'),
    Q = require('q'),
    devices = [],
    instances = {},
    instancesUpdated = false,
    devicesUpdated = false,
    updateInterval;

  if (fs.existsSync('./data/devices.json')) {
    devices = require('./data/devices.json');
  }

  if (fs.existsSync('./data/instances.json')) {
    instances = require('./data/instances.json');
  }

  function updateDevices() {
    if (devicesUpdated) {
      devicesUpdated = false;
      fs.writeFileSync('./data/devices.json', JSON.stringify(devices));
      console.log('Updated devices.json');
    }
  }

  function updateInstances() {
    if (instancesUpdated) {
      instancesUpdated = false;
      fs.writeFileSync('./data/instances.json', JSON.stringify(instances));
      console.log('Updated instances.json');
    }
  }

  function instanceCanBeStarted(user) {
    var deferred = Q.defer();
    if (childProcesses[user.id]) {
      childProcesses[user.id].send({
        type: 'location',
        url: config.deviceWallAppURL,
        timeout: 5000,
        completeMessageType: 'browserSyncExit'
      });
      childProcesses[user.id].on('message', function(message) {
        if (message.type === 'browserSyncExit') {
          deferred.resolve();
        }
      });
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  app.on('update-devices', function () {
    devicesUpdated = true;
  });

  app.on('update-instances', function () {
    instancesUpdated = true;
  });

  // Namespace "devicewallapp"
  nsApp.on('connection', function (socket) {
    console.log('DeviceWall device connected!');

    // Update device status
    socket.on('update', function (data) {
      var label = data.label,
          model = data.model,
          batteryStatus = data.batteryStatus,
          platform = data.platform,
          appPlatform = data.appPlatform,
          version = data.version,
          updated = false;

      devices.forEach(function (device, index) {
        if (device.label === label) {
          if (model) {
            device.model = model;
          }
          if (platform) {
            device.platform = platform;
          }
          if (version) {
            device.version = version;
          }
          if (appPlatform) {
            device.appPlatform = appPlatform;
          }
          device.batteryStatus = batteryStatus;
          device.updated = +new Date();
          updated = true;
        }
      });

      if (!updated) {
        devices.push({
          label: label,
          model: model,
          platform: platform,
          appPlatform: appPlatform,
          version: version,
          batteryStatus: batteryStatus,
          updated: +new Date()
        });
      }

      app.emit('update-devices');
      ns.emit('update', devices);
    });

    socket.on('check-platform', function(data, fn) {
      var appPlatform = '';
      devices.forEach(function (device, index) {
        if (data.label === device.label) {
          appPlatform = device.appPlatform;
        }
      });
      fn({appPlatform: appPlatform});
    });

    socket.on('disconnect', function () {
      console.log('DeviceWall device disconnected.');
    });
  });

  // Namespace "devicewall"
  ns.on('connection', function (socket) {
    console.log('DeviceWall control panel connected!');

    // Start
    socket.on('start', function (data) {
      console.log('DeviceWall control panel start.');

      var user = data.user,
          testUrl = data.url,
          labels = data.labels || [];

      if (testUrl.match(/:\/\//)) {
        if (!testUrl.match(/^http[s]*/)) {
          testUrl.replace(/.*:\/\//, 'http://');
        }
      } else {
        testUrl = 'http://' + testUrl;
      }

      // Updating devices
      devices.forEach(function (device, deviceIndex) {
        labels.forEach(function (label, labelIndex) {
          // Check that there's no user or same user tries to use device
          if (device.label === label && (!device.userId || device.userId === user.id)) {
            device.userId = user.id;
            device.userName = user.displayName;
            device.lastUsed = +new Date();
          }
        });
      });

      // Updating instances
      var updated = false;

      if (instances[user.id]) {
        updated = true;
        instances[user.id].url = testUrl;
        instances[user.id].labels = labels;
        instances[user.id].browserSync = null;
        instances[user.id].updated = +new Date();
      }

      if (!updated) {
        instances[user.id] = {
          userId: user.id,
          url: testUrl,
          labels: labels,
          browserSync: null,
          updated: +new Date()
        };
      }

      instanceCanBeStarted(user).then(function() {
        childProcesses[user.id] = fork('./server-browsersync');
        childProcesses[user.id].on('message', function(message) {
          if (message.type === 'browserSyncInit') {
            if (instances[user.id]) {
              instances[user.id].browserSync = message.browserSync;
              instances[user.id].updated = +new Date();
            }
            data.url = message.browserSync;
            app.emit('update-instances');
            app.emit('update-devices');
            ns.emit('update', devices);
            ns.emit('start', data);
            nsApp.emit('start', data);
          }
          if (message.type === 'browserSyncExit') {
            childProcesses[user.id].send({type: 'exit'});
            if (childProcesses[user.id]) {
              delete childProcesses[user.id];
            }
            if (instances[user.id]) {
              delete instances[user.id];
            }
            ns.emit('server-stop', {user: user});
          }
        });
        childProcesses[user.id].send({type: 'init', url: testUrl});
      });
    });

    // Stop
    socket.on('stop', function (data) {
      console.log('DeviceWall control panel stop.');

      var labels = data.labels,
          user = data.user;

      // Update device
      devices.forEach(function (device, index) {
        labels.forEach(function (label, index) {
          if (device.label === label) {
            device.userId = null;
            device.userName = null;
          }
        });
      });

      app.emit('update-devices');
      ns.emit('update', devices);
      nsApp.emit('stop', data);

      if (user && childProcesses[user.id]) {
        childProcesses[user.id].send({
          type: 'location',
          url: config.deviceWallAppURL,
          timeout: 5000,
          completeMessageType: 'browserSyncExit'
        });
      }
    });

    function instanceHasStopped(userId) {
      var deferred = Q.defer();
      childProcesses[userId].on('message', function(message) {
        if (message.type === 'browserSyncExit') {
          deferred.resolve();
        }
      });
      childProcesses[userId].send({
        type: 'location',
        url: config.deviceWallAppURL,
        timeout: 5000,
        completeMessageType: 'browserSyncExit'
      });
      return deferred.promise;
    }

    // Stop all running instances
    socket.on('stopall', function() {
      var promises = [];
      for (var userId in childProcesses) {
        promises.push(instanceHasStopped(userId));
      }
      Q.all(promises).fin(function() {
        devices.forEach(function (device, index) {
          device.userId = null;
          device.userName = null;
        });
        app.emit('update-devices');
        ns.emit('update', devices);
        ns.emit('stopall');
      });
    });

    // List devices
    socket.on('list', function (fn) {
      devices.sort(function (a, b) {
        if (a.location > b.location) {
          return 1;
        } else if (a.location < b.location) {
          return -1;
        } else {
          if (a.label > b.label) {
            return 1;
          } else if (a.label < b.label) {
            return -1;
          }
        }
        return 0;
      });

      fn(devices);
    });

    socket.on('remove', function(data) {
      devices = devices.filter(function (device) {
        var removeDevice = false;
        data.labels.forEach(function(element) {
          if (element === device.label) {
            removeDevice = true;
          }
        });
        return !removeDevice;
      });
      app.emit('update-devices');
      ns.emit('update', devices);
    });

    socket.on('save', function (data) {
      var
        label = data.label,
        key = data.key,
        value = data.value;

      // Update device
      devices.forEach(function (device, index) {
        if (device.label === label) {
          device[key] = value;
        }
      });

      app.emit('update-devices');
      socket.broadcast.emit('update', devices);
    });

    socket.on('disconnect', function () {
      console.log('DeviceWall control panel disconnected.');
    });
  });

  updateInterval = setInterval(function() {
    updateDevices();
    updateInstances();
  }, 10000);
};