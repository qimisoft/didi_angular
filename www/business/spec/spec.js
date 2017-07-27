(function() {
    'use strict';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('spec', {
                cache: false,
                url: '/spec',
                views: {
                    '@': {
                        templateUrl: 'business/spec/spec.tpl.html',
                        controller: "specCtrl"
                    }
                }
            })
            .state('specCost',{
                cache : false,
                url : '/specCost?num',
                views : {
                    '@' : {
                        templateUrl :'business/spec/specCost.tpl.html',
                        controller : "specCostCtrl"
                    }
                }
            });
    }
    var productNo = User.getProduct();
    // var productNo = "13411111111";
    angular.module('spec', [])
        .config(config)
        .controller('specCtrl', [
            "$scope",
            "$rootScope",
            "$state",
            "$location",
            "$ionicHistory",
            "specService",
            "ShareDataService",
            "BpPopup",
            "TD",
            function($scope, $rootScope, $state, $location, $ionicHistory, specService, ShareDataService, BpPopup,TD) {
                var vm = $scope.vm = {};
                vm.telPhone = function(tel){
                    console.log(tel);
                    TD.TalkingData.onEventWithLabel("ddcx_0002_0004","滴滴出行_服务页_点击客服电话");
                    Contacts.tel(tel);
                }

                vm.goToSpecCost = function(num){
                    if(num === "0"){
                        TD.TalkingData.onEventWithLabel("ddcx_0002_0001","滴滴出行_服务页_剩余的担保金什么时候退？");
                    }else if(num === "1"){
                        TD.TalkingData.onEventWithLabel("ddcx_0002_0002","滴滴出行_服务页_订单取消为什么没有退款？");
                    }else if(num === "2"){
                        TD.TalkingData.onEventWithLabel("ddcx_0002_0003","滴滴出行_服务页_怎么开发票？");
                    }
                    $state.go('specCost',{num:num});
                }
            }
        ])
        .controller("specCostCtrl",[
            "$stateParams",
            "$scope",
            function ($stateParams,$scope){
                var vm = $scope.vm = {};
                vm.num = $stateParams.num;
                vm.telPhone = function(phone){
                    console.log("拨打电话号码=============="+phone);
                    Contacts.tel(phone);
                }
            }
        ]);
})();
