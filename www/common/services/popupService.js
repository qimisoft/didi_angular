(function() {
    'use strict';

    angular.module('common.popupService', ['ionic']).factory('BpPopup', [
        '$ionicPopup',
        '$ionicLoading',
        '$timeout',
        function($ionicPopup, $ionicLoading, $timeout) {
            console.log("enter in popup");
            var toastTiming = "";
            return {
                alert: function(msg, title) {
                    return $ionicPopup.alert({
                        title: title || '温馨提示',
                        template: msg,
                        okText: '确定'
                    })
                },
                showToast: function(msg) {
                    $ionicLoading.show({
                        noBackdrop: true,
                        hideOnStateChange: true,
                        duration: 2000,
                        template: msg || "Loding"
                    });
                }
            }
        }
    ]);

})();
