/*
 * 选择出发地址页
 * @author Cici
 * created on 7/11/2017
 */
(function() {
    'use strict';
    var moduleName = 'startPoint';
    var controllerName = moduleName + 'Ctrl';

    function config($stateProvider) {
        $stateProvider
            .state('startPoint', {
                cache: false,
                url: '/startPoint',
                views: {
                    '@': {
                        templateUrl: 'business/startPoint/startPoint.tpl.html',
                        controller: controllerName
                    }
                }
            })
    }
    var productNo = User.getProduct();
    angular.module(moduleName, [])
        .config(config)
        .controller(controllerName, [
            "$scope",
            "$rootScope",
            "$state",
            "$location",
            "$ionicHistory",
            "startPointService",
            "ShareDataService",
            "aMapService",
            "BpPopup",
            "DataService",
            function($scope, $rootScope, $state, $location, $ionicHistory, startPointService, ShareDataService, aMapService, BpPopup, DataService) {
                var vm = $scope.vm = {};
                var amap, placeSearch, geocoder, infoWindow;
                var roundDistance = 200,
                    asideDiatance = 30;
                vm.mapCenter = { lng: "116.397428", lat: "39.90923", displayName: "天安门", address: "东城区广场东侧路44号", cityCode: "1", cityName: "北京市" }; //天安门，北京center
                vm.isMapShow = false;
                $scope.onBack = function() {
                    vm.back();
                }
                $scope.$on('$ionicView.beforeEnter', function() {
                    if (!ShareDataService.data_startPointTemp && !ShareDataService.data_startPoint) { // 如果进来没有起点，重新定位
                        // ！暂存起点&&！起点
                        $rootScope.showLoading();
                        aMapService.getLBS(function(point, city) {
                            // point = false, city = false;
                            if (point) {
                                vm.mapCenter = point;
                                ShareDataService.data_curCity = city;
                                ShareDataService.data_startPoint = point;
                                ShareDataService.data_LBSPoint = point;
                            } else {
                                ShareDataService.data_curCity = { cityCode: '1', cityName: '北京市' };
                            };
                            vm.mapInit();
                        });
                    } else if (ShareDataService.data_startPointTemp) {
                        // 暂存起点
                        vm.mapCenter = ShareDataService.data_startPointTemp;
                        vm.mapInit();
                    } else {
                        // ！暂存起点&&起点 
                        vm.mapCenter = ShareDataService.data_startPoint;
                        vm.mapInit();
                    }
                });
                // 地图初始化
                vm.mapInit = function() {
                    $rootScope.hideLoading();
                    vm.isMapShow = true;
                    // 初始化地图
                    amap = new AMap.Map('amap-start', {
                        resizeEnable: true,
                        zoom: 17,
                        zooms: [3, 17],
                        center: [vm.mapCenter.lng, vm.mapCenter.lat]
                    });
                    // 添加附近地址组件
                    AMap.service(["AMap.PlaceSearch"], function() {
                        placeSearch = new AMap.PlaceSearch({ //构造地点查询类
                            pageSize: 2,
                            pageIndex: 1,
                            type: "汽车服务|汽车销售|汽车维修|摩托车服务|餐饮服务|购物服务|生活服务|体育休闲服务|医疗保健服务 | 住宿服务 | 风景名胜 | 商务住宅 | 政府机构及社会团体 | 科教文化服务 |交通设施服务 | 金融保险服务 | 公司企业 | 道路附属设施 | 地名地址信息 | 公共设施 ",
                            city: vm.mapCenter.cityName, //城市
                        });
                    });
                    // 添加地址转换组件
                    amap.plugin(["AMap.Geocoder"], function() {
                        geocoder = new AMap.Geocoder({
                            radius: 1000,
                            extensions: "all"
                        })
                    });
                    // 增加信息窗体
                    infoWindow = new AMap.InfoWindow({
                        content: vm.mapCenter.displayName,
                        offset: new AMap.Pixel(0, 20)
                    });
                    infoWindow.open(amap, [vm.mapCenter.lng, vm.mapCenter.lat]);
                    // 增加推荐点标记
                    vm.mapMarker = aMapService.addMarker({ type: 'zoomPoint', position: [vm.mapCenter.lng, vm.mapCenter.lat], map: amap }, vm);
                    // 设置推荐点标记点击事件
                    vm.mapMarker.on('click', function(e) {
                        amap.setCenter([vm.recommendPoint.lng, vm.recommendPoint.lat]);
                        $scope.$apply();
                    });
                    // 推荐点标记内容
                    vm.recommendPoint = vm.mapCenter;
                    // 添加地图拖拽完毕事件
                    amap.on('moveend', function() {
                        var center = amap.getCenter();　 //获取地图中心点
                        // 推荐附近地点
                        placeSearch.searchNearBy('', [center.lng, center.lat], roundDistance, function(status2, result2) {
                            console.log('----周围地址-----');
                            console.log(result2);
                            if (status2 === 'complete' && result2.info === 'OK') {
                                var c_info = result2.poiList.pois[0];
                                var p_info = result2.poiList.pois[1];
                                vm.mapCenter = {
                                    displayName: c_info.name,
                                    lng: c_info.location.lng + '',
                                    lat: c_info.location.lat + '',
                                    address: c_info.address,
                                    cityCode: vm.mapCenter.cityCode,
                                    cityName: vm.mapCenter.cityName
                                };
                                // address没有的赋值
                                (!vm.mapCenter.address || vm.mapCenter.address == '') && (vm.mapCenter.address = vm, mapCenter.displayName);
                                // 设置推荐点标记内容,位置
                                if (p_info.distance && p_info.distance > asideDiatance) {
                                    vm.recommendPoint = {
                                        displayName: p_info.name,
                                        lng: p_info.location.lng + '',
                                        lat: p_info.location.lat + '',
                                        address: p_info.address,
                                        cityCode: vm.mapCenter.cityCode,
                                        cityName: vm.mapCenter.cityName
                                    };
                                    // address没有的赋值
                                    (!vm.recommendPoint.address || vm.recommendPoint.address == '') && (vm.recommendPoint.address = vm, recommendPoint.displayName);
                                    infoWindow.setContent(vm.recommendPoint.displayName);
                                    infoWindow.setPosition([vm.recommendPoint.lng, vm.recommendPoint.lat]);
                                    // 改变推荐点标记位置
                                    vm.mapMarker.setPosition([vm.recommendPoint.lng, vm.recommendPoint.lat]);
                                } else {
                                    vm.recommendPoint = vm.mapCenter;
                                    infoWindow.setContent(vm.mapCenter.displayName);
                                    infoWindow.setPosition([center.lng, center.lat]);
                                    // 改变推荐点标记位置
                                    vm.mapMarker.setPosition([center.lng, center.lat]);
                                }
                                $scope.$apply();
                            } else {
                                BpPopup.showToast("该地址所属城市变化，请先切换城市");
                                amap.setCenter([vm.mapCenter.lng, vm.mapCenter.lat]);
                            }
                        });
                    });
                };
                // 地址选择页选择起点
                vm.gotoStart = function() {
                    vm.mapCenter.cityCode = ShareDataService.data_curCity.cityCode;
                    vm.mapCenter.cityName = ShareDataService.data_curCity.cityName;
                    ShareDataService.data_startPointTemp = vm.mapCenter;
                    $state.go("searchPlace", { type: 'start' });
                };
                // 换城市
                vm.goToCity = function() {
                    if (!ShareDataService.data_startPoint && ShareDataService.data_endPoint) {
                        console.log('起点：' + JSON.stringify(ShareDataService.data_startPoint) + '终点：' + JSON.stringify(ShareDataService.data_endPoint));
                        //  没有起点&&有终点&&要选起点地址
                        BpPopup.showToast('目前仅支持同城订车');
                        return;
                    }
                    $state.go('city', { type: 'start' });
                }
                vm.back = function() {
                    $state.go('index', { isOrder: '1' });
                    ShareDataService.data_startPointTemp = null;
                }
                vm.choose = function() {
                    vm.mapCenter.cityCode = ShareDataService.data_curCity.cityCode;
                    vm.mapCenter.cityName = ShareDataService.data_curCity.cityName;
                    ShareDataService.data_startPoint = vm.mapCenter;
                    ShareDataService.data_startPointTemp = null;
                    $state.go('index', { isOrder: '1' });
                }
            }
        ])
})();