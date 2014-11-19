var _ = require('lodash'),
    socketio = require('socket.io');

module.exports = function (app, options) {
  'use strict';
  var
    io = socketio(app),
    config = options.config,
    nsApp = io.of('/devicewallapp'),
    nsCtrl = io.of('/devicewall'),
    devices = require('./devices'),
    instances = require('./instances');

  // Device
  nsApp.on('connection', function (socket) {
    console.log('Test device connected!');

    socket.on('rename', rename);
    socket.on('update', update);
    socket.on('started', started);
    socket.on('idling', idling);
    socket.on('disconnect', disconnect);
    socket.on('check-platform', checkPlatform);

    function rename(data) {
      var device = devices.find(data.oldLabel);
      if (device) {
        if (devices.remove(data.oldLabel)) {
          console.log("Removed label " + data.oldLabel);
        } else {
          console.log("Unable to remove label " + data.oldLabel);
        }
        device.set('label', data.newLabel);
        devices.update(device.toJSON());
        nsCtrl.emit('rename', data);
      } else {
        console.log("Device label " + data.oldLabel + " does not exists");
      }
    }

    function update(data) {
      var device;
      if (_.has(data, 'label') === false || data.label === '') {
        console.error("Client sent an empty label", data);
        return
      }
      device = devices.update(data);
      if (device.get('userId')) {
        var instance = instances.find(device.get('userId'));
        if (instance) {
          if (instance.get('status') === 'running') {
            device.set('status', 'starting');
            socket.emit('start', {
              labels: instance.get('labels'),
              url: instance.get('startUrl')
            });
            instance.syncClientLocations();
          }
        }
      }
      nsCtrl.emit('update', devices.toJSON());
    }

    function started(label) {
      var device = devices.find(label);
      if (device) {
        device.set('status', 'running');
        nsCtrl.emit('update', devices.toJSON());
      }
    }

    function idling(label) {
      var device = devices.find(label);
      if (device) {
        device.set('status', 'idle');
        device.set('updated', +new Date());
        devices.update(device.toJSON());
        app.emit('update-devices');
        nsCtrl.emit('update', devices.toJSON());
      }
    }

    function disconnect() {
      console.log('DeviceWall device disconnected.');
    }

    function checkPlatform(data, fn) {
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
    console.log('DeviceWall control panel connected!');
    // Start
    socket.on('start', start);
    socket.on('stop', stop);
    socket.on('stopall', stopAll);
    socket.on('disconnect', disconnect);
    socket.on('list', list);
    socket.on('save', save);
    socket.on('remove', removeDevices);
    socket.on('reload-devices', reloadDevices);

    function start(data) {
      console.log('DeviceWall control panel start.');
      instances.start(data).then(
        function(startData) {
          var appData = _.clone(data);
          appData.url = startData.startUrl;

          console.log('>> socket "update"');
          nsCtrl.emit('update', devices.toJSON());
          console.log('>> socket "start"', data);
          nsCtrl.emit('start', data);
          nsApp.emit('start', appData);
        },
        function(reason) {
          console.log('>> socket "server-stop"', reason);
          nsCtrl.emit('server-stop', {user: data.user, reason: reason});
        }
      );
    }

    function stop(data) {
      console.log('DeviceWall control panel stop.');
      instances.stop(data.user.id).then(function() {
        nsCtrl.emit('update', devices.toJSON());
        nsCtrl.emit('stop', data);
      });
    }

    function stopAll() {
      console.log('DeviceWall control panel stop all instances.length: ', instances.instances.length);
      instances.stopAll().done(function() {
        console.log("Stop all done");
        nsCtrl.emit('update', devices.toJSON());
        nsCtrl.emit('stopall');
      });
    }

    function disconnect () {
      console.log('DeviceWall control panel disconnected.');
    }

    function list(data, fn) {
      devices.sort();
      if (typeof(fn) === typeof(Function)) {
        fn(devices.toJSON());
      } else {
        console.log("not a function: ", fn);
      }
    }

    function save(data) {
      var device = devices.find(data.label);
      if (device) {
        console.log("update device", device.get('label'));
        ['model', 'version', 'platform'].forEach(function(val) {
          if (data[val]) {
            device.set(val, data[val]);
          }
        });
        devices.update(device.toJSON());
      }
      app.emit('update-devices');
      socket.broadcast.emit('update', devices);
    }

    function removeDevices(data) {
      data.labels.forEach(function(label) {
        console.log('remove device ' + label);
        devices.remove(label);
      });
      app.emit('update-devices');
      socket.broadcast.emit('update', devices);
    }

    function reloadDevices() {
      console.info("reloading device list");
      devices.read();
    }

  });

  devices.init({config: config});
  devices.read();
  instances.init({
    config: config,
    devices: devices
  });
  setInterval(function() {
    devices.write();
  }, 10000);

};
