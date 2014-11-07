var config = require('../../config.test.json');
module.exports = function (app) {
  app.get('/test', function (req, res) {
    res.set('Content-Type', 'text/html');
    res.send('<html><body><div id="test">OK</div></body></html>');
  });

  app.get('/test/301', function (req, res) {
    res.writeHead(301, {
      'Location': 'http://' + config.host + ':' + config.port + '/test'
    });
    res.end();
  });

  app.get('/test/302', function (req, res) {
    res.writeHead(302, {
      'Location': 'http://' + config.host + ':' + config.port + '/test'
    });
    res.end();
  });
};
