/* global io */
(function () {
  'use strict';

  angular.module('DeviceWall')
    .factory('socketConnect', function($log, $window, socketFactory) {
      // If no WebSocket support or device is WP7, force transport to be polling
      var options = ('WebSocket' in $window === false || navigator.userAgent.match(/Windows Phone OS 7\.5/)) ? {transports: ["polling"]} : {};
      return {
        connect: function(path) {
          return socketFactory({
            ioSocket: io.connect(path, options)
          });
        }
      };
    });

})();
