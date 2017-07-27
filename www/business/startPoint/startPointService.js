/*
 * 选择出发地址页
 * @author Cici
 * created on 7/11/2017
 * 此页提供高德地址转换为滴滴城市的方法
 * 说明：1.预留代码：高德搜索附近，搜索地址功能  add by Cici on 7/11/2017
 */
(function() {
    'use strict';
    angular.module('startPoint')
        .service('startPointService', [
            '$rootScope',
            'DataService',
            'cityService',
            'BpPopup',
            function($rootScope, DataService, cityService, BpPopup) {
                this.formatCity = function(point, callback) {
                    // $rootScope.showLoading();
                    DataService.run("getCityIdByPoi", { lng: point.lng, lat: point.lat }, function(resp) {
                        console.log("[通过坐标获取城市id接口请求成功]");
                        console.log(resp);
                        // $rootScope.hideLoading();
                        if (resp.success) {
                            point.cityCode = resp.result.cityid + '';
                            var city = _.find(cityService.getCityList(), { cityCode: resp.result.cityid + '' });
                            point.cityName = city.cityName;
                            callback(point);
                        } else {
                            BpPopup.showToast(resp.errorMsg);
                            callback(null);
                        }
                    }, function(err) {
                        console.log(err);
                        callback(null);
                    }, null, false);
                }


                /*******以下代码为高德搜附近和搜地址预留*****/
                //显示附近地址 
                // vm.showAround = function() {
                //     vm.isMapShow && (vm.isMapShow = false,vm.no_result = false);
                //     vm.addressList = [];
                //     AMap.service(["AMap.PlaceSearch"], function() {
                //         var placeSearch = new AMap.PlaceSearch({ //构造地点查询类
                //             pageSize: 10,
                //             pageIndex: 1,
                //             city: vm.mapCenter.cityName, //城市
                //         });
                //         placeSearch.searchNearBy('', [vm.mapCenter.lng, vm.mapCenter.lat], 5000, function(status, result) {
                //             console.log('----周围地址-----');
                //             console.log(result);
                //             console.log(vm.mapCenter)
                //             if (status === 'complete' && result.info === 'OK') {
                //                 _.each(result.poiList.pois, function(val) {
                //                     vm.addressList.push({
                //                         displayName: val.name,
                //                         address: val.address,
                //                         lng: val.location.lng,
                //                         lat: val.location.lat,
                //                         cityName: vm.mapCenter.cityName
                //                     })
                //                 })
                //                 $scope.$apply();
                //             }
                //         });
                //     });
                // };
                // 地址搜索
                // $scope.$watch('vm.search', function(newValue) {
                //     console.log(newValue)
                //     var json_ = {
                //         cityName: vm.mapCenter.cityName,
                //         input: newValue
                //     }
                //     if (newValue) {
                //         // input有值进行地址搜索
                //         vm.addressList = [];
                //         AMap.service(["AMap.PlaceSearch"], function() {
                //             var placeSearch = new AMap.PlaceSearch({ //构造地点查询类
                //                 pageSize: 10,
                //                 pageIndex: 1,
                //                 city: vm.mapCenter.cityName
                //             });
                //             placeSearch.search(newValue, function(status, result) {
                //                 console.log('----搜索地址-----');
                //                 console.log(result);
                //                 vm.no_result = false;
                //                 if (status === 'complete' && result.info === 'OK') {
                //                     _.each(result.poiList.pois, function(val) {
                //                         vm.addressList.push({
                //                             displayName: val.name,
                //                             address: val.address,
                //                             lng: val.location.lng,
                //                             lat: val.location.lat,
                //                             cityName: vm.mapCenter.cityName
                //                         })
                //                     })
                //                 } else {
                //                     vm.no_result = true;
                //                 }
                //                 $scope.$apply();
                //             });
                //         });
                //     } else if (!vm.isMapShow) {
                //         // input没值用附近的地址
                //         vm.showAround();
                //     }
                // });
            }
        ]);
})();
