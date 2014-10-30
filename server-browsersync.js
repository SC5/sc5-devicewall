var browserSync = require('browser-sync'),
    evt = browserSync.emitter,
    config = require('./config.json'),
    bs,
    url = require('url'),
    http = require('http'),
    https = require('https'),
    Q = require('q'),
    path = require('path');
    //phantom = require('phantom');

https.globalAgent.maxSockets = config.maxSockets || 5;
http.globalAgent.maxSockets = config.maxSockets || 5;

function deferredEmit(socket, event, data, timeout) {
  var deferred = Q.defer();
  var t1;
  if (timeout) {
    t1 = setTimeout(function(){
      deferred.reject();
    }, timeout);
  }
  socket.emit(event, data, function(confirmation){
    if (t1) {
      clearTimeout(t1);
    }
    deferred.resolve();
  });
  return deferred.promise;
}

/*
function deferredCacheWarming(url) {
  var deferred = Q.defer(),
      timeoutHandle;
  // Hardcoded timeout to resolve (in case phantomjs crashes etc.)
  setTimeout(function() {
    deferred.resolve();
  }, 10000);
  phantom.create(function(ph) {
    ph.createPage(function (page) {
      // If we don't get new responses in 1000ms, let's resolve
      page.set('onResourceReceived', function(requestData) {
        if (requestData.url.substring(0, url.length) === url) {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
          timeoutHandle = setTimeout(function() {
            deferred.resolve();
          }, 1000);
        }
      });
      // Hardcoded timeout to resolve (in case the page takes too long to load)
      page.open(url, function(status) {
        if(timeoutHandle) {
          setTimeout(function() {
            deferred.resolve();
          }, 3000);
        }
      });
    });
  });
  return deferred.promise;
}
*/

process.on('message', function(message) {
  switch (message.type) {
    case 'init':
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
          userAgentHeader: false,
          ghostMode: {
            clicks: true,
            location: true,
            forms: true,
            scroll: true
          },
          syncLocation: true
        };
        if (config.proxyHost) {
          browserSyncConfig.host = config.proxyHost;
        }
        bs = browserSync.init(null, browserSyncConfig);
        evt.on('init', function(api) {
          process.send({type: 'browserSyncInit', browserSync: api.options.urls.external});
        });
      break;
    case 'location':
        var promisesLoc = [];
        bs.io.sockets.sockets.forEach(function(socket) {
          promisesLoc.push(deferredEmit(socket, 'location', {url: message.url}, message.timeout || 5000));
        });
        Q.all(promisesLoc).fin(function(){
          // all promises finished.
          if (message.completeMessageType) {
            process.send({type: message.completeMessageType});
          }
        });
      break;
   case 'syncLocations':
        var foundLocationToSync = false;

        function checkClientCurrentLocation(data) {
          if (!foundLocationToSync && data.url !== bs.options.startPath) {
            foundLocationToSync = true;
            var promisesSync = [];
            setTimeout(function() {
              bs.io.sockets.sockets.forEach(function(socket) {
                promisesSync.push(deferredEmit(socket, 'sync-location', {url: data.url}, message.timeout || 5000));
              });
              Q.all(promisesSync).fin(function(data){
                //console.log('SYNC LOCATION FINISHED');
              });
            }, 3000);
          }
        }

        var promisesGetSync = [];
        bs.io.sockets.sockets.forEach(function(socket) {
          socket.on('current-location', checkClientCurrentLocation);
          promisesGetSync.push(deferredEmit(socket, 'get-location', {}, message.timeout || 5000));
        });
        Q.all(promisesGetSync).fin(function(data){
          //console.log('GET LOCATION FINISHED');
        });
      break;
    default:
      browserSync.exit();
  }
});
