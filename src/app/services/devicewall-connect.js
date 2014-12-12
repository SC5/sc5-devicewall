/* global io */
(function () {
  'use strict';

  angular.module('DeviceWall')
    .factory('socketConnect', function($log, $window, socketFactory) {
      if (('WebSocket' in $window) === false) {
        return false;
      }
      return {
        connect: function(path) {
          return socketFactory({
            ioSocket: io.connect(path)
          });
        }
      };
    });

})();
