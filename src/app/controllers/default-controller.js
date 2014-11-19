angular.module('DeviceWall')
  .controller('DefaultController', function($scope, $location, $window, $log, Devices, socketConnect, appConfig) {
    'use strict';
    if (socketConnect === false) {
      $log.debug("Browser does not support WebSockets");
      $scope.error = "WebSocket is not supported by your device, therefore you can't use Device Wall with this device.";
    }
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
