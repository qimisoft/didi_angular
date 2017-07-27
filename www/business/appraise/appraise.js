(function(){
    'use strict';

    function config($stateProvider){
        $stateProvider
            .state('appraise',{
                cache:false,
                url:'/appraise',
                views:{
                    '@':{
                        templateUrl:"business/appraise/appraise.tpl.html",
                        controller:'appraiseCtrl'
                    }
                }
            });
    }
    angular.module('appraise',[])
        .config(config)
        .controller('appraiseCtrl',[
            '$rootScope',
            '$scope',
            '$state',
            '$stateParams',
            'DataService',
            'BpPopup',
            'ShareDataService',
            "TD",
            function($rootScope,$scope,$state,$stateParams,DataService,BpPopup,ShareDataService,TD){
                var vm = $scope.vm = {};
                vm.starLevelList = [{id : 1 ,label:'很差'},{id : 2 ,label:'较差'},{id : 3 ,label:'一般'},{id : 4,label:'较好'},{id : 5 ,label:'很好'}];
                vm.orderNo = ShareDataService.remarkData.orderNo;//订单编号
                vm.payAmt = ShareDataService.remarkData.totalPrice;
                vm.isAppraise = ShareDataService.remarkData.isAppraise; //是否点评过，如果没有点评，则为false

                if(vm.isAppraise){//如果点评司机已经点评过，则在页面上显示查看司机点评页面。
                    vm.starTimeLevel = vm.starLevelList[ShareDataService.remarkData.inTimeLevel-1],
                        vm.starCarLevel = vm.starLevelList[ShareDataService.remarkData.carAppearanceLevel-1],
                        vm.starDriverLevel = vm.starLevelList[ShareDataService.remarkData.driverServiceLevel-1],
                        vm.driverComment =  ShareDataService.remarkData.driverComment;
                }


                vm.clickTimeStar = function(item){//准时接送评价
                    vm.starTimeLevel = item;
                }
                vm.clickCarStar = function(item){//车况车貌评价
                    vm.starCarLevel = item;
                }
                vm.clickDriverStar = function(item){//司机服务评价
                    vm.starDriverLevel = item;
                }

                vm.appraiseSubmit = function(){

                    if(!vm.starTimeLevel){
                        BpPopup.showToast( "请对订单准时接送评价");
                    }else if(!vm.starCarLevel){
                        BpPopup.showToast( "请对订单车况情况评价");
                    }else if(!vm.starDriverLevel){
                        BpPopup.showToast( "请对订单司机服务评价");
                    }else if(!vm.appraiseText){
                        BpPopup.showToast( "请填写评价");
                    }else{
                        TD.TalkingData.onEventWithLabel("ddcx_0007_0002","滴滴出行_点评页面_点击提交点评");
                        var appraiseListData = {
                            "orderNo":vm.orderNo,
                            inTimeLevel:vm.starTimeLevel.id +"",
                            carAppearanceLevel:vm.starCarLevel.id +"",
                            driverServiceLevel:vm.starDriverLevel.id +"",
                            content:vm.appraiseText
                        };
                        DataService.run('commentDriver',appraiseListData,
                            function(res){
                                if(res.success){
                                    //$state.go("orderDetail",{orderNo:vm.orderNo});
                                    BpPopup.showToast( "评价成功！");
                                    $state.go("index");
                                }else{
                                    BpPopup.showToast( res.errorMsg || "系统繁忙，请稍后重试");
                                }

                            },function(res){
                                BpPopup.showToast( "系统繁忙，请稍后重试");
                            },null,false);
                    }

                }
            }
        ]);
})();