var config = require('../../config.test.json');
var testHost = config.protocol + '://' + config.host + ':' + config.port;
var io = require('socket.io-client');

module.exports = function (app) {
  app.get('/test', function (req, res) {
    res.set('Content-Type', 'text/html');
    res.send('<html><body><div id="test">OK</div></body></html>');
  });

  app.get('/test/301', function (req, res) {
    res.writeHead(301, {
      'Location': config.protocol + '://' + config.host + ':' + config.port + '/test'
    });
    res.end();
  });

  app.get('/test/302', function (req, res) {
    res.writeHead(302, {
      'Location': config.protocol + '://' + config.host + ':' + config.port + '/test'
    });
    res.end();
  });

  /**
   * Reset environment
   */
  var s = io(testHost + '/devicewall');
  app.get('/test/reset', function (req, res) {
    s.emit('reset');
    s.once('resetted', isDone);
    function isDone() {
      res.send(
        '<html><body><div id="test">OK' +
        '<script type="text/javascript">window.localStorage.clear();</script>' +
        '</div></body></html>'
      );
    }
  });
};
