/**
 * Created by lilingmei on 17/4/10.
 */
(function() {
    'use strict';

    angular.module('caculateRule')
        .service('caculateRuleService', [
            '$rootScope',
            '$q',
            'ShareDataService',
            'DataService',
            'BpPopup',
            function($rootScope, $q,ShareDataService,DataService,BpPopup) {
                var ruleArr = new Array();
                var ruleList ;
                // 初始化 根据城市码和计价类型查询对应的计价规则
                //cityCode 1北京，4上海，。。。。。对应后台返回的城市码
                //productType 计价类型，只有3种，201专车 301快车 401（包括201和301）全部
                //ruleArr类型[{'citycode':'1',
                // 'ruleList':[{"class":"com.bestpay.planeticket.product.api.model.resmodel.taxi.PriceRuleRes$PriceRuleCollection",
                // "priceRule":{"appointmentMinCharge":"50.0","cancelBookMoney":"0.0","cancelBookTime":null,"cancelRealMoney":"0.0","cancelRealTime":null,"cityCode":"4",
                // "class":"com.bestpay.planeticket.product.api.model.resmodel.taxi.PriceRule","district":"021","emptyDistance":"10.0","emptyDrivingUnitPrice":"1.3",
                // "fuelFee":"0.0","lowSpeedTimeUnitPrice":"0.5","minCharge":"0.0","nightBegin":"23:00","nightDrivingUnitPrice":"0.7","nightEnd":"05:00",
                // "normalUnitPrice":"2.9","rideType":"100","startDistance":"0.0","startPrice":"15.0","timeUnitPrice":"0.0"},"rideType":"100"},
                // {"class":"com.bestpay.planeticket.product.api.model.resmodel.taxi.PriceRuleRes$PriceRuleCollection",
                // "priceRule":{"appointmentMinCharge":"108.0","cancelBookMoney":"0.0","cancelBookTime":null,"cancelRealMoney":"0.0","cancelRealTime":null,"cityCode":"4",
                // "class":"com.bestpay.planeticket.product.api.model.resmodel.taxi.PriceRule","district":"021","emptyDistance":"10.0","emptyDrivingUnitPrice":"2.5",
                // "fuelFee":"0.0","lowSpeedTimeUnitPrice":"2.0","minCharge":"48.0","nightBegin":"23:00","nightDrivingUnitPrice":"2.3","nightEnd":"05:00","normalUnitPrice":"5.0",
                // "rideType":"200","startDistance":"0.0","startPrice":"25.0","timeUnitPrice":"0.0"},"rideType":"200"},
                // {"class":"com.bestpay.planeticket.product.api.model.resmodel.taxi.PriceRuleRes$PriceRuleCollection",
                // "priceRule":{"appointmentMinCharge":"70.0","cancelBookMoney":"0.0","cancelBookTime":null,"cancelRealMoney":"0.0","cancelRealTime":null,"cityCode":"4",
                // "class":"com.bestpay.planeticket.product.api.model.resmodel.taxi.PriceRule","district":"021","emptyDistance":"10.0","emptyDrivingUnitPrice":"2.3",
                // "fuelFee":"0.0","lowSpeedTimeUnitPrice":"1.5","minCharge":"0.0","nightBegin":"23:00","nightDrivingUnitPrice":"2.3","nightEnd":"05:00","normalUnitPrice":"4.5",
                // "rideType":"400","startDistance":"0.0","startPrice":"19.0","timeUnitPrice":"0.0"},"rideType":"400"}]},
                // {'citycode':'2','ruleList':[{...},{...},...]}]
                this.initRuleList = function(cityCode,productType) {
                    var _reqConfig = DataService.buildReqConfig('getPriceRule', { retry: false });

                    //var _reqConfig = DataService.buildReqConfig('getPriceRule', {retry: false});
                    var delay = $q.defer();
                    var param = {
                        cityCode: cityCode,
                        productType: productType
                    }
                    var promise = DataService.http(_reqConfig, param);
                    promise.then(function (data) {
                        //data.success = false;
                        if(data.success) {
                            delay.resolve(data)
                            if (data.result) {
                                ruleList = data.result;
                                ruleList.cityCode = cityCode;
                                ruleArr.push(ruleList);
                            }
                        }else{
                            BpPopup.showToast('查询计价规则失败，请稍后再试');
                            delay.reject(data);
                        }
                    }, function (data) {
                        BpPopup.showToast('网络异常，查询计价规则失败，请稍后再试');
                        delay.reject(data)
                    })
                    return delay.promise;
                }
                //this.getRuleList = function(){
                //    return ruleList;
                //}
                //根据城市码查询对应的计价类型
                this.getRuleListByCityCode = function(cityCode){
                    return _.find(ruleArr, { cityCode: cityCode });
                }
                //根据城市码、具体车类型（100，200，400，600）查询相应的计价规则
                this.getRuleListByType = function(cityCode,type) {
                    return _.find(_.find(ruleArr, { cityCode: cityCode }).priceRules, { rideType: type })
                }
            }
        ]);
})();
