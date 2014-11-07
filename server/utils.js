var url = require('url');

module.exports = {
  parseUrl: function(url) {
    url = url.trim();
    if (url.match(/:\/\//)) {
      if (!url.match(/^http[s]*/)) {
        url.replace(/.*:\/\//, 'http://');
      }
    } else {
      url = 'http://' + url;
    }
    return url;
  },
  checkProxyTarget: function (targetUrl, proxyOptions, cb) {
    var chunks  = [];
    var errored = false;
    var options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: url.path,
      rejectUnauthorized: false
    };
    if (proxyOptions.userAgentHeader) {
      options.headers = {
        'User-Agent': proxyOptions.userAgentHeader
      };
    }

    function logError() {
      if (!errored) {
        cb("Proxy address not reachable - is your server running?");
        errored = true;
      }
    }

    var req = require(url.protocol === "https:" ? "https" : "http").get(options,  function (res) {
      if(res.statusCode === 301 || res.statusCode === 302) {
        cb(null, url.parse(res.headers.location));
        return;
      }
      res.on("data", function (data) {
        chunks.push(data);
      });
      res.on("end", function() {
        cb(null, targetUrl);
      });
    }).on("error", function (err) {
      if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
        cb("Unreachable");
      }
    }).on("close", function () {
      if (!chunks.length) {
        cb("Unreachable");
      }
    });

    req.on("socket", function (socket) {
      socket.setTimeout(5000);
      socket.on("timeout", function() {
        req.abort();
      });
    });
  }
};