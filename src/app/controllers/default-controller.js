angular.module('DeviceWall')
  .controller('DefaultController', function($scope, $location, $window, $log, User, appConfig) {
    $log.debug("defaultController");

    $scope.onConnectDeviceClick = function() {
      $window.location.href = $window.location.protocol + '//' + $window.location.hostname + ':' + appConfig.port;
    };

    $scope.onControlPanelClick = function() {
      $location.path('/devices');
    };
  });
