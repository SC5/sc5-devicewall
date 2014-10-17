angular.module('DeviceWall')
  .controller('LoginController', function($scope, $location, $window, $log, User, appConfig) {
    $log.debug("loginController");
    $scope.googleAuth = appConfig.loginType === 1;

    // TODO google auth logic
    $scope.loginWithGoogle = function() {
      $location.path('/auth/google');
    };

    $scope.loginWithNick = function(name) {
      $window.localStorage.setItem('name', name);
      $location.path('/devices');
    };
  });
