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
    var redirected = false;
    var req = protocol.get(options,  function (res) {
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
      res.once("end", function() {
        if (redirected === false) {
          cb(null, targetUrl);
        }
      });
    }).once("error", function (err) {
      if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
        cb("Unreachable");
      }
    }).once("close", function () {
      if (!redirected && !chunks.length) {
        cb("Unreachable");
      }
    });

    req.once("socket", function (socket) {
      socket.setTimeout(5000);
      socket.on("timeout", function() {
        console.log("timed out");
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
  },
  guessURI: function(uri) {
    if (/:\//g.test(uri) === true) {
      if (/^(http|https):\/\//i.test(uri) === false) {
        return false;
      }
    } else {
      uri = 'http://' + uri;
    }
    return uri;
  },
  updateLastSeen: function(label, devices) {
    var device = devices.find(label);
    if (device) {
      device.set('lastSeen', new Date().getTime());
      devices.update(device.toJSON());
    }
  }
};
