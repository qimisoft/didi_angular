/**
 * 常用地址页
 * @author Cici
 * created on 6/5/2017
 */
(function() {
    'use strict';
    //定义模块名
    var moduleName = 'address';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('address', {
                cache: false,
                url: '/address',
                views: {
                    '@': {
                        templateUrl: 'business/address/address.tpl.html',
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
            "$location",
            "$ionicHistory",
            "$ionicListDelegate",
            "$ionicLoading",
            "ShareDataService",
            "aMapService",
            "BpPopup",
            "DataService",
            function($scope, $rootScope, $state, $location, $ionicHistory, $ionicListDelegate, $ionicLoading, ShareDataService, aMapService, BpPopup, DataService) {
                var vm = $scope.vm = {};
                vm.showDelelte = false;
                vm.addShow = false;
                vm.addPoint = [{ type: 'home', name: '家', placeHolder: '设置家的地址', showDelelte: false, point: null }, { type: 'company', name: '公司', placeHolder: '设置公司地址', showDelelte: false, point: null }]

                $scope.onBack = function() {
                    // 清空已选的家和公司地址
                    ShareDataService.data_homePoint = null;
                    ShareDataService.data_companyPoint = null;
                    $state.go("index");
                }

                $scope.$on('$ionicView.enter', function() {
                    $rootScope.setTopBar('text', '编辑', topBarEdit);
                });

                function topBarEdit() { //点击编辑
                    if (!(!_.find(vm.addPoint, { type: 'home' }).point && !_.find(vm.addPoint, { type: 'company' }).point)) {
                        vm.showDelelte = true;
                        _.each(vm.addPoint, function(val) {
                            val.showDelelte = false;
                        })
                        $scope.$apply();
                        $rootScope.setTopBar('text', '完成', topBarFinish);
                    } else {
                        BpPopup.showToast('您没有设置家或公司地址');
                    }
                }

                function topBarFinish() { //点击完成
                    vm.showDelelte = false;
                    _.each(vm.addPoint, function(val) {
                        val.showDelelte = false;
                    })
                    $scope.$apply();
                    $rootScope.setTopBar('text', '编辑', topBarEdit);
                }

                $scope.$on('$ionicView.beforeEnter', function() {
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
                            vm.addShow = true;
                            // 当前接口请求出来的地址和shareData里面的地址不一致，即用户有选择其他地址需要修改地址
                            if (!_home.point && ShareDataService.data_homePoint || _home.point && ShareDataService.data_homePoint && ShareDataService.data_homePoint.displayName != _home.point.displayName) {
                                _saveHomeOrCompany('home');
                            }
                            if (!_company.point && ShareDataService.data_companyPoint || _company.point && ShareDataService.data_companyPoint && ShareDataService.data_companyPoint.displayName != _company.point.displayName) {
                                _saveHomeOrCompany('company');
                            }
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false);
                });
                // 点击跳转选地址
                vm.goToSearch = function(item) {
                    if (item.showDelelte || vm.showDelelte) {
                        item.showDelelte = false;
                        return;
                    }
                    // 如果存在当前地址，把临时城市设置成item城市，没有当前地址把临时城市设置成当前城市（当前城市没有设置成北京）
                    ShareDataService.data_tempCity = item.point ? { cityCode: item.point.cityCode, cityName: item.point.cityName } : (ShareDataService.data_curCity ? ShareDataService.data_curCity : { cityCode: '1', cityName: '北京市' });
                    ShareDataService['data_' + item.type + 'Point'] = item.point;
                    console.log('当前' + item.name + '地址：' + JSON.stringify(item.point));
                    $state.go("searchPlace", { type: item.type, from: 'address' });
                };
                // 编辑地址
                var _saveHomeOrCompany = function(type) {
                    console.log('保存' + type + "地址");
                    var _typePoint = _.find(vm.addPoint, { type: type });
                    var _params = ShareDataService['data_' + type + 'Point'];
                    _params.addressType = (type == 'home') ? '0' : '1'; //0家，1公司
                    _params.operateType = _typePoint.point ? '2' : '0'; //0增加，2更新
                    _params.userId = productNo;
                    DataService.run("manageAddressBook", _params, function(resp) {
                        console.log("[管理地址接口请求成功:保存]");
                        console.log(resp);
                        if (resp.success) {
                            BpPopup.showToast('编辑常用地址成功');
                            _.each(vm.addPoint, function(val) {
                                if (val.type == type) {
                                    val.point = ShareDataService['data_' + type + 'Point']
                                }
                            })
                        }
                    })
                };
                // 删除家或公司地址
                vm.deleteItem = function(item) {
                    item.showDelelte = false; //关闭删除按钮
                    $ionicLoading.show({
                        noBackdrop: true,
                        hideOnStateChange: true,
                        template: '删除中'
                    });
                    var _params = item.point;
                    _params.operateType = "1"; //1删除
                    _params.userId = productNo;
                    DataService.run("manageAddressBook", _params, function(resp) {
                        console.log("[管理地址接口请求成功:删除]");
                        console.log(resp);
                        $ionicLoading.hide();
                        if (resp.success) {
                            item.point = null;
                            if (!_.find(vm.addPoint, { type: 'home' }).point && !_.find(vm.addPoint, { type: 'company' }).point) {
                                vm.showDelelte = false;
                                $rootScope.setTopBar('text', '编辑', topBarEdit);
                            }
                        }
                    })
                }
            }
        ])
})();
