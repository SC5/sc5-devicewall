var module = angular.module('DeviceWall', [
  'ngResource',
  'ngRoute',
  'mm.foundation',
  'ngLodash',
  'btford.socket-io',
  'templates',
  'configuration'
]);

module.factory('socket', function ($rootScope, $timeout, socketFactory, appConfig, $log, $q, $window) {
  var socketServerUrl = $window.localStorage.getItem('SOCKET_SERVER') || appConfig.socketServer;
  return socketFactory({
    ioSocket: io.connect(socketServerUrl)
  });
});

module.factory('User', function($resource) {
  var resource = $resource(
    '/user',
    {user: '@user'},
    {
      get: {
        method: 'GET',
        isArray: false,
        cache: false
      }
    }
  );
  return resource;
});

module.config(function($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'assets/views/login.html',
      controller: 'LoginController'
    }).
    when('/devices', {
      templateUrl: 'assets/views/main.html',
      controller: 'MainController'
    }).
    otherwise({
      redirectTo: '/'
    });

    //$locationProvider.html5Mode(true);
    $locationProvider.hashPrefix("!");
});
