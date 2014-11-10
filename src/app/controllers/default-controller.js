angular.module('DeviceWall')
  .controller('DefaultController', function($scope, $location, $window, $log, Devices, appConfig) {
    $log.debug("defaultController");

    function redirectToClient() {
      $location.path('/client');
    }

    if ($window.localStorage.getItem('label') !== null) {
      Devices.get({deviceLabel: $window.localStorage.getItem('label')})
        .$promise.then(redirectToClient);
    }

    $scope.onConnectDeviceClick = redirectToClient;
    $scope.onControlPanelClick = function() {
      if (appConfig.singleUser) {
        $location.path('/devices');
      } else {
        $location.path('/login');
      }
    };
  });
