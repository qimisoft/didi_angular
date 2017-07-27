/**
 * 城市选择页（来自飞机票）
 * @author Cici
 * created on 4/1/2017
 * 说明1：add on 6/14/2017 by Cici
 *      要选城市的情况有两种：
 *      1.换当前城市，即打车使用的城市（主要）
 *      2.换临时城市，不影响打车的切换城市，例如家和公司的城市选择
 */
(function() {
    'use strict';
    //定义模块名
    var moduleName = 'city';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('city', {
                cache: false,
                url: '/city?:type:from',
                views: {
                    '@': {
                        templateUrl: 'business/city/city.tpl.html',
                        controller: controllerName
                    }
                }
            })
    }
    var productNo = User.getProduct();
    // var productNo = "13411111111";
    angular.module(moduleName, [])
        .config(config)
        .controller(controllerName, [
            "$scope",
            "$rootScope",
            "$state",
            "$stateParams",
            "$anchorScroll",
            "$location",
            "$ionicHistory",
            "cityService",
            "ShareDataService",
            "BpPopup",
            "caculateRuleService",
            function($scope, $rootScope, $state, $stateParams, $anchorScroll, $location, $ionicHistory, cityService, ShareDataService, BpPopup, caculateRuleService) {
                var vm = $scope.vm = {};
                vm.noresultHeight = document.documentElement.clientHeight - 60;
                // 文字配置
                switch ($stateParams.type) {
                    case 'home':
                        vm.options = { searchHolder: '输入家的地址' };
                        break;
                    case 'company':
                        vm.options = { searchHolder: '输入公司地址' };
                        break;
                    case 'end':
                        vm.options = { searchHolder: '您在哪下车' };
                        break;
                    default:
                        vm.options = { searchHolder: '您在哪上车' };
                        break;
                }
                // 获取城市列表list
                if (cityService.getCityList()) {
                    vm.cityList = cityService.getCityList()
                } else {
                    cityService.initalCityList().then(function(data) {
                        vm.cityList = cityService.getCityList()
                    })
                }

                // 当前选中城市的cityCode
                if (!ShareDataService.data_curCity) {
                    ShareDataService.data_curCity = {
                        cityName: '北京市',
                        cityCode: '1'
                    };
                }

                // 当前城市=要选家和公司地址用临时城市，选主城市用当前城市
                vm.curCity = $stateParams.from ? ShareDataService.data_tempCity : ShareDataService.data_curCity;
                console.log('临时城市:' + JSON.stringify(ShareDataService.data_tempCity) + ',当前城市:' + JSON.stringify(ShareDataService.data_curCity) + ',此页用的城市:' + JSON.stringify(vm.curCity));
                // 热门城市列表
                vm.hotCityList = [{ "cityCode": "1", "cityName": "北京市" }, { "cityCode": "4", "cityName": "上海市" }, { "cityCode": "7", "cityName": "天津市" }, { "cityCode": "18", "cityName": "重庆市" }, { "cityCode": "3", "cityName": "广州市" }, { "cityCode": "2", "cityName": "深圳市" }, { "cityCode": "17", "cityName": "成都市" }, { "cityCode": "5", "cityName": "杭州市" }];
                // 引导字母
                vm.letterIndexs = cityService.getLetterIndexs();

                vm.gotoAnchor = function(letter) {
                    var _prefix = 'anchor__';
                    var newHash = _prefix + letter;
                    if ($location.hash() !== newHash) {
                        // set the $location.hash to `newHash` and
                        // $anchorScroll will automatically scroll to it
                        $location.hash(_prefix + letter);
                    } else {
                        $anchorScroll(newHash);
                    }
                };
                vm.choose = function(item) {
                    if ($stateParams.from) { //要选家和公司地址
                        ShareDataService.data_tempCity = item;
                        console.log('要选家和公司地址！' + '临时城市：' + JSON.stringify(ShareDataService.data_tempCity));
                        $state.go('searchPlace', { type: $stateParams.type, from: $stateParams.from });
                    } else {
                        if (ShareDataService.data_curCity.cityCode != item.cityCode) {
                            // 每换一次城市，要清空起点终点和出发时间
                            ShareDataService.data_startPoint = null;
                            ShareDataService.data_endPoint = null;
                            ShareDataService.data_depatureTime = null;
                            ShareDataService.data_curCity = item;
                            // 每次换城市要初始化一次该城市的计价规则
                            caculateRuleService.initRuleList(ShareDataService.data_curCity.cityCode, '401');
                            // 每次换城市把已选车型清空
                            ShareDataService.data_selectedCarType = null;
                            // 每次换城市清空暂存起点
                            ShareDataService.data_startPointTemp = null;
                        };
                        console.log('切换主城市！' + '当前城市：' + JSON.stringify(ShareDataService.data_curCity));
                        $state.go('searchPlace', { type: $stateParams.type });
                    }
                };
                vm.back = function() {
                    // 此处判断两种情况，一种是当前城市不支持嘀嘀打车从首页直接跳过来，返回首页加params，
                    // 另一种是从地址页正常跳过来的，正常返回
                    if ($stateParams.type) {
                        $ionicHistory.goBack();
                    } else {
                        $state.go('index', { isOrder: '1' });
                    }
                }
                $scope.onBack = function() {
                    vm.back();
                }
                vm.goToSearchPlace = function() {
                    if ($stateParams.from) {
                        $state.go('searchPlace', { type: $stateParams.type, from: $stateParams.from });
                    } else {
                        $state.go('searchPlace', { type: $stateParams.type });
                    }
                }
            }
        ])
})();
