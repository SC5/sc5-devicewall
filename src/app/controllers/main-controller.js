angular.module('DeviceWall')
  .controller('MainController', function($rootScope, $scope, $window, $http, $timeout, $sce, DeviceList, lodash, appConfig, $log, socket) {
    var _ = lodash;
    $log.debug('loading main controller');
    $scope.indicatorWaiting = {show: true};
    $scope.config = appConfig;
    $scope.deviceList = DeviceList.toArray();
    $scope.serverStatus = 'stopped';

    // TODO move these somewhere
    $scope.userAgent = {selected: {}};
    $scope.userAgents = [
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0_2 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A405 Safari/600.1.4"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0"},
      {name: "Mozilla/5.0 (Windows NT 6.1; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"},
      {name: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.78.2 (KHTML, like Gecko) Version/7.0.6 Safari/537.78.2"},
      {name: "Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53"},
      {name: "Mozilla/5.0 (iPad; CPU OS 8_0_2 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A405 Safari/600.1.4"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.78.2 (KHTML, like Gecko) Version/7.0.6 Safari/537.78.2"},
      {name: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0"},
      {name: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko"},
      {name: "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)"},
      {name: "Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B411 Safari/600.1.4"},
      {name: "Mozilla/5.0 (Windows NT 5.1; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/600.1.25 (KHTML, like Gecko) QuickLook/5.0"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36"},
      {name: "Mozilla/5.0 (iPad; CPU OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:33.0) Gecko/20100101 Firefox/33.0"},
      {name: "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"},
      {name: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:33.0) Gecko/20100101 Firefox/33.0"},
      {name: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/37.0.2062.120 Chrome/37.0.2062.120 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.10 (KHTML, like Gecko) Version/5.1.9 Safari/534.59.10"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.77.4 (KHTML, like Gecko) Version/7.0.5 Safari/537.77.4"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0"},
      {name: "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)"},
      {name: "Mozilla/5.0 (X11; Linux x86_64; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0"},
      {name: "Mozilla/5.0 (Windows NT 6.1; rv:33.0) Gecko/20100101 Firefox/33.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.78.2 (KHTML, like Gecko) Version/6.1.6 Safari/537.78.2"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/6.2 Safari/537.85.10"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)"},
      {name: "Mozilla/5.0 (X11; Linux x86_64; rv:31.0) Gecko/20100101 Firefox/31.0"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.2; WOW64; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4"},
      {name: "Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_1 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D201 Safari/9537.53"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"},
      {name: "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A365 Safari/600.1.4"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.143 Safari/537.36"},
      {name: "Mozilla/5.0 (X11; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0"},
      {name: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:30.0) Gecko/20100101 Firefox/30.0"},
      {name: "Mozilla/5.0 (Windows NT 6.0; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"},
      {name: "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:32.0) Gecko/20100101 Firefox/32.0"},
      {name: "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"},
      {name: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0"}
    ];
    // selected device uuid list? TODO refactor whole selected devices list feature, this is not nice, really.
    $scope.uuids = {};

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
    $scope.url = '';
    // maybe there is an old url in localstorage already..
    if ($window.localStorage.getItem('url') !== null) {
      $scope.url = $window.localStorage.getItem('url');
    }

    $scope.btnGo =              {show: true};
    $scope.btnStopAllTesting =  {show: false};
    $scope.btnStopTesting =     {show: false};

    // TODO maybe better error notification
    $scope.tooltipError = {
      show: false,
      content: ''
    };

    $scope.popupWindow = null;

    // TODO maybe https://docs.angularjs.org/api/ng/service/$filter
    $scope.getDeviceDisabled = function(userId) {
      return userId ? true : false;
    };

    $scope.submitUrl = function() {
      $log.debug('Submit url ', $scope.url.value);
      if ($scope.url.value.length <= 4) {
        $scope.tooltipError = {
          show: true,
          content: 'Invalid url'
        };
        return;
      }
      var uuids = [];
      _.each($scope.uuids, function(val, key) {
        if(val) {
          uuids.push(key);
        }
      });

      var formData = {
        url: $scope.url.value,
        labels: _.pluck(_.where($scope.deviceList, { selected: true }), 'label'),
        user: $scope.user,
        userAgentHeader: $scope.userAgent.selected.name ? $scope.userAgent.selected.name : false
      };

      $window.localStorage.setItem('url', $scope.url.value);
      $scope.tooltipError.show = false;
      $scope.tooltipError.content = '';
      socket.emit('start', formData);
      setButtonsStatus(false);
    };

    $scope.url = {
      value: '',
      click: function() {
        if (!$scope.url.value || $scope.url.value === '') {
          $scope.url.value = 'http://www.';
        }
      }
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


    /***************** Create service from socket actions **/
    // TODO move socket stuff from controller to service
    socket.on('connect',  function () {
      $log.debug("Connected");
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
          setButtonsStatus(false);
        }
      });
    });

    socket.on('update', function (data) {
      $log.debug("socket::update");
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
      $log.debug("socket::start", data);
      if (data.user.id === $scope.user.id) {
        setButtonsStatus(false);
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
        setButtonsStatus(true);
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
      setButtonsStatus(true);
    });


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

    // simple helper for buttons
    function setButtonsStatus(status) {
      $scope.btnStopAllTesting.show = !status;
      $scope.btnStopTesting.show = !status;
      $scope.btnGo.show = true;
    }

    $scope.showDeviceView = function() {
      $window.location.href = $window.location.protocol + '//' + $window.location.hostname + ':' +  appConfig.port;
    };

    $scope.toggleAccordion = function($event){
      var $el = $($event.target);
      $el.parent().toggleClass('collapsed');
    };

    $scope.$watch('deviceList', checkGoButtonStatus, true);
    $scope.$watch('openUrl', checkGoButtonStatus);

    function checkGoButtonStatus(oldVal, newVal, scope) {
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
    }
  })


  .filter('batteryTitle', function() {
    return function(status) {
      var returnString = 'no battery information available';
      if (status && status.level) {
        returnString = 'Level: ' + status.level + ' %' + (status.isPlugged ? ', plugged' : '');
      }
      return returnString;
    };
  }).filter('batteryStyle', function() {
      return function(status) {
        if (status && status.level) {
          var position = (status.level * 0.8 + 10) + '%';
          var stop1 = (status.isPlugged ? '#0f0' : '#fff') + ' ' + position;
          var stop2 = (status.isPlugged ? '#0c0' : '#ccc') + ' ' + position;
          return 'background-image: -webkit-linear-gradient(left, ' + stop1 + ', ' + stop2 + ');';
        }
        return '';
      };


  })
  .factory('DeviceList', function(lodash) {
    var _ = lodash;
    return {
      deviceList: {},
      add: function(device) {
        if (_.has(this.deviceList, device.label)) {
          this.update(device);
        } else {
          this.deviceList[device.label] = device;
        }
      },
      update: function(device) {
        if (_.has(this.deviceList, device.label)) {
          this.deviceList[device.label] = angular.extend(this.deviceList[device.label], device);
        }
      },
      remove: function(device) {
        if (_.has(this.deviceList, device.label)) {
          delete this.deviceList[device.label];
        }
      },
      has: function(device) {
        return _.has(this.deviceList, device.label);
      },
      toArray: function() {
        var keys = Object.keys(this.deviceList);
        var deviceList = this.deviceList;
        return _.map(keys, function(key) {
          return deviceList[key];
        });
      }
    };

  }) // catch
    .directive('blurevent', [function() {
      return {
        restrict: 'A', // only activate on element attribute
        link: function(scope, element) {
          element.on('blur', function() {
            scope.clientFieldChanged(scope.device);
          });
        }
      };
    }])
  .filter('unsafe', function($sce) {
      return function(val) {
          return $sce.trustAsHtml(val);
      };
  });