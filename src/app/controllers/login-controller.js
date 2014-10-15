angular.module('DeviceWall')
  .controller('LoginController', function($scope, $location, $window, $log, User, APP_CONFIG) {

    $scope.googleAuth = APP_CONFIG.LOGIN_TYPE === 1;

    // TODO google auth logic
    $scope.loginWithGoogle = function() {
      $location.path('/auth/google');
    };

    $scope.loginWithNick = function(name) {
      $window.localStorage.setItem('name', name);
      $location.path('/devices');
    };

    $scope.showDeviceView = function() {
      $window.location.href = $window.location.protocol + '//' + $window.location.hostname +  APP_CONFIG.DEVICE_APP_PORT;
    };
  });
