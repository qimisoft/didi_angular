(function() {
    'use strict';
    angular.module('common.aMapService', [])
        .service('aMapService', [
            '$rootScope',
            "$state",
            "DataService",
            "BpPopup",
            function($rootScope, $state, DataService, BpPopup) {
                this.getLBS = function(callback) {
                    var clientVersion = App.getClientVersion();
                    var version = clientVersion.replace(/[.]/g, "");
                    // var version=519;
                    var DEVICE_IS_IOS = /iP(ad|hone|od)/.test(navigator.userAgent);
                    if (DEVICE_IS_IOS) {
                        var ios_Version_int = parseInt(version); //获得版本号
                    } else {
                        var android_Version_int = parseInt(version); //获得版本号
                    }
                    var isLBSSupport = ios_Version_int >= 519 || android_Version_int >= 521;
                    var getCityId = function(point) {
                        DataService.run("getCityIdByPoi", { lng: point.lng, lat: point.lat }, function(resp) {
                            console.log("[通过坐标获取城市id接口请求成功]");
                            console.log(resp);
                            if (resp.success) {
                                var city = {
                                    cityCode: resp.result.cityid + '',
                                    cityName: point.cityName
                                }
                                point.cityCode = city.cityCode;
                                callback(point, city);
                            } else {
                                BpPopup.showToast(resp.errorMsg);
                                callback(null, null);
                            }
                        }, function(err) {
                            console.log(err);
                            callback(null, null);
                        }, null, false);
                    }
                    var newLBSSuccessCallback = function(object) {
                        console.log('[LBS] newLBSSuccessCallback');
                        console.log(JSON.stringify(object));
                        var point = {
                            displayName: object.POIName,
                            lng: object.longitude + '',
                            lat: object.latitude + '',
                            cityName: object.city,
                            address: object.district + object.street + (object["number"] ? object["number"] : object[" number"])
                        }
                        getCityId(point);
                    }

                    var newLBSFailCallback = function(object) {
                        console.log('[LBS] 第一次fail');
                        console.log(JSON.stringify(object));
                        callback(null, null);
                    };
                    // 因为高德定位比大厅的重新定位要快8s左右，而且定位结果比较准确，所以先使用高德定位(2~3s)，定位失败再用大厅的缓存定位（<1s）
                    this.getGeolocation(function(status, object) {
                        if (status == 'complete' && object.addressComponent) { //有可能 object.addressComponent 为undefined的情况，所以做object.addressVomponent判断
                            console.log('---高德定位成功---');
                            console.log(object);
                            var point = {
                                displayName: object.addressComponent.building ? object.addressComponent.building : object.addressComponent.street + object.addressComponent.streetNumber,
                                lng: object.position.lng + '',
                                lat: object.position.lat + '',
                                cityName: object.addressComponent.city != '' ? object.addressComponent.city : object.addressComponent.province,
                                address: object.addressComponent.district + object.addressComponent.street + object.addressComponent.streetNumber
                            };
                            getCityId(point);
                        } else {
                            console.log('---高德定位失败---');
                            console.log(object);
                            try {
                                if (isLBSSupport) {
                                    LBS.getInfo({
                                        isUpdated: false //先用大厅缓存定位
                                    }, newLBSSuccessCallback, newLBSFailCallback);
                                }
                            } catch (err) {}
                        }
                    })
                }
                this.getGeolocation = function(callback) {
                    //为地图加载定位，并返回定位结果
                    var geolocation;
                    var map = new AMap.Map('amap_container');
                    map.plugin('AMap.Geolocation', function() {
                        geolocation = new AMap.Geolocation({
                            enableHighAccuracy: true, //是否使用高精度定位，默认:true
                            timeout: 10000, //超过10秒后停止定位，默认：无穷大
                            zoomToAccuracy: true, //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
                            showMarker: true, //定位成功后在定位到的位置显示点标记，默认：true
                            showButton: true, //显示定位按钮，默认：true
                            buttonOffset: new AMap.Pixel(10, 20) //定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
                        });
                        map.addControl(geolocation);
                        geolocation.getCurrentPosition(callback);
                    });
                };
                /*
                 //重新定位，获取与起点之间的距离
                 params
                    startPoint 为必传
                    endPoint   为非必传，如果不传，将重新定位当前位置作为endPoint的值（经纬度）
                    callback 为回调函数，返回定位新地址的信息
                * */
                this.getDistance = function(startPoint, callback, endPoint) {
                    console.log("start:" + startPoint + "---");
                    var that = this;
                    if (!startPoint) {
                        return;
                    }
                    var map = new AMap.Map('amap_container');
                    var lnglat = new AMap.LngLat(startPoint[0], startPoint[1]);
                    var point = { distance: 0 };
                    if (!endPoint) { //如果endPoint没有传
                        that.getGeolocation(function(status, object) {
                            if (status == 'complete' && object.addressComponent) { //定位成功  有可能 object.addressComponent 为undefined的情况，所以做object.addressVomponent判断
                                point = {
                                    citycode: object.addressComponent.citycode,
                                    displayName: object.addressComponent.building ? object.addressComponent.building : object.addressComponent.street + object.addressComponent.streetNumber,
                                    lng: object.position.lng + '',
                                    lat: object.position.lat + '',
                                    cityName: object.addressComponent.city != '' ? object.addressComponent.city : object.addressComponent.province,
                                    address: object.addressComponent.district + object.addressComponent.street + object.addressComponent.streetNumber
                                };
                                point.distance = parseInt(lnglat.distance([point.lng, point.lat]));
                                // 当前页面不是首页，不执行
                                console.log("currentPage:" + $state.current.name);
                                //如果页面还停留在首页，正常回调，如果不是，回调参数重置 不让页面弹框提示
                                $state.current.name == 'index' ? callback(point) : callback({ distance: 0 });

                                /* */
                            } else { //定位失败
                                callback(point);
                            }
                        });
                    } else {
                        point.distance = parseInt(lnglat.distance(endPoint));
                        callback(point);
                    }

                };
                this.formatAddress = function(data) {
                    // 此方法功能为转换高德的定位地址为滴滴可以用地址
                    return {
                        displayName: data.addressComponent.building ? data.addressComponent.building : (data.pois[0] ? data.pois[0].name : (data.addressComponent.street + data.addressComponent.streetNumber)),
                        cityName: data.addressComponent.city != '' ? data.addressComponent.city : data.addressComponent.province,
                        address: data.addressComponent.district + data.addressComponent.street + data.addressComponent.streetNumber
                    };
                };
                this.addMarker = function(options,vm) {
                    if (!options.type || !options.map) {
                        BpPopup.showToast('请添写必填参数');
                        return;
                    }
                    options.map = options.map; //标记所在地图
                    options.type = options.type || 'start'; //标记类型
                    options.position = options.position; //标记位置
                    if (options.type == 'zoomPoint') {
                        var marker = new AMap.Marker({
                            content: '<div class="marker_zoom"><em></em></div>',
                            offset: new AMap.Pixel(-15, -14),
                            map: options.map
                        });
                        return marker;
                    } else if (options.type == 'car') {
                        var marker = new AMap.Marker({
                            icon: new AMap.Icon({
                                image: "././img/car.png",
                                size: new AMap.Size(52, 44), //图标大小
                                imageSize: new AMap.Size(26, 22)
                            }),
                            offset: new AMap.Pixel(-13, -11),
                            map: options.map
                        });
                        return marker;
                    } else {
                        var marker = new AMap.Marker({
                            icon: new AMap.Icon({
                                image: " ./img/" + options.type + ".png",
                                size: new AMap.Size(22, 33), //图标大小
                                imageSize: new AMap.Size(22, 33)
                            }),
                            position: options.position,
                            offset: new AMap.Pixel(-11, -33),
                            map: options.map
                        });
                        return marker;
                    }
                }
            }
        ]);
})();
