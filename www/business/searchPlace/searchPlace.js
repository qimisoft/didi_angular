/**
 * 地址选择页
 * @author Cici
 * created on 4/1/2017
 * 说明1：add on 6/14/2017 by Cici
 *      进入此页的入口有以下几种：
 *      1.首页点击起点／终点-->type=start／end,返回首页(index)
 *      2.常用地址页选家的／公司 地址-->type=home／company,from=address,返回常用地址页（address）
 *      3.地址选择页选家的地址-->type=home,from=start/end,返回地址选择页（type=from）
 *      4.地址选择页选公司地址-->type=company,from=start/end,返回地址选择页（type=from）
 */
(function() {
    'use strict';
    //定义模块名
    var moduleName = 'searchPlace';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('searchPlace', {
                cache: false,
                url: '/searchPlace?:type:from',
                views: {
                    '@': {
                        templateUrl: 'business/searchPlace/searchPlace.tpl.html',
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
            "$ionicHistory",
            "ShareDataService",
            "BpPopup",
            "DataService",
            "TD",
            function($scope, $rootScope, $state, $stateParams, $ionicHistory, ShareDataService, BpPopup, DataService, TD) {
                var vm = $scope.vm = {};
                var location_type = $stateParams.type;
                var location_from = $stateParams.from;
                // 初始化家和地址
                vm.addPoint = [{ type: 'home', name: '家', placeHolder: '设置家的地址', point: null }, { type: 'company', name: '公司', placeHolder: '设置公司地址', point: null }]

                var _saveHomeOrCompany = function(type) {
                    ShareDataService['data_' + type + 'Point'].addressType = (type == 'home') ? '0' : '1'; //0家，1公司
                    var _params = ShareDataService['data_' + type + 'Point'];
                    _params.operateType = '0'; //0增加
                    _params.userId = productNo;
                    DataService.run("manageAddressBook", _params, function(resp) {
                        console.log("[管理地址接口请求成功:保存]");
                        console.log(resp);
                        var _typePoint = _.find(vm.addPoint, { type: type });
                        if (resp.success) {
                            _typePoint.point = ShareDataService["data_" + type + "Point"];
                            BpPopup.showToast('编辑常用地址成功');
                        }
                    })
                }
                $scope.onBack = function() {
                    vm.back();
                }
                $scope.$on('$ionicView.beforeEnter', function() {
                    // 设置当前城市,要选家和公司地址的时候用临时城市tempCity，其他用当前城市, 当前城市没有的话用北京
                    vm.curCity = (location_from && location_from != location_type) ? ShareDataService.data_tempCity : (ShareDataService.data_curCity ? ShareDataService.data_curCity : { cityCode: '1', cityName: '北京市' });
                    // 查询家和公司的地址
                    DataService.run("getAddressBook", { userId: productNo }, function(resp) {
                        console.log("[address list]");
                        console.log(resp);
                        if (resp.success) {
                            var _home = _.find(vm.addPoint, { type: 'home' });
                            var _company = _.find(vm.addPoint, { type: 'company' });
                            if (resp.result && resp.result.length > 0) {
                                _.each(resp.result, function(value) {
                                    if (value.addressType == '0') { //家地址赋值
                                        _home.point = value;
                                    } else if (value.addressType == '1') { //公司地址赋值
                                        _company.point = value;
                                    }
                                });
                            };
                            if (location_type == 'start' || location_type == 'end') { //当前页面是选起点和终点的页面
                                if (ShareDataService.data_homePoint && ShareDataService.data_homePoint.toSave) {
                                    _saveHomeOrCompany('home');
                                    console.log('保存家的地址');
                                } else if (ShareDataService.data_companyPoint && ShareDataService.data_companyPoint.toSave) {
                                    _saveHomeOrCompany('company');
                                    console.log('保存公司地址');
                                }
                            }
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false);
                })

                // 页面title，文字等配置
                switch (location_type) {
                    case 'home':
                        vm.options = { searchHolder: '输入家的住址', title: '填写家的地址', showHomeAndCompany: false };
                        break;
                    case 'company':
                        vm.options = { searchHolder: '输入公司住址', title: '填写公司地址', showHomeAndCompany: false };
                        break;
                    case 'end':
                        vm.options = { searchHolder: '您在哪下车', title: '选择到达地址', showHomeAndCompany: true };
                        break;
                    default:
                        vm.options = { searchHolder: '您在哪上车', title: '选择出发地址', showHomeAndCompany: true };
                        break;
                }

                // 获取缓存历史地址记录
                var keyOfSave = 'carAddressHistory_' + User.getProduct();
                var historyAddressList = localStorage.getItem(keyOfSave) ? JSON.parse(localStorage.getItem(keyOfSave)) : null;
                var _buildAddressList = function(param) {
                    DataService.run('getAddresses', param, function(data) {
                        // $rootScope.hideLoading();
                        vm.no_result = false;
                        if (data.result && data.result.address && data.result.address.length >= 0) {
                            var address_list = data.result.address;
                            // 历史地址信息
                            if (historyAddressList && param.isHistory) {
                                // 选终点首次进入，历史地址放在最前面
                                console.log("-----全部缓存地址:" + JSON.stringify(historyAddressList));
                                var _his = _.where(historyAddressList, { cityName: vm.curCity.cityName })
                                console.log("-----当前城市缓存地址:" + JSON.stringify(historyAddressList));
                                _.each(_his, function(val) { // 遍历当前城市缓存地址，为没有citycode的地址加上citycode
                                    (!val.cityCode) && (val.cityCode = vm.curCity.cityCode);
                                })
                                var delete_arr = [];
                                _.each(address_list, function(val, key) {
                                    var his_index = hisIndexOf(_his, val);
                                    if (his_index > -1) {
                                        delete_arr.push(key);
                                    }
                                })
                                _.each(delete_arr, function(val) {
                                    delete address_list[val];
                                })
                                address_list = _his.concat(address_list).slice(0, 10 + delete_arr.length);
                            } else if (historyAddressList && !param.isHistory) {
                                // 其他不是终点第一次进入，如果选出来的地址在缓存里存在，提前
                                _.each(address_list, function(val, key) {
                                    if (_.find(historyAddressList, val)) {
                                        address_list.splice(key, 1);
                                        address_list.unshift(val);
                                    }
                                })
                            }
                            vm.addressList = address_list;
                        } else {
                            vm.no_result = true;
                        }
                    }, null, null, true, false)
                }

                var hisIndexOf = function(arr, item) {
                    var s = -1;
                    _.each(arr, function(val, index) {
                        if (val.displayName == item.displayName) {
                            s = index;
                        }
                    })
                    return s;
                }

                $scope.$watch('vm.search', function(newValue) {
                    var json_ = {
                        cityName: vm.curCity.cityName,
                        input: newValue
                    }
                    if (!newValue) {
                        // $rootScope.showLoading();
                        if (location_type == 'start') {
                            // 起点搜暂时起点附近的
                            if (ShareDataService.data_startPointTemp) {
                                json_ = { cityName: vm.curCity.cityName, input: ShareDataService.data_startPointTemp.address.substr(0, 4) }
                            } else {
                                // 没有定位信息,显示历史记录
                                json_ = { cityName: vm.curCity.cityName, input: vm.curCity.cityName.split('市')[0], isHistory: true }
                            }
                        } else {
                            // 终点显示历史记录
                            json_ = { cityName: vm.curCity.cityName, input: vm.curCity.cityName.split('市')[0], isHistory: true }
                        }
                    }
                    _buildAddressList(json_);
                })

                vm.goToCity = function() {
                    TD.TalkingData.onEventWithLabel("ddcx_0004_0001", "滴滴出行_选择地址页面_点击下拉城市列表");

                    if (ShareDataService.data_startPoint && !ShareDataService.data_endPoint && location_type == 'end' || !ShareDataService.data_startPoint && ShareDataService.data_endPoint && location_type == 'start') {
                        console.log('起点：' + JSON.stringify(ShareDataService.data_startPoint) + '终点：' + JSON.stringify(ShareDataService.data_endPoint));
                        // 有起点&&没有终点&&要选终点地址|| 没有起点&&有终点&&要选起点地址
                        BpPopup.showToast('目前仅支持同城订车');
                        TD.TalkingData.onEventWithLabel("ddcx_0004_0006", "滴滴出行_选择地址页面_点击下拉城市列表_不合法选择"); //起点和终点有一个有数据，还想选择城市的情况
                        return;
                    }
                    if (location_from) { //要选家和公司的地址
                        $state.go('city', { type: location_type, from: location_from });
                    } else {
                        $state.go('city', { type: location_type });
                    }
                }
                vm.choose = function(item) {
                    ShareDataService.data_startPointTemp=null;
                    // 要选择时先把家和公司的share清空
                    ShareDataService.data_homePoint = null;
                    ShareDataService.data_companyPoint = null;
                    if (location_type == 'start' && ShareDataService.data_endPoint && item.cityCode != ShareDataService.data_endPoint.cityCode || location_type == 'end' && ShareDataService.data_startPoint && item.cityCode != ShareDataService.data_startPoint.cityCode) {
                        // 要选起点&&有终点&&当前要选的地址和终点不是一个城市||要选终点&&有起点&&当前要选的地址和起点不是一个城市
                        BpPopup.showToast('目前仅支持同城订车');
                        return;
                    };
                    if (item.addressType) { // 选中的item是家或公司的地址
                        if (item.cityCode != ShareDataService.data_curCity.cityCode) { //要选的城市不是当前城市
                            // 换城市
                            ShareDataService.data_curCity = { cityCode: item.cityCode, cityName: item.cityName };
                            // 清空起点和终点
                            ShareDataService.data_startPoint = null;
                            ShareDataService.data_endPoint = null;
                        }
                    };
                    switch (location_type) {
                        case 'home':
                            _dealWithHomeOrCompany(item);
                            break;
                        case 'company':
                            _dealWithHomeOrCompany(item);
                            break;
                        case 'end':
                            ShareDataService.data_endPoint = item;
                            $state.go('index', { isOrder: '1' });
                            break;
                        default:
                            ShareDataService.data_startPoint = item;
                            $state.go('index', { isOrder: '1' });
                            break;
                    }
                }
                var _dealWithHomeOrCompany = function(item) {
                    // 先把当前要选的item赋值给相应的sharedata
                    ShareDataService['data_' + location_type + 'Point'] = item;
                    if (location_from) { //要选家和公司的地址
                        switch (location_from) {
                            case 'end':
                            case 'start': //如果是从选起点／终点过来的，跳转到起点／终点页面，准备保存地址
                                ShareDataService['data_' + location_type + 'Point'].toSave = true;
                                $state.go('searchPlace', { type: location_from });
                                break;
                            default: //默认跳转到常用地址页
                                $state.go('address');
                                break;
                        }
                    } else {
                        $state.go('index', { isOrder: '1' });
                    }
                }
                vm.back = function() {
                    if (location_type == 'end') {
                        ShareDataService.data_homePoint = null;
                        ShareDataService.data_companyPoint = null;
                        $state.go('index', { isOrder: '1' });
                    } else if (location_type == 'start') {
                        ShareDataService.data_homePoint = null;
                        ShareDataService.data_companyPoint = null;
                        if (!ShareDataService.data_startPoint) {
                            ShareDataService.data_startPoint = vm.addressList[0];
                        }
                        $state.go('startPoint');
                    } else {
                        $ionicHistory.goBack();
                    }
                };
                vm.setHomeOrCompany = function(item) {
                    if (item.point) {
                        // 已经设置家和公司地址，去选中
                        vm.choose(item.point);
                    } else {
                        // 没有设置家和公司地址，去设置
                        ShareDataService.data_tempCity = ShareDataService.data_curCity;
                        $state.go('searchPlace', { type: item.type, from: location_type });
                    }
                }
            }
        ])
})();
