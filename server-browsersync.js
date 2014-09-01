var browserSync = require('browser-sync'),
    config = require('./config.json');

 process.on('message', function(message) {
  if (message.type === 'init') {
    var bs = browserSync.init(null, {
      proxy: message.url,
      browser: 'disable',
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
  } else {
    browserSync.exit();
  }
});