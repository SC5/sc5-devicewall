var _ = require('lodash');
var socketio = require('socket.io');
var utils = require('./utils.js');

module.exports = function (app, options) {
  'use strict';
  var
    io = socketio(app),
    config = options.config,
    emitter = options.emitter,
    nsApp = io.of('/devicewallapp'),
    nsCtrl = io.of('/devicewall'),
    devices = require('./devices'),
    instances = require('./instances'),
    bsInterval;

  // Device
  nsApp.use(function(socket, next) {
    var label = socket.handshake.query.label;
    if (label) {
      utils.updateLastSeen(label, devices);
      updateDevicesToControlPanel();
    }
    next();
  });
  nsApp.on('connection', function (socket) {
    console.log('Test device connected!');
    nsApp.emit("version", utils.getVersion());

    socket.on('ping', pingApp);
    socket.on('rename', rename);
    socket.on('update', update);
    socket.on('started', started);
    socket.on('idling', idling);
    socket.on('disconnect', disconnect);
    socket.on('check-platform', checkPlatform);

    function pingApp(data) {
      if (data.label) {
        utils.updateLastSeen(data.label, devices);
        //console.log(new Date().toISOString() + " Client <<<< ping " + data.label);
      }
    }

    function rename(data) {
      console.log("Client <<<< rename ", data);
      var device = devices.find(data.oldLabel);
      if (device) {
        if (devices.remove(data.oldLabel)) {
          console.log("Removed label " + data.oldLabel);
        } else {
          console.log("Unable to remove label " + data.oldLabel);
        }
        device.set('label', data.newLabel);
        devices.update(device.toJSON());
        console.log("Control >>>> rename ", data);
        nsCtrl.emit('rename', data);
      } else {
        console.log("Device label " + data.oldLabel + " does not exists");
      }
    }

    function update(data) {
      console.log("Client <<< update", data);
      var device;
      if (_.has(data, 'label') === false || data.label === '') {
        console.error("Client sent an empty label", data);
        return;
      }
      if (_.has(data, 'appVersion')) {
        if (data.appVersion !== utils.getVersion()) {
          nsApp.emit("version", utils.getVersion());
        }
      }
      device = devices.find(data.label);
      if (device) {
        // Set version and platform if not defined
        _.each(['version', 'platform'], function(infoItem) {
          if (_.has(data, infoItem) && device.has(infoItem) === false) {
            device.set(infoItem, data[infoItem]);
          }
        });
        data = device.toJSON();
      }

      data.lastSeen = new Date().getTime();
      device = devices.update(data);

      if (device.get('userId')) {
        var instance = instances.find(device.get('userId'));
        if (instance) {
          if (instance.get('status') === 'running') {
            device.set('status', 'starting');
            console.log("Client >>> start", data);
            var startData = {
              labels: instance.get('labels'),
              url: instance.get('startUrl')
            };
            socket.emit('start', startData);
            instance.syncClientLocations();
          }
        }
      }
      console.log("Control >>>> update", devices.toJSON());
      nsCtrl.emit('update', devices.toJSON());
    }

    function started(options) {
      console.log("Client <<< started: ", options.label, options.socketId);
      var device = devices.find(options.label);
      if (device) {
        device.set('status', 'running');
        device.set('devicewall', options.socketId);
        nsCtrl.emit('update', devices.toJSON());
      }
    }

    function idling(label) {
      console.log("Client <<< idling", label);
      var device = devices.find(label);
      if (device) {
        device.set('status', 'idle');
        device.set('updated', +new Date());
        devices.update(device.toJSON());
        app.emit('update-devices');
        console.log("Control >>>> update", devices.toJSON());
        nsCtrl.emit('update', devices.toJSON());
      }
    }

    function disconnect() {
      console.log("Client <<< disconnect");
    }

    function checkPlatform(data, fn) {
      console.log("Client <<< check-platform", data);
      var appPlatform = '';
      var device = devices.find(data.label);
      if (device) {
        appPlatform = device.appPlatform;
      }
      fn({appPlatform: appPlatform});
    }
  });

  // Control panel
  nsCtrl.on('connection', function (socket) {
    console.log('Control <<<< connection');
    // Start
    socket.on('start', start);
    socket.on('stop', stop);
    socket.on('stopall', stopAll);
    socket.on('disconnect', disconnect);
    socket.on('list', list);
    socket.on('save', save);
    socket.on('remove', removeDevices);
    socket.on('reload-devices', reloadDevices);
    if (process.env.NODE_ENV === "test") {
      socket.on('reset', resetAppData);
    }

    function stop(data) {
      console.log("Control <<< stop", data);
      instances.stop(data.url).then(function() {
        console.log('Control >> update', devices.toJSON());
        nsCtrl.emit('update', devices.toJSON());
        console.log('Control >> stop', data);
        nsCtrl.emit('stop', data);
      });
    }

    function stopAll() {
      console.log("Control <<< stopAll");
      instances.stopAll().done(function() {
        console.log('Control >> update', devices.toJSON());
        nsCtrl.emit('update', devices.toJSON());
        console.log('Control >> stopall');
        nsCtrl.emit('stopall');
      });
    }

    function disconnect () {
      console.log("Control <<< disconnect");
    }

    function list(data, fn) {
      console.log("Control <<< list");
      devices.sort();
      if (typeof(fn) === typeof(Function)) {
        fn(devices.toJSON());
      } else {
        console.log("not a function: ", fn);
      }
    }

    function save(data) {
      console.log("Control <<< save", data);
      var device = devices.find(data.label);
      if (device) {
        ['model', 'version', 'platform'].forEach(function(val) {
          if (data[val]) {
            device.set(val, data[val]);
          }
        });
        devices.update(device.toJSON());
      }
      app.emit('update-devices');
      socket.broadcast.emit('update', devices.toJSON());
    }

    function removeDevices(data) {
      console.log("Control <<< remove", data);
      data.labels.forEach(function(label) {
        devices.remove(label);
      });
      app.emit('update-devices');
      socket.broadcast.emit('remove', data.labels);
    }

    function reloadDevices() {
      console.log("Control <<< reload-devices");
      devices.read();
    }

    // only used with e2e tests
    function resetAppData() {
      console.info("Control <<< reset");
      instances.forceStopAll();
      //instances.stopAll().then(function() {
        console.info(">>> resetted");
        socket.emit("resetted");
      //});
      devices.removeAll();
    }
  });

  function start(data) {
    console.log("Control <<< start", data);
    var uri = utils.guessURI(data.url);
    if (uri === false) {
      console.log("Invalid URL: " + data.url);
      var emitData = {user: data.user, reason: "Invalid URL"};
      console.log('Control >> server-stop', emitData);
      nsCtrl.emit('server-stop', emitData);
      return;
    }
    data.url = uri;

    instances.start(data).then(
      function(startData) {
        var appData = _.clone(data);
        appData.url = startData.startUrl;

        console.log('Control >> socket "update"');
        // Add site and proxy URIs to control panel 'update' event
        var devicesClone = devices.toJSON();
        _.each(devicesClone, function(device) {
          if (data.labels.indexOf(device.label) > -1) {
            device.site = data.url;
            device.proxy = startData.startUrl;
          }
        });
        nsCtrl.emit('update', devicesClone);

        console.log('Control >> start', data);
        nsCtrl.emit('start', data);
        console.log('Client >> start', appData);
        nsApp.emit('start', appData);
        checkDevicesSentToBrowserSync(data, appData);
        instances.waitForClientConnections(data.labels.length).then(function() {
          console.log('Control >> running', data);
          nsCtrl.emit('running', data);
        });
      },
      function(reason) {
        var emitData = {user: data.user, reason: reason};
        console.log('Control >> server-stop', emitData);
        nsCtrl.emit('server-stop', emitData);
      }
    );
  };

  function checkDevicesSentToBrowserSync(data, appData) {
    if (bsInterval) { return; }

    var count = 0;
    bsInterval = setInterval(function() {
      count++;
      var check = false;

      devices.devices.forEach(function(device) {
        if (data.labels.indexOf(device.get('label')) > -1 && device.get('browsersyncStatus') !== 'Connected') {
          device.set('browsersyncConnecting', true);
          check = true;
        } else {
          device.set('browsersyncConnecting', false);
        }
      });

      nsCtrl.emit('update', devices.toJSON());

      if (count > 5) {
        console.log('Problem with BrowserSync, recalling all devices');
        instances.stopAll().done(function() {
          console.log('Control >> update', devices.toJSON());
          nsCtrl.emit('update', devices.toJSON());
          console.log('Control >> stopall');
          nsCtrl.emit('stopall');
        });
        clear();
      } else if (check) {
        console.log('Not all requested devices in browsersync context');
        console.log('Client >> re-start');
      } else {
        console.log('All requested devices in browsersync context');
        clear();
      }

      function clear() {
        clearInterval(bsInterval);
        bsInterval = undefined;
      }

      nsApp.emit('start', appData);
    }, 5000);
  };

  function removeGhostDevices() {
    var labels = devices.getGhostDevices();
    if (labels.length) {
      console.log("Control <<< removeGhostDevices", labels);
      labels.forEach(function(label) {
        devices.remove(label);
      });
      app.emit('update-devices');
      nsCtrl.emit('remove', labels);
    }
  }

  function updateDevicesToControlPanel() {
    nsCtrl.emit('update', devices.toJSON());
  }

  // Events
  emitter.on('click:externalurl', function(data) {
    start(data);
  });

  emitter.on('client:connected', function() {
    nsCtrl.emit('update', devices.toJSON());
  });

  devices.init({config: config});
  devices.read();
  removeGhostDevices();
  instances.init({
    config: config,
    devices: devices,
    emitter: emitter
  });
  setInterval(function() {
    devices.write();
  }, 10000);
  setInterval(function() {
    updateDevicesToControlPanel();
  }, 10000);
  setInterval(function() {
    removeGhostDevices();
  }, 86400000);
};
