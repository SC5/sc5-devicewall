var utils = require('../../utils');
var url = require('url');


describe("utils should", function() {
  'use strict';

  it("recognize redirection http code", function() {
    [301, 302, 303, 304, 305, 307].forEach(function(code) {
      expect(utils._isRedirectionCode(code)).toBe(true);
    });
  });

  it("create proper redirection location url", function() {
    var oldUrl = url.parse('http://www.google.com/');
    var newUrl = url.parse('http://www.google.com/testisivu');
    var newTarget = utils._getNewTargetUrl(oldUrl, newUrl);
    expect(newTarget.href).toBe(newUrl.href);

    oldUrl = url.parse('http://www.google.com/');
    newUrl = url.parse('/testisivu');
    newTarget = utils._getNewTargetUrl(oldUrl, newUrl);
    expect(newTarget.href).toBe("http://www.google.com/testisivu");
  });
});
