angular.module('DeviceWall')
  .controller(
    'MainController',
    function($rootScope, $scope, $window, $http, $timeout, DeviceList, lodash, appConfig, $log, socket) {
      'use strict';
      var _ = lodash;

      $log.debug('loading main controller');
      $scope.indicatorWaiting = {show: true};
      $scope.config = appConfig;
      $scope.deviceList = DeviceList.toArray();
      $scope.serverStatus = 'stopped';

      // TODO move these somewhere
      $scope.userAgent = {selected: {}};
      $scope.userAgents = [
        {},
        {name: 'desktop (OS X)', value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
        {name: 'desktop (Windows)', value: "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)"},
        {name: 'mobile (Android)', value: "Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.36 (KHTML, like Gecko) Chrome/40.0.2194.2 Mobile Safari/535.36"},
        {name: 'mobile (iOS)', value: "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53"},
        {name: 'mobile (Lumia 900)', value: "Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0; NOKIA; Lumia 900)"},
        {name: 'mobile (Lumia 920)', value: "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)"},
        {name: 'tablet (Android)', value: "Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus 7 Build/IMM76B) AppleWebKit/535.36 (KHTML, like Gecko) Chrome/40.0.2194.2 Safari/535.36"},
        {name: 'tablet 10 inch', value: "Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus 10 Build/IMM76B) AppleWebKit/535.36 (KHTML, like Gecko) Chrome/40.0.2194.2 Safari/535.36"},
        {name: 'tablet (iPad)', value: "Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10"},
      ];
      // selected device uuid list? TODO refactor whole selected devices list feature, this is not nice, really.
      $scope.uuids = {};

      if (appConfig.singleUser) {
        $scope.user = {
          id: 'singleuser',
          displayName: 'singleuser'
        };
      } else {
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
        $scope.url.value = $window.localStorage.getItem('url');
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
          user: $scope.user,
          userAgentHeader: $scope.userAgent.selected.name ? $scope.userAgent.selected.value : false
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

      $scope.$watch('deviceList', $scope.checkGoButtonStatus, true);
      $scope.$watch('openUrl', $scope.checkGoButtonStatus);
    });

