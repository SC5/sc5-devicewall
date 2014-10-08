angular.module('DeviceWall', [
  'ngResource',
  'ngRoute',
  'mm.foundation',
  'ngLodash',
  'btford.socket-io',
  'templates',
  'configuration'
])
.factory('socket', function ($rootScope, $timeout, socketFactory, SOCKET_SERVER, $log, $q) {
    var socket = $q.defer();
    $rootScope.$on('ready',function() {
      $timeout(function() {
        var socketServer = localStorage.getItem('SOCKET_SERVER') || SOCKET_SERVER;
        var newSocket = (function() {
          return socketFactory({
            ioSocket: io.connect(socketServer)
          });
        })();
        socket.resolve(newSocket);
      });
    });
    return socket.promise;

})
.config(function($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'assets/views/main.html',
      controller: 'MainController'
    }).
    otherwise({
      redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
});
