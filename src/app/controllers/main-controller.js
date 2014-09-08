angular.module('DeviceWall')
  .controller('MainController', function($rootScope, $scope, $window, $http, $timeout, socket, lodash, LOGIN_TYPE) {
    var _ = lodash;
    $scope.user = null;
    $scope.content = {
      className: '',
      show: false
    };
    $scope.container = {
      className: 'centerized',
      show: false
    };
    $scope.devices = {
      show: false
    };
    $scope.stopTesting = {
      show: false,
      click: function() {
        socket.then(function(socket) {
          socket.emit('stop', {
            user: $scope.user,
            uuids: getUserDevices()
          });
        });
        $scope.stopTesting.show = false;
        $scope.go.show = true;
      }
    };
    $scope.go = {
      show: true
    };
    $scope.openURL = {
      checked: true
    };
    $scope.popupWindow = null;
    $scope.deviceList = [];
    $scope.getBatteryStatusTitle = function(level, isPlugged) {
      return level ? 'Level: ' + level + ' %' + (isPlugged ? ', plugged' : '') : '';
    };
    $scope.getBatteryStatusStyle = function(level, isPlugged) {
      var position = (level * 0.8 + 10) + '%',
          stop1 = (isPlugged ? '#0f0' : '#fff') + ' ' + position,
          stop2 = (isPlugged ? '#0c0' : '#ccc') + ' ' + position;
      return 'background-image: -webkit-linear-gradient(left, ' + stop1 + ', ' + stop2 + ');';
    };
    $scope.getDeviceDisabled = function(userId) {
      return userId ? true : false;
    };
    $scope.uuids = {};
    $scope.form = {
      selectSubmit: function() {
        var uuids = [];
        _.each($scope.uuids, function(val, key) {
          if(val) {
            uuids.push(key);
          }
        });
        var formData = {
              url: $scope.url.value,
              uuids: uuids,
              user: $scope.user
            };

        localStorage.setItem('url', $scope.url.value);

        socket.then(function(socket) {
          socket.emit('start', formData);
        });
      }
    };

    $scope.url = {
      value: '',
      click: function() {
        if (!$scope.url.value || $scope.url.value === '') {
          $scope.url.value = 'http://www.';
        }
      }
    };

    $scope.selectAll = {
      click: function() {
        _.each($scope.deviceList, function(val, key) {
          if (!val.userId || val.userId === '') {
            $scope.uuids[val.uuid] = true;
          }
        });
      }
    };

    $scope.selectNone = {
      click: function() {
        _.each($scope.deviceList, function(val, key) {
          $scope.uuids[val.uuid] = false;
        });
      }
    };

    $scope.identify = {
      show: false
    };
    $scope.identifyButton = {
      click: function() {
        $scope.identify.show = false;
        localStorage.setItem('name', $scope.name);

        $scope.user = {
          id: $scope.name,
          displayName: $scope.name
        };

        select();
      }
    };
    $scope.login = {
      show: false
    };
    $scope.loginButton = {
      click: function() {
        $window.location.href = '/auth/google';
      }
    };

    socket.then(function(socket) {
      socket.on('connect',  function () {
        socket.emit('list', 'list', function(data) {
          $scope.deviceList = data;
        });
      });

      socket.on('update', function (data) {
        $scope.deviceList = data;
      });

      socket.on('start', function (data) {
        if (data.user.id === $scope.user.id) {
          $scope.go.show = false;
          $scope.stopTesting.show = true;
          if ($scope.openURL.checked) {
            if ($scope.popupWindow && !$scope.popupWindow.closed) {
              $scope.popupWindow.location.href = data.url;
              $scope.popupWindow.focus();
            } else {
              $scope.popupWindow = window.open(data.url, '_blank');
            }
          }
        }
      });
    });

    angular.element($window).bind('pageshow', function() {
      if ($scope.user) {
        $scope.content.className = 'devices';
        $scope.container.className = '';
        $scope.devices.show = true;
      }
    });

    function getUserDevices() {
      var userDevices = [];

      _.each($scope.deviceList, function(device) {
        if (device.userId === $scope.user.id) {
          userDevices.push(device.uuid);
        }
      });

      return userDevices;
    }

    function identify() {
      var name = localStorage.getItem('name');
      $scope.identify.show = true;

      if (name) {
        $scope.name = name;
      }
    }

    function login() {
      $scope.login.show = true;
    }

    function initializeUser() {
      if (LOGIN_TYPE === 1) {
        $http.get('/user').success(function (res) {
          if (res.user) {
            $scope.user = res.user;
            select();
          } else {
            login();
          }
        }).error(function(res) {
          $timeout(function() {
            login();
          }, 1000);
        });
      } else if (LOGIN_TYPE === 2) {
        identify();
      }
    }

    function select() {
      var url = localStorage.getItem('url');

      if (!$scope.user) {
        initializeUser();
        return;
      }

      $scope.content.className = 'devices';

      $timeout(function () {
        $scope.devices.show = true;
        $scope.container.className = '';
      }, 300);

      if (url) {
        $scope.url.value = url;
      }
    }

    $rootScope.$broadcast('ready');
    select();
  });