var module = angular.module('DeviceWall', [
  'ngResource',
  'ngRoute',
  'ngLodash',
  'btford.socket-io',
  'configuration'
]);


module.config(function($routeProvider, $locationProvider, $logProvider, appConfig) {
  $routeProvider.
    when('/', {
      templateUrl: 'assets/views/default.html',
      controller: 'DefaultController'
    }).
    when('/login', {
      templateUrl: 'assets/views/login.html',
      controller: 'LoginController'
    }).
    when('/devices', {
      templateUrl: 'assets/views/main.html',
      controller: 'MainController'
    }).
    when('/client', {
      templateUrl: 'assets/views/client.html',
      controller: 'ClientController'
    }).
    when('/info', {
      templateUrl: 'assets/views/info.html',
      controller: 'ClientController'
    }).
    when('/tutorial', {
      templateUrl: 'assets/views/tutorial.html',
      controller: 'ClientController'
    }).
    when('/tutorials/device/:page', {
      templateUrl: 'assets/views/tutorial_device.html',
      controller: 'ClientController'
    }).
    when('/tutorials/test/:page', {
      templateUrl: 'assets/views/tutorial_test.html',
      controller: 'ClientController'
    }).
    otherwise({
      redirectTo: '/'
    });

  $locationProvider.hashPrefix("!");
  $logProvider.debugEnabled(appConfig.debugEnabled);
});
