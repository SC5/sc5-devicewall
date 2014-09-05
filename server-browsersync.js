var browserSync = require('browser-sync'),
    config = require('./config.json'),
    bs;

process.on('message', function(message) {
  if (message.type === 'init') {
    bs = browserSync.init(null, {
      proxy: message.url,
//      host: '192.168.56.101',
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
    bs.io.sockets.emit('location', {url: message.url});
  } else {
    browserSync.exit();
  }
});