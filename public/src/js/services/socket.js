'use strict';

var ScopedSocket = function(socket, $rootScope) {
  this.socket = socket;
  this.$rootScope = $rootScope;
  this.listeners = [];
};

ScopedSocket.prototype.removeAllListeners = function(opts) {
  if (!opts) opts = {};
  for (var i = 0; i < this.listeners.length; i++) {
    var details = this.listeners[i];
    if (opts.skipConnect && details.event === 'connect') {
      continue;
    }
    this.socket.removeListener(details.event, details.fn);
  }
  this.listeners = [];
};

ScopedSocket.prototype.on = function(event, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;

  var wrapped_callback = function() {
    var args = arguments;
    $rootScope.$apply(function() {
      callback.apply(socket, args);
    });
  };
  socket.on(event, wrapped_callback);

  this.listeners.push({
    event: event,
    fn: wrapped_callback
  });
};

ScopedSocket.prototype.emit = function(event, data, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;

  socket.emit(event, data, function() {
    var args = arguments;
    $rootScope.$apply(function() {
      if (callback) {
        callback.apply(socket, args);
      }
    });
  });
};

angular.module('insight.socket').factory('getSocket',
  function($rootScope) {
    //var socket = io.connect('ws://explore1.marscoin.local:3005/socket.io', {
    //var socket = io.connect('//explore1.marscoin.local', {
    //var socket = io.connect(null, {
    var socket = io.connect('http://explore1.marscoin.local', {
      'reconnect': true,
      'reconnection delay': 500,
    });
    return function(scope) {
      var scopedSocket = new ScopedSocket(socket, $rootScope);
      scope.$on('$destroy', function() {
        scopedSocket.removeAllListeners();
      });
      socket.on('connect', function() {
        scopedSocket.removeAllListeners({
          skipConnect: true
        });
      });
      socket.on('subscribed', function(data) {
        console.log('Subscribed to ' + data);
      });
      
      socket.on('tx', function(transaction) {
          console.log('New transaction:' + transaction);
      });
      
      socket.on('block', function(block) {
          console.log('New block:' + block);
      });
      return scopedSocket;
    };
  });
