(function () {
  'use strict';

  angular.module('DeviceWall').factory('Devices', function($resource) {
    var resource = $resource(
      '/api/devices/:deviceLabel',
      {deviceLabel: '@id'},
      {
        get: {
          method: 'GET',
          isArray: false,
          cache: false
        }
      }
    );
    return resource;
  });

})();