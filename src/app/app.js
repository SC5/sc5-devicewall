var module = angular.module('DeviceWall', [
  'ngResource',
  'ngRoute',
  'ngLodash',
  'btford.socket-io',
  'configuration',
  'angucomplete-alt'
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
      controller: 'InfoController'
    }).
    when('/tutorial', {
      templateUrl: 'assets/views/tutorial/tutorial.html',
      controller: 'TutorialController'
    }).
    otherwise({
      redirectTo: '/'
    });

  $locationProvider.html5Mode(true).hashPrefix('!');
  $logProvider.debugEnabled(appConfig.debugEnabled);
});
