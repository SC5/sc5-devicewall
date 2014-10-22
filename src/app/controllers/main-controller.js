angular.module('DeviceWall')
  .controller('MainController', function($rootScope, $scope, $window, $http, $timeout, Devices, lodash, appConfig, $log, socket) {
    var _ = lodash;
    $log.debug('loading main controller');
    $scope.indicatorWaiting = {show: true};
    $scope.config = appConfig;
    $scope.deviceList = Devices.toArray();
    $scope.$watch('deviceList', function (newVal, oldVal) {
      $log.debug(oldVal);
      $log.debug(newVal);
    }, true);

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
        user: $scope.user
      };

      $window.localStorage.setItem('url', $scope.url.value);
      $scope.tooltipError.show = false;
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
      _.each(Devices.toArray(), function(device) {
        device.selected = status;
        Devices.update(device);
      });
      $scope.deviceList = Devices.toArray();
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
    $scope.watchCallback = function(modelName) {
      $log.debug("watch ", modelName);
    }


    /***************** Create service from socket actions **/
    // TODO move socket stuff from controller to service
    socket.on('connect',  function () {
      $log.debug("Connected");
      $scope.indicatorWaiting = {show: false};
      socket.emit('list', 'list', function(data) {
        $log.debug("socket::list", data);
        _.each(data, function(device) {
          // device selected by default
          device.selected = true;
          device.model = "not known";
          Devices.add(device);
        });
        $scope.deviceList = Devices.toArray();
      });
    });

    socket.on('update', function (data) {
      $log.debug("socket::update");
      $scope.$apply(function() {
        _.each(data, function(device) {
          if (Devices.has(device)) {
            Devices.update(device);
          } else {
            device.selected = true;
            Devices.add(device);
          }
        });
        $scope.deviceList = Devices.toArray();
      });
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
      Devices.remove(device);
      $scope.deviceList = Devices.toArray();
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

    $scope.testijuttu = function(model) {
      $log.debug(model);
    }

  })


  .filter('batteryTitle', function() {
    return function(status) {
      var returnString = 'no battery information available';
      if (status.level) {
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
  .factory('Devices', function(lodash) {
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

  });