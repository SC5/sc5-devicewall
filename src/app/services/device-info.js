(function () {
  'use strict';

  angular.module('DeviceWall').factory('DeviceInfo', function($window, $log) {
    return {
      getPlatformInfo: function(userAgent) {
        var agent = userAgent ? userAgent : $window.navigator.userAgent;
        var matches;
        
        if (/(iPhone|iPad)/.test(agent)) {
          matches = /(iPhone|iPad);.*OS (\d_\d)/.exec(agent);
          $log.debug('iOS matches', matches);
          return {platform: "iOS", version: getVersion(matches).replace('_', '.')};
        }

        if (/Windows Phone/.test(agent)) {
          matches = /Windows Phone (OS )?(\d.\d);/.exec(agent);
          $log.debug('Windows phone matches', matches);
          return {platform: "Windows Phone", version: getVersion(matches)};
        }

        if (/Android/.test(agent)) {
          var re = /Android (\d+(?:\.\d+)+);/;
          matches = re.exec(agent);
          $log.debug('Android', matches);
          return {platform: "Android", version: getVersion(matches)};
        }

        return false;
      }
    };
    function getVersion(matches) {
      return matches[matches.length-1]?matches[matches.length-1]:'';
    }
  });

})();