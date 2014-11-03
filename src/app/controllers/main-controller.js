angular.module('DeviceWall')
  .controller(
    'MainController',
    function($rootScope, $scope, $window, $http, $timeout, DeviceList, lodash, appConfig, $log, socket) {
    var _ = lodash;

    $log.debug('loading main controller');
    $scope.indicatorWaiting = {show: true};
    $scope.config = appConfig;
    $scope.deviceList = DeviceList.toArray();
    $scope.serverStatus = 'stopped';

    if (appConfig.singleUser) {
      $scope.user = {
        id: 'singleuser',
        displayName: 'singleuser'
      };
    } else {
      // this is weird, just weiirrddd, TODO refactor away
      $scope.user = {
        id: $window.localStorage.getItem('name'),
        displayName: $window.localStorage.getItem('name')
      };
    }
    $scope.url = {
      value: '',
      click: function() {
        if (!$scope.url.value || $scope.url.value === '') {
          $scope.url.value = 'http://www.';
        }
      }
    };

    // maybe there is an old url in localstorage already..
    if ($window.localStorage.getItem('url') !== null) {
      $scope.url = $window.localStorage.getItem('url');
    }

    $scope.btnGo =              {show: true};
    $scope.btnStopAllTesting =  {show: false};
    $scope.btnStopTesting =     {show: false};

    $scope.tooltipError = {
      show: false,
      content: ''
    };

    $scope.popupWindow = null;


    $scope.submitUrl = function() {
      $log.debug('Submit url ', $scope.url.value);
      if ($scope.url.value.length <= 4) {
        $scope.tooltipError = {
          show: true,
          content: 'Invalid url'
        };
        return;
      }

      var formData = {
        url: $scope.url.value,
        labels: _.pluck(_.where($scope.deviceList, { selected: true }), 'label'),
        user: $scope.user
      };

      $window.localStorage.setItem('url', $scope.url.value);
      $scope.tooltipError.show = false;
      $scope.tooltipError.content = '';
      socket.emit('start', formData);
      $scope.setButtonsStatus(false);
    };

    $scope.selectAll = function(status) {
      _.each(DeviceList.toArray(), function(device) {
        device.selected = status;
        DeviceList.update(device);
      });
      $scope.deviceList = DeviceList.toArray();
    };

    $scope.updateDeviceList = function() {
      $log.debug('update devices');
      $log.debug($scope.deviceList);
      /*
      _.each(Devices.toArray(), function(device) {
        socket.emit('update', device);
      });
      */
    };
    $scope.clientFieldChanged = function(model) {
      socket.emit('save', model);
    };

    $scope.stopTesting = function() {
      $log.debug('stop testing');
      function getUserDevices() {
        var userDevices = [];
        _.each($scope.deviceList, function(device) {
          if (device.userId === $scope.user.id) {
            userDevices.push(device.uuid);
          }
        });
        return userDevices;
      }
      socket.emit('stop', {user: $scope.user, labels: getUserDevices()});
      $scope.btnStopTesting.show = false;
    };

    $scope.stopAllTesting = function() {
      $log.debug('stop All testing');
      socket.emit('stopall');
    };

    $scope.removeDevice = function(device) {
      socket.emit('remove', {labels: [device.label]});
      DeviceList.remove(device);
      $scope.deviceList = DeviceList.toArray();
    };


    // Socket actions
    socket.on('connect',  function () {
      $scope.indicatorWaiting = {show: false};
      socket.emit('list', 'list', function(data) {
        $log.debug("socket::list", data);
        var instancesRunning = false;
        _.each(data, function(device) {
          // device selected by default
          device.selected = true;
          if (device.userId) {
            instancesRunning = true;
          }
          DeviceList.add(device);
        });
        $scope.deviceList = DeviceList.toArray();
        if (instancesRunning) {
          $scope.setButtonsStatus(false);
        }
      });
    });

    socket.on('update', function (data) {
      $scope.$apply(function() {
        _.each(data, function(device) {
          if (DeviceList.has(device)) {
            DeviceList.update(device);
          } else {
            device.selected = true;
            DeviceList.add(device);
          }
        });
        $scope.deviceList = DeviceList.toArray();
      });
    });

    socket.on('start', function (data) {
      if (data.user.id === $scope.user.id) {
        $scope.setButtonsStatus(false);
        $scope.serverStatus = 'running';
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
        $scope.serverStatus = 'stopped';
        $scope.setButtonsStatus(true);
      }
      if (data.reason) {
        $log.debug('some err', data.reason);
        $scope.tooltipError.content = data.reason;
        $scope.tooltipError.show = true;
      }
    });

    socket.on('stopall', function() {
      $log.debug('socket::stopall');
      $scope.serverStatus = 'stopped';
      $scope.setButtonsStatus(true);
    });


    // simple helper for buttons
    $scope.setButtonsStatus = function(status) {
      $scope.btnStopAllTesting.show = !status;
      $scope.btnStopTesting.show = !status;
      $scope.btnGo.show = true;
    };

    $scope.checkGoButtonStatus = function(oldVal, newVal, scope) {
      var disableGoButton = true;
      _.each(scope.deviceList, function(device) {
        if (device.selected) {
          disableGoButton = false;
        }
      });
      if (disableGoButton && scope.openUrl) {
        disableGoButton = false;
      }
      $scope.btnGo.disabled = disableGoButton;
    };

    $scope.showDeviceView = function() {
      $window.location.href = $window.location.protocol + '//' + $window.location.hostname + ':' +  appConfig.port;
    };

    $scope.toggleAccordion = function($event){
      var $el = $($event.target);
      $el.parent().toggleClass('collapsed');
    };

    $scope.$watch('deviceList', $scope.checkGoButtonStatus, true);
    $scope.$watch('openUrl', $scope.checkGoButtonStatus);
  });

