var browserSync = require('browser-sync'),
    evt = browserSync.emitter,
    config = require('../config.json'),
    bs,
    url = require('url'),
    http = require('http'),
    https = require('https'),
    Q = require('q'),
    path = require('path');

https.globalAgent.maxSockets = config.maxSockets || 5;
http.globalAgent.maxSockets = config.maxSockets || 5;

function deferredEmit(socket, event, data, timeout) {
  'use strict';
  var deferred = Q.defer();
  var t1;
  if (timeout) {
    t1 = setTimeout(function(){
      deferred.reject();
    }, timeout);
  }
  socket.emit(event, data, function() {
    if (t1) {
      clearTimeout(t1);
    }
    deferred.resolve();
  });
  return deferred.promise;
};

process.on('message', function(message) {
  'use strict';
  switch (message.type) {
    case 'init':
      console.log("browserSync process: initializing");
      var parsedUrl = url.parse(message.url);
      var browserSyncConfig = {
        proxy: parsedUrl.href,
        startPath: parsedUrl.path,
        idleReturn: {
          idleSeconds: config.clientIdleReturnSeconds,
          returnUrl: config.deviceWallAppURL
        },
        browser: 'disable',
        https: parsedUrl.protocol === "https:",
        ssl: {
          key: path.resolve(config.sslKey),
          cert: path.resolve(config.sslCert)
        },
        userAgentHeader: message.userAgentHeader,
        ghostMode: {
          clicks: true,
          location: true,
          forms: true,
          scroll: true
        },
        syncLocation: true,
        onBeforeUnload: true
      };
      if (config.proxyHost) {
        browserSyncConfig.host = config.proxyHost;
      }
      evt.on('client:connected', function(client) {
        var referer = url.parse(client.referer);
        var rooms = [];
        Object.keys(client.rooms).forEach(function(room) {
          rooms.push(room);
        });
        if (referer.query && referer.query.indexOf('devicewall=') > -1) {
          // First connection, save the devicewall websocket id
          var devicewall = referer.query.substring(referer.query.lastIndexOf('=') + 1);
          process.send({
            type: 'browserSyncSocketId',
            browsersync: rooms,
            devicewall: devicewall
          });
        } else {
          // Clicking links on the UI, save the browsersync socket ids
          process.send({
            type: 'browserSyncSocketRoomsUpdate',
            browsersync: rooms
          });
        }
      });
      evt.on('init', function(api) {
        console.log("browserSync process: initialized");
        process.send({type: 'browserSyncInit', browserSync: api.options.urls.external});
      });
      bs = browserSync.init(null, browserSyncConfig);
      break;
    case 'location':
      var promisesLoc = [];
      console.info("BrowserSync clients: ", bs.io.sockets.sockets.length);
      bs.io.sockets.sockets.forEach(function(socket) {
        console.log(">>> location: ", message.url);
        promisesLoc.push(deferredEmit(socket, 'location', {url: message.url}, message.timeout || 5000));
      });
      Q.all(promisesLoc).fin(function(){
        // all promises finished.
        if (message.completeMessageType) {
          if (message.completeMessageType === 'browserSyncExit') {
            browserSync.exit();
          } else {
            process.send({type: message.completeMessageType});
          }
        }
      });
      break;
    case 'returnDeviceHome':
      var promises = [];
      bs.io.sockets.sockets.forEach(function(socket) {
        if (message.device.browsersync.indexOf(socket.id) > -1) {
          promises.push(deferredEmit(socket, 'location', {url: bs.options.idleReturn.returnUrl }, 5000));
        }
      });
      Q.all(promises).fin(function() {
        process.send({
          type: 'browserSyncReturnedDeviceHome',
          device: message.device
        });
      });
      break;
    case 'syncLocations':
      var foundLocationToSync = false;
      var promisesGetSync = [];
      bs.io.sockets.sockets.forEach(function(socket) {
        socket.on('current-location', function (data) {
          if (!foundLocationToSync && data.url !== bs.options.startPath) {
            foundLocationToSync = true;
            var promisesSync = [];
            setTimeout(function() {
              bs.io.sockets.sockets.forEach(function(socket) {
                promisesSync.push(deferredEmit(socket, 'sync-location', {url: data.url}, message.timeout || 5000));
              });
              Q.all(promisesSync).fin(function() {
                //console.log('SYNC LOCATION FINISHED');
              });
            });
          }
        });
        promisesGetSync.push(deferredEmit(socket, 'get-location', {}, message.timeout || 5000));
      });
      Q.all(promisesGetSync).fin(function() {
        //console.log('GET LOCATION FINISHED');
      });
      break;
    default:
      console.log('BrowserSync exited');
      browserSync.exit();
  }
});
