(function () {
  'use strict';

  angular.module('DeviceWall').directive('toggleAccordion', ['$log', function($log) {
    return function(scope, element) {
      $log.debug('directive ok');
      element.on('click', function() {
        $log.debug('accordion clicked');
        element.parent().toggleClass('collapsed');
      });
    };
  }]);

})();

