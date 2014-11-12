var url   = require('url');
var http  = require('http');
var https = require('https');
var maxRedirects = require('./../config.json').maxRedirects;

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
      // got redirect, check location target,
      // TODO check circular redirection
      if(res.statusCode === 301 || res.statusCode === 302) {
        if (redirectedCount >= maxRedirects) {
          console.error('Max amount of redirects reached: ' + maxRedirects);
          cb('Maximum allowed redirects reached, aborting.');
          return;
        }
        var locationUrlObj = url.parse(res.headers.location);
        if (locationUrlObj.host === null) { // if redirected to path instead of full address
          targetUrl = url.parse(targetUrl.protocol + '//' + targetUrl.host + locationUrlObj.path);
        } else {
          targetUrl = url.parse(locationUrlObj.href);
        }
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
  }
};