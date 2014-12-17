var url   = require('url');
var http  = require('http');
var https = require('https');
var maxRedirects = require('./config.js').maxRedirects;

var redirectionCodes = [301, 302, 303, 304, 305, 307];

var redirectedCount = 0;
module.exports = {
  resetRedirectCounter: function() {
    'use strict';
    redirectedCount = 0;
  },
  checkProxyTarget: function (targetUrl, proxyOptions, cb) {
    'use strict';
    var that = this;
    var chunks  = [];
    var errored = false;
    var protocol = targetUrl.protocol === "https:" ? https : http;
    var options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: targetUrl.path,
      rejectUnauthorized: false
    };
    if (proxyOptions.userAgentHeader) {
      options.headers = {
        'User-Agent': proxyOptions.userAgentHeader
      };
    }

    var req = protocol.get(options,  function (res) {
      var redirected = false;
      if(that._isRedirectionCode(res.statusCode)) {
        if (that._isMaxRedirectionsReached()) {
          console.error('Max amount of redirects reached: ' + maxRedirects);
          cb('Maximum allowed redirects reached, aborting.');
          return;
        }
        targetUrl = that._getNewTargetUrl(targetUrl, url.parse(res.headers.location));
        console.info("Site redirection detected: " + targetUrl.href);
        redirected = true;
        ++redirectedCount;
        that.checkProxyTarget(targetUrl, proxyOptions, cb);
        return;
      }
      res.on("data", function (data) {
        chunks.push(data);
      });
      res.on("end", function() {
        if (redirected === false) {
          cb(null, targetUrl);
        }
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
  },
  _isRedirectionCode: function(code) {
    'use strict';
    return redirectionCodes.indexOf(code) !== -1;
  },
  _isMaxRedirectionsReached: function () {
    'use strict';
    return redirectedCount >= maxRedirects;
  },
  _getNewTargetUrl: function(oldTarget, newTarget) {
    'use strict';
    var targetUrl;
    if (newTarget.host === null) { // if redirected to path instead of full address
      targetUrl = url.parse(oldTarget.protocol + '//' + oldTarget.host + newTarget.path);
    } else {
      targetUrl = url.parse(newTarget.href);
    }
    return targetUrl;
  },
  /*
   * Node url returns 'hostname' + 'port' only if 'host' is missing
   * http://nodejs.org/api/url.html#url_url_format_urlobj
   */
  getURLWithPortString: function(urlString, port) {
    urlString = urlString || '';
    port = port || 80;

    var urlObj = url.parse(urlString);
    urlObj.port = port;
    urlObj.host = undefined;

    return url.format(urlObj);
  }
};
