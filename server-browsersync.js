var browserSync = require('browser-sync'),
    config = require('./config.json'),
    bs,
    url = require('url'),
    http = require('http'),
    https = require('https'),
    Q = require('q');
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
  if (message.type === 'init') {
    var parsedUrl = url.parse(message.url);
    bs = browserSync.init(null, {
      proxy: message.url,
      startPath: parsedUrl.path,
      idleReturn: {
        idleSeconds: config.clientIdleReturnSeconds,
        returnUrl: config.deviceWallAppURL
      },
      browser: 'disable',
      https: true,
      ghostMode: {
        clicks: true,
        location: true,
        forms: true,
        scroll: true
      }
    });

    bs.events.on('init', function(api) {
      bs.pluginManager.plugins.server.checkProxyTarget({
        target: api.options.proxy.target
      }, function(err, status) {
        if (err) {
          process.send({type: 'targetUrlUnreachable'});
        } else {
          /*var cacheWarmed = deferredCacheWarming(api.options.urls.external);
          cacheWarmed.then(function() {
          process.send({type: 'browserSyncInit', browserSync: api.options.urls.external});
          });
          */
          process.send({type: 'browserSyncInit', browserSync: api.options.urls.external});
        }
      });
    });
  } else if (message.type === 'location') {
    var promises = [];
    bs.io.sockets.sockets.forEach(function(socket) {
      promises.push(deferredEmit(socket, 'location', {url: message.url}, message.timeout || 5000));
    });
    Q.all(promises).fin(function(){
      // all promises finished.
      if (message.completeMessageType) {
        process.send({type: message.completeMessageType});
      }
    });
  } else {
    browserSync.exit();
  }
});
