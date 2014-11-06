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

    socket.on('update', function (data) {
      devices.update(data);
      nsCtrl.emit('update', devices.toJSON());
    });

    socket.on('started', function (label) {
      var device = devices.find(label);
      if (device) {
        device.set('status', 'running');
        nsCtrl.emit('update', devices.toJSON());
      }
    });

    socket.on('idling', function (label) {
      var device = devices.find(label);
      if (device) {
        device.set('status', 'idle');
        device.set('updated', +new Date());
        devices.update(device.toJSON());
        app.emit('update-devices');
        nsCtrl.emit('update', devices.toJSON());
      }
    });

    socket.on('disconnect', function () {
      console.log('DeviceWall device disconnected.');
    });

    socket.on('check-platform', function(data, fn) {
      var appPlatform = '';
      var device = devices.find(data.label);
      if (device) {
        appPlatform = device.appPlatform;
      }
      fn({appPlatform: appPlatform});
    });

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

    function start (data) {
      console.log('DeviceWall control panel start.');
      instances.start(data).then(
        function(startData) {
          var appdata = _.clone(data);
          appdata.url = startData.startUrl;

          nsCtrl.emit('update', devices.toJSON());
          nsCtrl.emit('start', data);
          nsApp.emit('start', appdata);
        },
        function(reason) {
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
      console.log('DeviceWall control panel stop all.');
      instances.stopAll().then(function() {
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

  });

  devices.init({
    config: config
  });
  instances.init({
    config: config,
    devices: devices
  });
  setInterval(function() {
    devices.write();
  }, 10000);

};
