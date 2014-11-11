/* global io */
(function () {
  'use strict';

  angular.module('DeviceWall')
    .factory('socketConnect', function($log, socketFactory) {
      return {
        connect: function(path) {
          return socketFactory({
            ioSocket: io.connect(path)
          });
        }
      };
    });

})();
