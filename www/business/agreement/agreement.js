(function(){
    'use strict';
    function config($stateProvider){
        $stateProvider
            .state('agreement',{//协议列表页面
                cache:false,
                url:'/agreement',
                views:{
                    '@':{
                        templateUrl:"business/agreement/agreement.tpl.html",
                        controller:'agreementCtrl'
                    }
                }
            })
            .state('softwareUse',{//软件使用协议
                cache:false,
                url:'/softwareUse',
                views : {
                    '@' : {
                        templateUrl : "business/agreement/softwareUse.tpl.html",
                        controller : 'softwareUseCtrl'
                    }
                }
            })
            .state('expressTrain',{//专快车协议
                cache : false,
                url : '/expressTrain',
                views : {
                    '@' : {
                        templateUrl : "business/agreement/expressTrain.tpl.html",
                        controller : 'expressTrainCtrl'
                    }
                }
            })
            .state('agentCharge',{//代扣协议
                cache : false,
                url : '/agentCharge',
                views : {
                    '@' : {
                        templateUrl : "business/agreement/agentCharge.tpl.html",
                        controller : 'agenChargeCtrl'
                    }
                }
            })
            .state('expressTrainAnnex',{
                cache : false,
                url : '/expressTrainAnnex',
                views : {
                    '@' : {
                        templateUrl : 'business/agreement/expressTrainAnnex.tpl.html'
                    }
                }
            })
            .state("softwareUseAnnex",{
                cache : false,
                url : '/softwareUseAnnex',
                views : {
                    '@' : {
                        templateUrl : 'business/agreement/softwareUseAnnex.tpl.html'
                    }
                }
            })
        ;

    }

    angular.module('agreement',[])
        .config(config)
        .controller('agreementCtrl',[
            '$rootScope',
            '$scope',
            '$state',
            "TD",
            function($rootScope,$scope,$state,TD){
                var vm = $scope.vm = {};

                /*跳转至软件使用协议*/
                vm.goToSoftwareUse = function(){
                    TD.TalkingData.onEventWithLabel("ddcx_0003_0001","滴滴出行_协议页_点击软件使用协议");
                    $state.go('softwareUse');
                }

                /*跳转至专快车协议*/
                vm.goToExpressTrain = function(){
                    TD.TalkingData.onEventWithLabel("ddcx_0003_0002","滴滴出行_协议页_点击网约车协议");
                    $state.go('expressTrain');

                }

                /*代扣协议*/
                vm.goToAgentCharge = function(){
                    TD.TalkingData.onEventWithLabel("ddcx_0003_0003","滴滴出行_协议页_点击代扣服务协议");
                    $state.go('agentCharge');
                }

                //vm.goToAppraise = function(isAppraise){
                //    console.log("expressTrain agreement back");
                //    $state.go('appraise',{orderNo : "66666666",payAmt : "￥100000.0",isAppraise : isAppraise});
                //}
                //vm.goToSpec = function(){
                //    $state.go("spec");
                //}
                //
                //vm.goToAppraiseDetail = function(isAppraise){
                //    $state.go("appraiseDetail",{orderNo : "66666666",payAmt : "￥100000.0",isAppraise : isAppraise})
                //}
            }
        ])
        .controller('expressTrainCtrl',['$rootScope','$scope' ,'$state',function($rootScope,$scope,$state){
            var vm = $scope.vm = {};
            vm.goToExpressAnnex = function(){
                $state.go('expressTrainAnnex');
            }
            vm.telPhone = function(phone){
                console.log("拨打电话号码=============="+phone);
                Contacts.tel(phone);
            }
        }])
        .controller('agenChargeCtrl',['$rootScope','$scope' ,'$state',function($rootScope,$scope,$state){
            var vm = $scope.vm = {};
            vm.telPhone = function(phone){
                console.log("拨打电话号码=============="+phone);
                Contacts.tel(phone);
            }
        }])
        .controller('softwareUseCtrl',['$rootScope','$scope' ,'$state',function($rootScope,$scope,$state){
            var vm = $scope.vm = {};
            vm.expressTrain = function(){
                $state.go('expressTrain');
            }
            vm.telPhone = function(phone){
                console.log("拨打电话号码=============="+phone);
                Contacts.tel(phone);
            }
        }]);


})();
