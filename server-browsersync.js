var browserSync = require('browser-sync'),
    config = require('./config.json'),
    bs,
    url = require('url');

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
    bs.io.sockets.emit('location', {url: message.url});
  } else {
    browserSync.exit();
  }
});