var _ = require('lodash');
var socketio = require('socket.io');
var devices = require('./devices');
var Instances = require('./instances');

// Defined on Socket.init()
var io, nsApp, nsCtrl, config, instances;

var Socket = {

  init: function(app, options) {
    'use strict';
    var that = this;

    io = socketio(app);
    nsApp = io.of('/devicewallapp');
    nsCtrl = io.of('/devicewall');
    config = options.config;

    // Device
    nsApp.on('connection', function (socket) {
      console.log('Test device connected!');
      socket.on('rename', that.appRename);
      socket.on('update', that.appUpdate.bind(that, socket));
      socket.on('started', that.appStarted);
      socket.on('idling', that.appIdling);
      socket.on('disconnect', that.appDisconnect);
      socket.on('check-platform', that.appCheckPlatform);
    });

    // Control panel
    nsCtrl.on('connection', function (socket) {
      console.log('Control <<<< connection');
      socket.on('start', that.ctrlStart);
      socket.on('stop', that.ctrlStop);
      socket.on('stopall', that.ctrlStopAll);
      socket.on('disconnect', that.ctrlDisconnect);
      socket.on('list', that.ctrlList);
      socket.on('save', that.ctrlSave);
      socket.on('remove', that.ctrlRemoveDevices);
      socket.on('reload-devices', that.ctrlReloadDevices);
      if (process.env.NODE_ENV === "test") {
        socket.on('reset', that.ctrlResetAppData.bind(that, socket));
      }
    });

    devices.init({
      config: config
    });
    devices.read();

    instances = new Instances({
      config: config,
      devices: devices
    });

    setInterval(function() {
      devices.write();
    }, 10000);

    that.initEventHandlers();
  },

  initEventHandlers: function() {
    var that = this;

    instances.on('click:externalurl', function(options) {
      if (!options || !options.href || !options.properties) {
        return;
      }
      var prop = options.properties;
      var data = {
        url: options.href,
        labels: prop.labels,
        user: prop.user,
        userAgentHeader: prop.userAgentHeader
      };
      that.ctrlStart(data);
    });
  },

  appRename: function(data) {
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
  },

  appUpdate: function(socket, data) {
    console.log("Client <<< update", data);
    var device;
    if (_.has(data, 'label') === false || data.label === '') {
      console.error("Client sent an empty label", data);
      return;
    }
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
  },

  appStarted: function(options) {
    console.log("Client <<< started: ", options.label, options.socketId);
    var device = devices.find(options.label);
    if (device) {
      device.set('status', 'running');
      device.set('devicewall', options.socketId);
      nsCtrl.emit('update', devices.toJSON());
    }
  },

  appIdling: function(label) {
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
  },

  appDisconnect: function() {
    console.log("Client <<< disconnect");
  },

  appCheckPlatform: function(data, fn) {
    console.log("Client <<< check-platform", data);
    var appPlatform = '';
    var device = devices.find(data.label);
    if (device) {
      appPlatform = device.appPlatform;
    }
    fn({appPlatform: appPlatform});
  },

  ctrlStart: function(data) {
    console.log("Control <<< start", data);
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

        console.log('Control >> start"', data);
        nsCtrl.emit('start', data);
        console.log('Client >> start"', appData);
        nsApp.emit('start', appData);
      },
      function(reason) {
        var emitData = {user: data.user, reason: reason};
        console.log('Control >> server-stop', emitData);
        nsCtrl.emit('server-stop', emitData);
      }
    );
  },

  ctrlStop: function(data) {
    console.log("Control <<< stop", data);
    instances.stop(data.url).then(function() {
      console.log('Control >> update', devices.toJSON());
      nsCtrl.emit('update', devices.toJSON());
      console.log('Control >> stop', data);
      nsCtrl.emit('stop', data);
    });
  },

  ctrlStopAll: function() {
    console.log("Control <<< stopAll");
    instances.stopAll().done(function() {
      console.log('Control >> update', devices.toJSON());
      nsCtrl.emit('update', devices.toJSON());
      console.log('Control >> stopall');
      nsCtrl.emit('stopall');
    });
  },

  ctrlDisconnect: function() {
    console.log("Control <<< disconnect");
  },

  ctrlList: function(data, fn) {
    console.log("Control <<< list");
    devices.sort();
    if (typeof(fn) === typeof(Function)) {
      fn(devices.toJSON());
    } else {
      console.log("not a function: ", fn);
    }
  },

  ctrlSave: function(data) {
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
    socket.broadcast.emit('update', devices);
  },

  ctrlRemoveDevices: function(data) {
    console.log("Control <<< remove", data);
    data.labels.forEach(function(label) {
      devices.remove(label);
    });
    app.emit('update-devices');
    socket.broadcast.emit('update', devices);
  },

  ctrlReloadDevices: function() {
    console.log("Control <<< reload-devices");
    devices.read();
  },

  // only used with e2e tests
  ctrlResetAppData: function() {
    console.info("Control <<< reset");
    instances.forceStopAll();
    //instances.stopAll().then(function() {
    console.info(">>> resetted");
    socket.emit("resetted");
    //});
    devices.removeAll();
  }
};

module.exports = Socket;
