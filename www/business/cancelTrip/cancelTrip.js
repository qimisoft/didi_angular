(function() {
    'use strict';
    //定义模块名
    var moduleName = 'cancelTrip';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('cancelTrip', {
                cache: false,
                url: '/cancelTrip?orderNo&cityCode',
                views: {
                    '@': {
                        templateUrl: 'business/cancelTrip/cancelTrip.tpl.html',
                        controller: controllerName
                    }
                }
            });
    }
    angular.module(moduleName, [])
        .config(config)
        .controller(controllerName, [
            "$scope",
            "$rootScope",
            "$state",
            "$location",
            "$ionicHistory",
            '$ionicPopup',
            "OrderService",
            "ShareDataService",
            "BpPopup",
            "DataService",
            "$stateParams",
            "TD",
            function($scope, $rootScope, $state, $location, $ionicHistory, $ionicPopup,OrderService, ShareDataService, BpPopup,DataService,$stateParams,TD) {
                var vm = $scope.vm = {};
               vm.goToPrevious=function(){//暂不取消
                   TD.TalkingData.onEventWithLabel("ddcx_0006_0006","滴滴出行_行程详情页面_点击暂不取消订单");
                   $state.go("orderDetail",{orderNo : $stateParams.orderNo});
               }
                $scope.onBack = function(){//返回上一页
                    $state.go("orderDetail",{orderNo : $stateParams.orderNo});
                }
               vm.goToHomePage = function(){
                   TD.TalkingData.onEventWithLabel("ddcx_0006_0007","滴滴出行_行程详情页面_点击确认取消订单");
                   //var confirmPopup = $ionicPopup.confirm({
                    //    title: '',
                    //    template: '你是否取消此次订单？',
                    //    cancelText: '否',
                    //    cancelType: 'button-default',
                    //    okText: '是',
                    //    okType: 'button-positive',
                    //
                    //});
                    //confirmPopup.then(function(res) {
                    //    if (res) {
                    //        $state.go('index');
                    //        console.log('返回上一页');
                    //    } else {
                    //         $ionicHistory.goBack();
                    //        console.log('不取消订单');
                    //    }
                    //});

                   var params = {orderNo:$stateParams.orderNo,force:true};
                   DataService.run("cancelCar",params,function(succRes){
                       if(succRes.success){
                           //$state.go('index');
                           $state.go("orderDetail",{orderNo :$stateParams.orderNo });
                       }else{
                           BpPopup.showToast( "系统繁忙，请稍后重试");
                       }
                   },function(errRes){
                       BpPopup.showToast( "系统繁忙，请稍后重试");
                   },null,false,true);
               };
               vm.goToCancelRule=function(){
                   TD.TalkingData.onEventWithLabel("ddcx_0006_0008","滴滴出行_行程详情页面_点击订单取消规则");
                   $state.go('caculateRule',{cityCode : $stateParams.cityCode});
               }
            }
        ])
})();
