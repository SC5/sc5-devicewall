var browserSync = require('browser-sync'),
    config = require('./config.json'),
    bs,
    url = require('url'),
    Q = require('q');

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

process.on('message', function(message) {
  if (message.type === 'init') {
    var parsedUrl = url.parse(message.url);
    bs = browserSync.init(null, {
      proxy: message.url,
      startPath: parsedUrl.path,
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
      process.send({type: 'browserSyncInit', browserSync: api.options.urls.external});
    });
  } else if (message.type === 'location') {
    // bs.io.sockets.emit('location', {url: message.url});
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
