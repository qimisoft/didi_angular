(function() {
    'use strict';
    //定义模块名
    var moduleName = 'orderCancel';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('orderCancel', {
                cache: false,
                url: '/orderCancel',
                views: {
                    '@': {
                        templateUrl: 'business/orderCancel/orderCancel.tpl.html',
                        controller: controllerName
                    }
                }
            })
    }
    var productNo = User.getProduct();
    // var productNo = "13411111111";
    angular.module(moduleName, [])
        .config(config)
        .controller(controllerName, [
            "$scope",
            "$rootScope",
            "$state",
            "$location",
            "$ionicHistory",
            "orderCancelService",
            "ShareDataService",
            "aMapService",
            "BpPopup",
            function($scope, $rootScope, $state, $location, $ionicHistory, orderCancelService, ShareDataService, aMapService, BpPopup) {
                var vm = $scope.vm = {};
               
            }
        ])
})();
