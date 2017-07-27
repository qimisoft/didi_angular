/**
 * 城市选择页（来自飞机票）
 * @author Cici
 * created on 4/1/2017
 */
(function() {
    'use strict';
    angular.module('city')
        .service('cityService', [
            '$rootScope',
            '$q',
            'DataService',
            'BpPopup',
            function($rootScope, $q, DataService, BpPopup) {
                var cityList = null;
                var letterIndexs = [];
                // 城市列表初始化，查接口
                this.initalCityList = function() {
                    var _reqConfig = DataService.buildReqConfig('getCityList', { retry: false });

                    var delay = $q.defer();
                    var promise = DataService.http(_reqConfig, { "productType": "301" });
                    promise.then(function(data) {
                        delay.resolve(data)
                        if (data.result && data.result.cityByInitial && data.result.cityByInitial.length >= 0) {
                            cityList = _buildCityList(data.result.cityByInitial);
                        }
                    }, function(data) {
                        delay.reject(data)
                    })
                    return delay.promise;
                }

                this.getCityList = function() {
                    if (cityList) {
                        return cityList;
                    }
                }

                this.getLetterIndexs = function() {
                    return letterIndexs
                }

                // 操作接口请求出来的列表为可用的
                var _buildCityList = function(cityList) {
                    letterIndexs = [];
                    if (!cityList) {
                        return cityList
                    } else {
                        var _tmpList = [];
                        var _tmpLetter = '';
                        _.each(cityList, function(val1) {
                            _tmpList.push({
                                divider: val1.initial
                            })
                            letterIndexs.push(val1.initial)
                            _.each(val1.cityInfo, function(val2) {
                                val2.class = "";
                                _tmpList.push(val2);
                            })
                        })
                        return _tmpList
                    }
                };
            }
        ]);
})();
