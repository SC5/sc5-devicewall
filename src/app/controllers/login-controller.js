angular.module('DeviceWall')
  .controller('LoginController', function($scope, $location, $window, $log, User, LOGIN_TYPE) {

    $scope.googleAuth = LOGIN_TYPE === 1;

    // TODO google auth logic
    $scope.loginWithGoogle = function() {
      $location.path('/auth/google');
    };

    $scope.loginWithNick = function(name) {
      $window.localStorage.setItem('name', name);
      $location.path('/devices');
    };
  });
