angular.module('DeviceWall')
  .controller('MainController', function($rootScope, $scope, $window, $http, $timeout, lodash, LOGIN_TYPE, $log, socket) {


    var _ = lodash;
    $log.debug('loading main controller');
    $scope.indicatorWaiting = {show: true};
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

    $scope.btnGo =              {show: true};
    $scope.btnStopAllTesting =  {show: false};
    $scope.btnStopTesting =     {show: false};

    $scope.tooltipError = {
      show: false,
      content: ''
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
        $log.debug('Submit url ', $scope.url.value);
        var uuids = [];
        _.each($scope.uuids, function(val, key) {
          if(val) {
            uuids.push(key);
          }
        });
        var formData = {
          url: $scope.url.value,
          labels: $scope.deviceList.map(function(o) { return o.label; }),
          user: $scope.user
        };

        $window.localStorage.setItem('url', $scope.url.value);

        socket.then(function(socket) {
          socket.emit('start', formData);
          setButtonsStatus(false);
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
        $window.localStorage.setItem('name', $scope.name);

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
        $log.debug("Connected");
        $scope.indicatorWaiting = {show: false};
        socket.emit('list', 'list', function(data) {
          $log.debug("socket::list", data);
          $scope.deviceList = data;
        });
      });

      socket.on('update', function (data) {
        $log.debug("socket::update");
        $scope.deviceList = data;
      });

      socket.on('start', function (data) {
        $log.debug("socket::start", data);
        if (data.user.id === $scope.user.id) {
          setButtonsStatus(false);
          if ($scope.openUrl) {
            $log.debug('Opening a popup view');
            if ($scope.popupWindow && !$scope.popupWindow.closed) {
              $scope.popupWindow.location.href = data.url;
              $scope.popupWindow.focus();
            } else {
              $scope.popupWindow = $window.open(data.url, '_blank');
            }
          }
        }
      });

      socket.on('server-stop', function(data) {
        $log.debug('socket::server-stop');
        if (data.user.id === $scope.user.id) {
          //$('#go').prop('disabled', false).html('Go').show();
          setButtonsStatus(true);
        }
        if (data.reason) {
          //$('#tooltip-error').html(data.reason).show();
          $log.debug('some err', data.reason);
          $scope.tooltipError.content = data.reason;
          $scope.tooltipError.show = true;
          //$('#url').addClass('error');
        }
      });

        socket.on('stopall', function() {
        $log.debug('socket::stopall');
        //$('#stop-testing').hide();
        //$('#go').prop('disabled', false).html('Go').show();
        setButtonsStatus(true);
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
      var name = $window.localStorage.getItem('name');
      $scope.identify.show = true;

      if (name) {
        $scope.name = name;
      }
    }

    function login() {
      $scope.login.show = true;
    }

    function initializeUser() {
      $log.debug('initialize user with login type ' + LOGIN_TYPE);
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
    // wtf?
    function select() {
      var url = $window.localStorage.getItem('url');

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


    $scope.stopTesting = function() {
      $log.debug('stop testing');
      socket.then(function(socket) {
        socket.emit('stop', {user: $scope.user, labels: getUserDevices()});
      });
      $scope.btnStopTesting.show = false;
    };

    $scope.stopAllTesting = function() {
      $log.debug('stop All testing');
      if (window.confirm("Do you really want to stop all browsersync instances?")) {
        socket.then(function(socket) {
          socket.emit('stopall');
        });
      }
    };

    $scope.removeDevice = function(device) {
      socket.then(function(socket) {
        socket.emit('remove', {labels: [device.label]});
        $scope.deviceList = _.filter($scope.deviceList, function(d) {
          return d.label === device.label;
        });
      });
    };
    // helper for buttons
    function setButtonsStatus(status) {
      $scope.btnStopAllTesting.show = !status;
      $scope.btnStopTesting.show = !status;
      $scope.btnGo.show = status;
    }

    $rootScope.$broadcast('ready');
    $log.debug('Broadcast ready');
    select();
  });