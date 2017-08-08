/*
 * 我的代金券页
 * @author Cici
 * created on 7/28/2017
 */
(function() {
    'use strict';
    var moduleName = 'coupon';
    var controllerName = moduleName + 'Ctrl';

    function config($stateProvider) {
        $stateProvider
            .state('coupon', {
                cache: false,
                url: '/coupon?:from',
                views: {
                    '@': {
                        templateUrl: 'business/coupon/coupon.tpl.html',
                        controller: controllerName
                    }
                }
            })
    }
    var productNo = User.getProduct();
    angular.module(moduleName, [])
        .config(config)
        .controller(controllerName, [
            "$scope",
            "$rootScope",
            "$state",
            "$stateParams",
            "ShareDataService",
            "BpPopup",
            "DataService",
            function($scope, $rootScope, $state, $stateParams, ShareDataService, BpPopup, DataService) {
                var vm = $scope.vm = {};
                vm.noCoupon = false;
                $scope.$on('$ionicView.beforeEnter', function() {
                    if (ShareDataService.data_vouchers) {
                        vm.couponList = ShareDataService.data_vouchers;
                    } else {
                        getCoupon();
                    }
                })

                function getCoupon() {
                    DataService.run('getVoucherInfo', { timeout: null }, function(data) {
                        console.log('[查询代金券成功]');
                        console.log(data);
                        if (data.success && data.result.vouchers.length != 0) {
                            vm.couponList = data.result.vouchers;
                            ShareDataService.data_vouchers = data.result.vouchers;
                        } else {
                            vm.noCoupon = true;
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false, true);
                }
            }
        ])
        .filter('dateFliter', function() {
            return function(val) {
                var date = new Date(val.substr(0, 4) + '/' + val.substr(4, 2) + '/' + val.substr(6, 2) + ' ' + val.substr(8, 2) + ':' + val.substr(10, 2) + ':' + val.substr(12, 2));
                var fmt = "yyyy-MM-dd";
                var o = {
                    "M+": date.getMonth() + 1, //月份 
                    "d+": date.getDate(), //日 
                    "h+": date.getHours(), //小时 
                    "m+": date.getMinutes(), //分 
                    "s+": date.getSeconds(), //秒 
                    "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
                    "S": date.getMilliseconds() //毫秒 
                };
                if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                for (var k in o)
                    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                return fmt;
            }
        })
})();