angular.module('DeviceWall')
  .controller('DefaultController', function($scope, $location, $window, $log, Devices) {
    $log.debug("defaultController");

    function redirectToClient() {
      var portString = $window.location.port !== '' ? ':'+$window.location.port : '';
      $window.location.href = $window.location.protocol + '//' + $window.location.hostname + portString + '/client';
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
