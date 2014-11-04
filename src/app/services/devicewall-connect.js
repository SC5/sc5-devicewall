/* global io */
(function () {
  'use strict';

  angular.module('DeviceWall')
    .factory('socket', function($log, socketFactory) {
      var mySocket = '/devicewall';
      var factory = socketFactory({
        ioSocket: io.connect(mySocket)
      });
      return factory;
      /*
      return {
        on: function(eventName, cb) {
          factory.on(eventName, function(data) {
            $log.debug("Socket on " + eventName, data);
            if (typeof cb === typeof Function) {
              cb.apply(factory, arguments);
            }
          });
        },
        emit: function(eventName) {
          $log.debug("Socket emit " + eventName);
          factory.emit.apply(factory, arguments);
        }
      };
      */
    });

})();
