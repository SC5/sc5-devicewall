(function () {
  'use strict';

  angular.module('DeviceWall').directive('broadcastActivity', function(){
    return {
      link: function($scope) {
        $scope.sendBroadcast = function() {
          $scope.$broadcast('app-activity');
        };
      }
    };
  });

})();