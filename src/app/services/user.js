(function () {
  'use strict';

  angular.module('DeviceWall').factory('User', function($resource) {
    var resource = $resource(
      '/user',
      {user: '@user'},
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