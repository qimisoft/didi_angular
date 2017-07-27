/**
 * 首页扩展页
 * @author Cici
 * created on 4/8/2017
 */
(function() {
    'use strict';
    //定义模块名
    var moduleName = 'indexDetail';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('indexDetail', {
                cache: false,
                url: '/indexDetail',
                views: {
                    '@': {
                        templateUrl: 'business/indexDetail/indexDetail.tpl.html',
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
            "$ionicModal",
            "$ionicPopup",
            "$ionicScrollDelegate",
            "indexDetailService",
            "ShareDataService",
            "BpPopup",
            "DataService",
            "caculateRuleService",
            function($scope, $rootScope, $state, $ionicModal, $ionicPopup, $ionicScrollDelegate, indexDetailService, ShareDataService, BpPopup, DataService, caculateRuleService) {
                var vm = $scope.vm = {};
                vm.confirmPopup = null;
                // 兼容安卓键盘弹出时页面resize
                vm.clientHeight = document.documentElement.clientHeight;
                // 页面title配置
                vm.option = {
                    title: ShareDataService.data_depatureTime ? '预约用车' : '实时用车'
                };
                // 检测用户有没用点过阅读服务协议，点过一次以后都默认打勾
                var keyOfSave = 'carUserIsNew_' + User.getProduct();
                var _carUserIsNew = localStorage.getItem(keyOfSave) ? localStorage.getItem(keyOfSave) : null;
                if (_carUserIsNew) {
                    vm.agreement = true;
                }

                $scope.onBack = function() {
                    // 返回首页时关闭弹窗，清除页面数据缓存的信息
                    vm.closeModal();
                    historySolve('clear');
                    $state.go('index', { isOrder: '1' });
                }

                vm.showKeyBords = function(type) {
                    // 输入框弹出控制
                    type == 1 ? vm.showKeyBord = true : vm.showKeyBord = false;
                    if (!(/iP(ad|hone|od)/.test(navigator.userAgent))) {
                        // 兼容安卓页面不上滚
                        $ionicScrollDelegate.$getByHandle('main-scroll').scrollBottom();
                    }
                }

                $scope.$on('$ionicView.beforeEnter', function() {

                    //页面数据缓存
                    if (ShareDataService.data_numbers) {
                        ShareDataService.data_numbers.contactPhoneNo && (vm.contactPhoneNo = ShareDataService.data_numbers.contactPhoneNo);
                        ShareDataService.data_numbers.passengerPhone && (vm.passengerPhone = ShareDataService.data_numbers.passengerPhone);
                        ShareDataService.data_numbers.isProxy && (vm.isProxy = ShareDataService.data_numbers.isProxy);
                    } else {
                        vm.isProxy = false;
                        vm.contactPhoneNo = productNo;
                    }

                    // 车型初始化
                    var ruleList = caculateRuleService.getRuleListByCityCode(ShareDataService.data_curCity.cityCode);
                    _.each(ruleList.priceRules, function(value) {
                        if (ruleList.productType == '201' && (value.rideType == '100' || value.rideType == '200' || value.rideType == '400') || ruleList.productType == '301' && value.rideType == '600' || ruleList.productType == '401') {
                            _.each(vm.carTypesList, function(val) {
                                if (val.value == value.rideType) {
                                    val.state = '2';
                                }
                            })
                        }
                    })

                    // 选中默认车型
                    if (ShareDataService.data_selectedCarType) {
                        vm.selectedCarType = ShareDataService.data_selectedCarType;
                    } else {
                        vm.selectedCarType = _.find(vm.carTypesList, { state: '2' });
                    }

                    // 页面数据有缓存存在直接赋值，没有缓存根据默认车型请求价格预估接口
                    if (ShareDataService.data_cost) {
                        vm.cost = ShareDataService.data_cost;
                    } else {
                        _getPres(vm.selectedCarType);
                    }
                })

                $scope.$on('$ionicView.beforeLeave', function() {
                    // 页面离开关闭充值弹窗
                    if (vm.confirmPopup) {
                        vm.confirmPopupClose();
                    }
                })

                //代金券初始化
                if (ShareDataService.data_vouchers) {
                    vm.vouchers = ShareDataService.data_vouchers[0];
                    vm.vouchers.voucherAmt = vm.vouchers.voucherAmt.split('.')[0];
                }

                //车型初始化
                vm.carTypesList = [{ label: '经济型', value: '600', state: '1' }, { label: '舒适型', value: '100', state: '1' }, { label: '商务型', value: '400', state: '1' }, { label: '豪华型', value: '200', state: '1' }];
                // 以下三行代码为多种车型预留
                var li_width = Math.floor(document.documentElement.clientWidth / 4);
                vm.li_width = li_width + 'px';
                vm.scroll_length = vm.carTypesList.length * li_width + 'px';

                vm.showKeyBord = false;

                // 取消时间文字显示
                vm.cancelTime = ShareDataService.data_depatureTime == null ? '司机接单1分钟后取消可能会产生违约金，请确认后取消' : '用车前1个小时内取消可能会产生违约金，请确认后取消';

                // 车型选择
                vm.chooseCarType = function(item) {
                    if (item.value != vm.selectedCarType.value) {
                        if (item.state === '2') {
                            vm.getPreAmount(item);
                        } else {
                            BpPopup.showToast('暂不支持该车型');
                        }
                    }
                }
                $ionicModal.fromTemplateUrl('cost-detail-modal.html', {
                    scope: $scope,
                }).then(function(modal) {
                    vm.modal = modal;
                });
                vm.openModel = function() {
                    vm.modal.show();
                }
                vm.closeModal = function() {
                    vm.modal.hide();
                }

                vm.confirmPopupClose = function() {
                    vm.confirmPopup.close();
                    vm.confirmPopup = null;
                }

                // 导入通讯录
                vm.openContacts = function(flag) {
                    Contacts.openContacts(function(no) {
                        if (no === '' || !no) return;
                        switch (flag) {
                            case 'passenger':
                                vm.passengerPhone = $rootScope.formatContact(no);
                                $scope.$apply();
                                break;
                            case 'contact':
                                vm.contactPhoneNo = $rootScope.formatContact(no);
                                $scope.$apply();
                                break;
                        }
                    })
                }

                // 预估价格
                var _getPres = function(item) {
                    if (!item) {
                        return;
                    }
                    var _params = {
                        flng: ShareDataService.data_startPoint.lng,
                        flat: ShareDataService.data_startPoint.lat,
                        tlng: ShareDataService.data_endPoint.lng,
                        tlat: ShareDataService.data_endPoint.lat,
                        productType: item.value === "600" ? "301" : "201",
                        cityCode: ShareDataService.data_curCity.cityCode,
                        rideType: item.value
                    }
                    if (ShareDataService.data_depatureTime != null) {
                        _params.type = "1";
                        _params.dateTime = ShareDataService.data_depatureTime;
                    } else {
                        _params.type = "0";
                    }
                    $rootScope.showLoading();
                    DataService.run("getAmtDetail", _params, function(resp) {
                        $rootScope.hideLoading();
                        console.log("[获取预估价格明细成功]");
                        console.log(resp);
                        if (resp.success) {
                            vm.selectedCarType = item;
                            vm.cost = resp.result;
                        } else {
                            BpPopup.showToast(resp.errorMsg);
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false)
                }

                // 预估价格
                vm.getPreAmount = function(item) {
                    _getPres(item);
                }

                // 判断下单条件
                var _solveParams = function() {
                    if (!vm.agreement) {
                        BpPopup.showToast('请先同意代扣服务协议');
                        return false;
                    }
                    if (!indexDetailService.checkPhoneNo(vm.contactPhoneNo, '联系电话')) {
                        return false;
                    }
                    if (vm.isProxy) {
                        return indexDetailService.checkPhoneNo(vm.passengerPhone, '乘车人电话');
                    } else {
                        return true;
                    }
                }

                // 输密码
                vm.checkPay = function() {
                    if (!_solveParams()) {
                        return;
                    }
                    if (!_carUserIsNew) {
                        localStorage.setItem(keyOfSave, '1');
                    }
                    App.openSafeKeyBoard(6, "支付密码", function(pass) {
                        vm.goToPay(pass);
                    })
                }

                // 预约打车
                vm.goToPay = function(pass) {
                    var _params = {
                        servicePrice: vm.cost.servicePrice,
                        dynamicPrice: vm.cost.dynamicPrice,
                        startPrice: vm.cost.startPrice,
                        guarantee: vm.cost.guarantee,
                        price: vm.cost.price,
                        otherPrice: vm.cost.otherPrice,
                        tripPrice: vm.cost.tripPrice,
                        durationPrice: vm.cost.durationPrice,
                        duration: vm.cost.duration,
                        trip: vm.cost.trip, //以上参数为调整价格明细 add on 5/17/2017
                        smsPolicy: '3', //发短信策略，add on 5/10/2017
                        passWord: pass,
                        estimateAmt: vm.cost.price,
                        productType: vm.selectedCarType.value === "600" ? "301" : "201",
                        type: "0",
                        contactPhoneNo: vm.contactPhoneNo,
                        fcityCode: ShareDataService.data_curCity.cityCode,
                        flng: ShareDataService.data_startPoint.lng,
                        flat: ShareDataService.data_startPoint.lat,
                        startName: ShareDataService.data_startPoint.displayName,
                        startAddress: ShareDataService.data_startPoint.address,
                        tlng: ShareDataService.data_endPoint.lng,
                        tlat: ShareDataService.data_endPoint.lat,
                        endName: ShareDataService.data_endPoint.displayName,
                        endAddress: ShareDataService.data_endPoint.address,
                        rideType: vm.selectedCarType.value,
                        appTime: $rootScope.dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss"),
                        dynamicMd5: vm.cost.dynamicMd5,
                        estimateTime: vm.cost.duration * 1000 + '', //红灯说的
                        bizType: 'DC001',
                        bizTypeName: '客户端即时打车'
                    }
                    if (ShareDataService.data_depatureTime != null) {
                        _params.type = "1";
                        _params.departureTime = ShareDataService.data_depatureTime;
                        _params.bizType = 'DC002';
                        _params.bizTypeName = '客户端预约用车';
                    }

                    // 乘车人电话没填传联系人电话，填了传乘车人电话
                    _params.passengerPhone = vm.isProxy ? vm.passengerPhone : vm.contactPhoneNo;

                    // 参数加密
                    _params.sign = MessageDigest.digest('md5', '' + _params.estimateAmt + _params.productType + _params.type + _params.passengerPhone + _params.rideType + _params.appTime + $rootScope.key);
                    $rootScope.showLoading();
                    DataService.run("bookCar", _params, function(resp) {
                        console.log("[预约打车成功]");
                        console.log(resp);
                        $rootScope.hideLoading();
                        // resp.success = false;
                        // resp.errorCode = 'AM0001';
                        if (resp.success) {
                            // 打车成功后清空预约时间，清空数据缓存
                            historySolve('clear');
                            ShareDataService.data_depatureTime = null;
                            $state.go('waitAnswer', { orderNo: resp.result.orderNo });
                        } else if (resp.errorCode == 'AM0001') {
                            vm.confirmPopup = $ionicPopup.confirm({
                                cancelText: '取消',
                                okText: '去充值',
                                title: '可提现余额不足' + (vm.cost.guarantee / 100).toFixed(2) + '元，请充值后再试',
                            })
                            vm.confirmPopup.then(function(res) {
                                if (res) {
                                    App.jumpToNView("04", {}, function() {}, function() {}, function() {});
                                }
                            })
                        } else {
                            BpPopup.showToast(resp.errorMsg);
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false, false, true);
                }

                vm.confirmPopupClose = function() {
                    vm.confirmPopup.close();
                    vm.confirmPopup = null;
                }

                // 跳转到计价规则
                vm.goToRule = function() {
                    $state.go('caculateRule');
                    historySolve('save');
                }

                // 跳转到服务协议
                vm.goToAgentCharge = function() {
                    $state.go('agentCharge');
                    historySolve('save');
                }

                // 数据缓存
                var historySolve = function(method) {
                    if (method == 'save') {
                        ShareDataService.data_cost = vm.cost;
                        ShareDataService.data_selectedCarType = vm.selectedCarType;
                        ShareDataService.data_numbers = { contactPhoneNo: vm.contactPhoneNo, passengerPhone: vm.passengerPhone, isProxy: vm.isProxy };
                    } else {
                        ShareDataService.data_selectedCarType = null;
                        ShareDataService.data_numbers = null;
                        ShareDataService.data_cost = null;
                    }
                }
            }
        ])
})();
