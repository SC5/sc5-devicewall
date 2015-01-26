angular.module('DeviceWall').directive('version', function($window, $log, appConfig) {
  return {
    link: function($scope) {
      $scope.version = appConfig.build;
    }
  };
});