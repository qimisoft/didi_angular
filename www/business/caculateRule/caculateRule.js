/**
 * Created by lilingmei on 17/4/10.
 */
(function() {
    'use strict';
    //定义模块名 计价规则
    var moduleName = 'caculateRule';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('caculateRule', {
                cache: false,
                url: '/caculateRule?cityCode',
                views: {
                    '@': {
                        templateUrl: 'business/caculateRule/caculateRule2.tpl.html',
                        controller: controllerName
                    }
                }
            })
    }
    angular.module(moduleName, [])
        .config(config)
        .controller(controllerName, [
            "$scope",
            "$rootScope",
            "$state",
            "$location",
            "$ionicHistory",
            "OrderService",
            "ShareDataService",
            "BpPopup",
            "DataService",
            'caculateRuleService',
            '$stateParams',
            function($scope, $rootScope, $state, $location, $ionicHistory, orderService, ShareDataService, BpPopup,DataService,caculateRuleService,$stateParams) {
                var vm = $scope.vm = {};
                var cityCode = $stateParams.cityCode;
                if(!cityCode){
                    cityCode = ShareDataService.data_curCity.cityCode;
                    //cityCode = "4";//测试用
                }

                if(caculateRuleService.getRuleListByCityCode(cityCode)){
                    vm.ruleList = caculateRuleService.getRuleListByCityCode(cityCode).priceRules;
                }else{
                    //productType传401 传401查全部计价规则
                    caculateRuleService.initRuleList(cityCode,"401").then(function(data){
                        vm.ruleList = caculateRuleService.getRuleListByCityCode(cityCode).priceRules;
                    })
                }
                //var param = {
                //    cityCode: ShareDataService.data_curCity.cityCode,
                //    productType:"401"
                //}
                //DataService.run("getPriceRule",param,function(res){
                //    console.log(res);
                //    if(res.success){
                //            _.extend(vm,res.result);
                //    }
                //    console.log("vm is:"+vm);
                //});
                //根据类型转换车型
                vm.parseCarType = function(type){
                    var carTypeName = '';
                    switch (type){
                        case "100":
                            carTypeName = '舒适型';
                            break;
                        case "200":
                            carTypeName = '豪华型';
                            break;
                        case "400":
                            carTypeName = '商务型';
                            break;
                        case "600":
                            carTypeName = '经济型';
                            break;
                        default :
                            carTypeName = '经济型';
                    }
                    return carTypeName;
                }
            }
        ])
})();