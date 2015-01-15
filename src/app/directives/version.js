angular.module('DeviceWall').directive('version', function($window, $log, appConfig) {
  return {
    link: function($scope, element) {
      $scope.version = appConfig.version;
    }
  };
});