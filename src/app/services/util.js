(function () {
  'use strict';

  angular.module('DeviceWall').factory('Util', function(lodash) {
    return {
      addSearchParamaterToURL: function(urlString, param) {
        if (!urlString || !param) {
          return;
        }
        var parser = document.createElement('a');
        parser.href = urlString;
        var token = parser.search === '' ? '?' : '&';
        parser.search += token + param;
        return parser.href;
      }
    }
  });
})();
