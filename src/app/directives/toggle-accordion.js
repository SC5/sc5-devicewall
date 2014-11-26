(function () {
  'use strict';

  angular.module('DeviceWall').directive('toggleAccordion', ['$log', function($log) {
    return function(scope, element) {
      element.on('click', function() {
        element.parent().toggleClass('collapsed');
      });
    };
  }]);

})();

