(function () {
  'use strict';

  var module = angular.module('DeviceWall');

  /**
   * Creates scope.clientFieldChanged callback.
   * It is used to watch device information modifications.
   */
  module.directive('blurevent', [function() {
    return {
      restrict: 'A', // only activate on element attribute
      link: function(scope, element) {
        element.on('blur', function() {
          scope.clientFieldChanged(scope.device);
        });
      }
    };
  }]);

})();
