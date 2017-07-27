/**
 * 首页
 * @author Cici
 * created on 4/1/2017
 * 首页初始化逻辑说明：
 *    首次进入-->定位|--->定位成功-->根据定位得到的经纬度得到当前城市id（获取失败==定位失败）
 *                 |           -->加载城市列表得到当前城市名（加载失败提示初始化城市出错）
 *                 |           -->拿当前城市id去城市列表中找到该城市的名称（找不到弹框当前定位城市不支持，引导到城市页自行选择城市）
 *                 |           -->根据当前城市初始化计价规则，得到当前城市支持的车型
 *                 |           -->初始化完毕
 *                 |--->定位失败-->提示用户手动选择地址-->初始化完毕
 *    非首次进入（isOrder==1）-->根据当前城市初始化计价规则
 *                          -->如果起点和终点都有，而且起点不等于终点-->请求估价接口
 *                          -->初始化完毕
 */
(function() {
    'use strict';
    //定义模块名
    var moduleName = 'Main';
    var controllerName = moduleName + 'Ctrl';

    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('index', {
                cache: false,
                url: '/index?:isOrder',
                views: {
                    '@': {
                        templateUrl: 'business/main/main.tpl.html',
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
            "$ionicPopup",
            "$ionicSlideBoxDelegate",
            "$ionicSideMenuDelegate",
            "$ionicModal",
            "MainService",
            "TimeService",
            "ShareDataService",
            "aMapService",
            "BpPopup",
            "DataService",
            "cityService",
            "caculateRuleService",
            "TD",
            "$interval",
            "$timeout",
            function($scope, $rootScope, $state, $stateParams, $ionicPopup, $ionicSlideBoxDelegate, $ionicSideMenuDelegate, $ionicModal, MainService, TimeService, ShareDataService, aMapService, BpPopup, DataService, cityService, caculateRuleService, TD, $interval, $timeout) {
                var vm = $scope.vm = {};
                var keyOfSave = 'carUserIsNew_' + User.getProduct();
                var _carUserIsNew = localStorage.getItem(keyOfSave) ? localStorage.getItem(keyOfSave) : null;
                $scope.onBack = function() {
                    App.exitApp();
                }

                $scope.$on('$ionicView.beforeLeave', function() {
                    // 离开页面时关闭弹框
                    vm.confirmPopupClose();
                    $interval.cancel(vm.freshStartPointTimer);
                });

                $scope.$on('$ionicView.enter', function() {
                    App.setTitle("滴滴出行");
                });

                $scope.$on('$ionicView.beforeEnter', function() {

                    // 电话缓存
                    if (ShareDataService.data_passengerPhone) {
                        vm.passengerPhone = ShareDataService.data_passengerPhone;
                    } else {
                        vm.passengerPhone = productNo;
                    }

                    // 检测用户有没用点过阅读服务协议，点过一次以后都默认打勾
                    if (_carUserIsNew || ShareDataService.data_agreement) {
                        vm.agreement = true;
                    }

                    // 查询代金券
                    if (!ShareDataService.data_vouchers) {
                        _getCoupon();
                    } else {
                        vm.vouchers = ShareDataService.data_vouchers;
                    }

                    //查询未完成订单
                    MainService.getOrdering(vm, $scope);

                    vm.freshStartPoint = function() {

                        // 设置定时器，如果乘客位置改变，刷新出发地       add by microcosm 2017/06/05
                        /*四川北路61号 121.48474，31.24542   淮海中路918号 121.4592,31.21745  南京东路353号 121.48491,31.23761
                         华宏国际大厦 腾讯高德：121.48632，31.24811
                         刷新逻辑：进入首页，出发地没有被用户更改过，如果更改过，不再刷新
                         * */
                        vm.freshStartPointTimer = $interval(function() {
                            var oldStartPoint = vm.startPoint;
                            console.log("oldStartPoint2222:" + JSON.stringify(oldStartPoint));
                            //ShareDataService.data_startPoint 为 undefined的时候为首次进入，需要做刷新处理
                            if (ShareDataService.data_startPoint && ShareDataService.data_LBSPoint && (ShareDataService.data_startPoint.displayName != ShareDataService.data_LBSPoint.displayName)) {
                                $interval.cancel(vm.freshStartPointTimer);
                                return;
                            }
                            if (!vm.endPoint && oldStartPoint) { //如果终点没有值并且首页定位已经成功
                                aMapService.getDistance([oldStartPoint.lng, oldStartPoint.lat], function(point) {
                                    console.log("getDistance point:" + JSON.stringify(point));
                                    /*  point.lng = "121.48632";
                                      point.lat = "31.24811";
                                      point.displayName = "华宏国际大厦-" + point.distance;
                                      point.distance = "101";*/
                                    if (point.distance > 100) { //重新定位的位置距离起点超过100米
                                        vm.startPoint.displayName = point.displayName;
                                        ShareDataService.data_curCity = _.find(cityService.getCityList(), { cityName: point.cityName });
                                        ShareDataService.data_startPoint = point; //更新shareDataService里的startpoint
                                        //ShareDataService.data_endPoint = null;//清空目的地
                                        ShareDataService.data_LBSPoint = point;
                                        //vm.endPoint = ShareDataService.data_endPoint;
                                        //vm.showDetail = false;//隐藏详情
                                    }
                                });
                            }
                        }, 2 * 60 * 1000);
                    };

                    // 获取大厅定位,定位成功判断当前城市是否支持嘀嘀打车，
                    // 如果不支持弹出弹窗让用户自己选择城市，
                    // 如果支持请求计价规则来初始化车型
                    // 定位失败默认城市为北京
                    vm.isLBSing = false; //重新获取大厅定位
                    if (!ShareDataService.data_startPoint && !ShareDataService.data_endPoint && !$stateParams.isOrder) {
                        if (!ShareDataService.data_LBSPoint) {
                            vm.isLBSing = true; //重新获取大厅定位
                            aMapService.getLBS(function(point, city) {
                                // point = false, city = false;
                                if (!point) {
                                    BpPopup.showToast('定位失败，请手动选择地址');
                                }
                                ShareDataService.data_LBSPoint = point;
                                ShareDataService.data_curCity = city;
                                vm.isLBSing = false;
                                vm.startPoint = point;
                                preGetCityList(); //预加载城市列表，判断当前定位城市是否支持嘀嘀打车
                            });
                        } else {
                            vm.startPoint = ShareDataService.data_LBSPoint;
                            _getPriceRule(); // 初始化计价规则
                        }
                    } else {
                        // 出发点，到达点显示
                        vm.startPoint = ShareDataService.data_startPoint ? ShareDataService.data_startPoint : (ShareDataService.data_endPoint ? null : ((ShareDataService.data_LBSPoint && ShareDataService.data_curCity.cityName == ShareDataService.data_LBSPoint.cityName) ? ShareDataService.data_LBSPoint : null));
                        vm.endPoint = ShareDataService.data_endPoint ? ShareDataService.data_endPoint : null;

                        _getPriceRule(); // 初始化计价规则

                        if (ShareDataService.data_startPoint && ShareDataService.data_endPoint && ShareDataService.data_startPoint.displayName != ShareDataService.data_endPoint.displayName) {
                            // 如果起点和终点都有，而且起点不等于终点
                            if (ShareDataService.data_cost) {
                                // 如果存在缓存数据
                                vm.cost = ShareDataService.data_cost;
                                vm.agreement = ShareDataService.data_agreement;
                                vm.showDetail = true;
                            } else {
                                _getPres(vm.selectedCarType)
                            }
                        } else if (ShareDataService.data_startPoint && ShareDataService.data_endPoint && ShareDataService.data_startPoint.displayName == ShareDataService.data_endPoint.displayName) {
                            // 如果起点等于终点
                            BpPopup.showToast('出发地址和到达地址不能相同');
                        }
                    }
                })

                //车型初始化
                vm.carTypesList = [{ label: '快车', value: '600', state: '1' }, { label: '舒适型', value: '100', state: '1' }, { label: '六座型', value: '400', state: '1' }, { label: '豪华型', value: '200', state: '1' }];
                vm.selectedCarType = { label: '快车', value: '600', state: '2' };
                vm.showKeyBord = false;

                // 取消时间文字显示
                vm.cancelTime = ShareDataService.data_depatureTime == null ? '司机接单1分钟后取消可能会产生违约金，请确认后取消' : '用车前1个小时内取消可能会产生违约金，请确认后取消';

                // 车型选择
                vm.chooseCarType = function(item) {
                    if (item.value === "600") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0001", "滴滴出行_首页_点击快车用车");
                    } else if (item.value === "100") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0002", "滴滴出行_首页_点击舒适型用车");
                    } else if (item.value === "400") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0003", "滴滴出行_首页_点击六座型用车");
                    } else if (item.value === "200") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0004", "滴滴出行_首页_点击豪华型用车");
                    }
                    if (item.value != vm.selectedCarType.value) {
                        if (item.state === '2') {
                            if (vm.showDetail) {
                                _getPres(item);
                            } else {
                                vm.selectedCarType = item;
                                ShareDataService.data_selectedCarType = vm.selectedCarType;
                            }
                        } else {
                            BpPopup.showToast('暂不支持该车型');
                        }
                    }
                }

                // 费用明细modal
                $ionicModal.fromTemplateUrl('business/main/cost-detail-modal.html', {
                    scope: $scope
                }).then(function(modal) {
                    vm.modal = modal;
                });
                vm.openModel = function() {
                    TD.TalkingData.onEventWithLabel("ddcx_0001_0018", "滴滴出行_首页_点击预估费用明细");
                    vm.modal.show();
                }
                vm.closeModal = function() {
                    vm.modal.hide();
                }

                // 时间选择器，vm.timePicker.valueData为格式化的出发时间
                vm.timePicker = {
                    backdrop: true,
                    backdropClickToClose: true,
                    valueData: ShareDataService.data_depatureTime ? ShareDataService.data_depatureTime.replace(/(-)/g, '/') : null,
                    buttonClicked: function() {
                        if (vm.timePicker.valueData != ShareDataService.data_depatureTime) {
                            vm.showDetail && _getPres(vm.selectedCarType);
                        }
                        ShareDataService.data_depatureTime = vm.timePicker.valueData;
                    }
                }

                // sliDe_box
                DataService.run("adList", { adType: "17" }, function(resp) {
                    console.log("[Banner list]");
                    console.log(resp);
                    var resp_result = resp.result.adList;
                    if (resp_result != null && resp_result != "") {
                        vm.adrResult = true;
                        // 处理两个的情况
                        if (resp_result.length == 2) {
                            vm.showPagerTwo = true;
                            vm.sliderPagerTwo = 1;
                            resp_result[2] = resp_result[0];
                            resp_result[3] = resp_result[1];
                        }
                        vm.slides = resp_result;
                        $ionicSlideBoxDelegate.update();
                        vm.openWeb = function(url, action, title) {
                            TD.TalkingData.onEventWithLabel("ddcx_0001_0009", "滴滴出行_首页_点击banner_" + title);
                            if (action == "03") {
                                App.openBrowser(url, false);
                            }
                        }
                    } else {
                        vm.adrResult = false;
                    }
                }, function(err) {
                    console.log(err);
                }, null, false);
                vm.slideHasChanged = function(index) {
                    vm.showPagerTwo && (vm.sliderPagerTwo = (index + 1) % 2);
                }

                // 侧边栏滑出关闭
                vm.sideMenuShow = function() {
                    TD.TalkingData.onEventWithLabel("ddcx_0001_0005", "滴滴出行_首页_点击个人中心");
                    $ionicSideMenuDelegate.toggleLeft(true);
                    vm.isMasker = true;
                };
                vm.sideMenuHide = function() {
                    $ionicSideMenuDelegate.toggleLeft(false);
                    vm.isMasker = false;
                };

                //更改乘客
                vm.showPassenger = function(flag) {
                    TD.TalkingData.onEventWithLabel("ddcx_0006_0016", "滴滴出行_首页_点击输入乘车人电话");
                    MainService.showPassenger(vm, $scope, flag);
                }

                // 查询代金券
                var _getCoupon = function() {
                    DataService.run('getVoucherInfo', { timeout: null }, function(data) {
                        console.log('[查询代金券成功]');
                        console.log(data);
                        if (data.success && data.result.vouchers.length != 0) {
                            vm.vouchers = data.result.vouchers;
                            ShareDataService.data_vouchers = data.result.vouchers;
                        }
                    }, null, null, false, false)
                }

                vm.confirmPopupClose = function() {
                    if (MainService.confirmPopup) {
                        MainService.confirmPopup.close();
                    }
                }

                // 切换地址
                vm.switch = function() {
                    TD.TalkingData.onEventWithLabel("ddcx_0001_0012", "滴滴出行_首页_点击切换地点按钮 ");
                    var temp = vm.endPoint;
                    vm.endPoint = vm.startPoint;
                    vm.startPoint = temp;
                    (vm.showDetail || ShareDataService.data_startPoint && ShareDataService.data_endPoint) && _getPres(vm.selectedCarType);
                }

                // 地址查询
                vm.goToSearch = function(type) {
                    //重新获取大厅定位
                    if (vm.isLBSing) {
                        BpPopup.showToast('定位中，请稍后');
                        return;
                    }

                    // 清除数据缓存
                    historySolve('clear');

                    // 保存起止点
                    ShareDataService.data_startPoint = vm.startPoint;
                    ShareDataService.data_endPoint = vm.endPoint;
                    console.log('出发地：' + JSON.stringify(ShareDataService.data_startPoint) + '到达地：' + JSON.stringify(ShareDataService.data_endPoint))
                    if (type == 'start' && !(!vm.startPoint && vm.endPoint)) {
                        $state.go("startPoint");
                    } else {
                        $state.go("searchPlace", { type: type });
                    }
                }

                //预加载城市列表，并选中当前定位城市
                var preGetCityList = function() {
                    cityService.initalCityList().then(function(data) {
                        var all_cities = cityService.getCityList();
                        if (all_cities) {
                            if (ShareDataService.data_curCity) {
                                // 定位成功，检测当前城市是否支持嘀嘀打车
                                var cur_city = _.find(all_cities, { cityCode: ShareDataService.data_curCity.cityCode });
                                // cur_city = null;
                                if (cur_city) {
                                    ShareDataService.data_curCity = cur_city;
                                    vm.startPoint.cityCode = cur_city.cityCode;
                                    vm.startPoint.cityName = cur_city.cityName;
                                    ShareDataService.data_LBSPoint.cityName = cur_city.cityName;
                                    ShareDataService.data_LBSPoint.cityCode = cur_city.cityCode;
                                    console.log('城市转换完成，当前城市');
                                    console.log(ShareDataService.data_curCity);
                                    _getPriceRule(); // 初始化计价规则
                                } else {
                                    $ionicPopup.alert({
                                        title: '当前定位城市，暂无滴滴出行服务，请选择其他城市',
                                        okText: '确定'
                                    }).then(function(res) {
                                        ShareDataService.data_curCity = null;
                                        $state.go('city');
                                    })
                                }
                            } else {
                                // 定位失败
                                ShareDataService.data_curCity = { cityName: '北京市', cityCode: '1' };
                                _getPriceRule(); // 初始化计价规则
                            }
                        } else {
                            // 接口请求不到信息
                            BpPopup.showToast('初始化城市出错');
                        }
                    })
                }

                // 初始化计价规则,主要是车型显示问题
                var _getPriceRule = function() {
                    var ruleList = caculateRuleService.getRuleListByCityCode(ShareDataService.data_curCity.cityCode);
                    if (!ruleList) {
                        caculateRuleService.initRuleList(ShareDataService.data_curCity.cityCode, '401').then(function(data) {
                            ruleList = caculateRuleService.getRuleListByCityCode(ShareDataService.data_curCity.cityCode);
                            chooseSelectedCarType();
                        })
                    } else {
                        chooseSelectedCarType();
                    }

                    function chooseSelectedCarType() {
                        _.each(ruleList.priceRules, function(value) {
                            //翼支付配置车型，滴滴支持车型
                            // ruleList.productType='201'
                            if (ruleList.productType == '201' && (value.rideType == '100' || value.rideType == '200' || value.rideType == '400') || ruleList.productType == '301' && value.rideType == '600' || ruleList.productType == '401') {
                                _.each(vm.carTypesList, function(val) {
                                    if (val.value == value.rideType) {
                                        val.state = '2';
                                    }
                                })
                            }
                        })

                        // 选中默认车型,有车型缓存读车型缓存
                        if (ShareDataService.data_selectedCarType) {
                            vm.selectedCarType = ShareDataService.data_selectedCarType;
                        } else {
                            if (_.find(vm.carTypesList, { state: '2' })) {
                                // 有支持车型默认选中第一个
                                vm.selectedCarType = _.find(vm.carTypesList, { state: '2' });
                                ShareDataService.data_selectedCarType = vm.selectedCarType;
                            } else {
                                // 没有可以选择的车型（翼支付配置+滴滴支持）
                                BpPopup.showToast('您所在城市不支持打车服务');
                            }
                        }
                    }
                }

                // 预估价格
                var _getPres = function(item) {
                    if (!item) {
                        return;
                    }
                    var _params = {
                        flng: vm.startPoint.lng,
                        flat: vm.startPoint.lat,
                        tlng: vm.endPoint.lng,
                        tlat: vm.endPoint.lat,
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
                            ShareDataService.data_selectedCarType = vm.selectedCarType;
                            vm.cost = resp.result;
                            vm.showDetail = true;
                        } else {
                            BpPopup.showToast(resp.errorMsg);
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false)
                }
                vm.getPres = function() {
                    _getPres(ShareDataService.data_selectedCarType);
                }

                // 判断下单条件
                var _solveParams = function() {
                    if (vm.cost.guarantee > 100000) {
                        BpPopup.showToast('暂不支持1000元以上行程');
                        return false;
                    }
                    if (!vm.agreement) {
                        BpPopup.showToast('请先同意代扣服务协议');
                        return false;
                    }

                    if (!vm.passengerPhone) {
                        BpPopup.showToast('请填写乘车人电话');
                        return false;
                    }

                    if (vm.hasOrdering && (vm.hasOrdering.orderState === '02' || vm.hasOrdering.orderState === '03') && vm.timePicker.valueData == null) {
                        // 如果有正在进行中的订单不能点击进入
                        MainService.showOrdering(vm, $scope);
                        return false;
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
                    });
                }

                // 预约打车
                vm.goToPay = function(pass) {
                    TD.TalkingData.onEventWithLabel("ddcx_0001_0019", "滴滴出行_首页_点击去打车"); //请求接口bookCar,无论成功与否
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
                        passengerPhone: vm.passengerPhone,
                        contactPhoneNo: vm.passengerPhone, //contactPhoneNo=passengerPhone必传用户所填乘车人号码，06/01/2017来自李浩
                        fcityCode: ShareDataService.data_curCity.cityCode,
                        flng: vm.startPoint.lng,
                        flat: vm.startPoint.lat,
                        startName: vm.startPoint.displayName,
                        startAddress: (vm.startPoint.address && vm.startPoint.address != '') ? vm.startPoint.address : vm.startPoint.displayName,
                        tlng: vm.endPoint.lng,
                        tlat: vm.endPoint.lat,
                        endName: vm.endPoint.displayName,
                        endAddress: (vm.endPoint.address && vm.endPoint.address != '') ? vm.endPoint.address : vm.endPoint.displayName,
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
                            // 保存历史记录
                            _saveHistoryInLocal(vm.startPoint, vm.endPoint);
                            // 跳转
                            $state.go('waitAnswer', { orderNo: resp.result.orderNo });
                        } else if (resp.errorCode == 'AM0001') {
                            MainService.showToCharge(vm, $scope);
                        } else if (resp.errorCode == 'ORD012') { //弹价格刷新窗口
                            MainService.amtChange(vm, $scope);
                        } else if (resp.errorCode == 'FK0004') { //非三星用户
                            MainService.authorityAlert(vm, $scope, resp.errorMsg);
                        } else if (resp.errorCode == 'AM0006') {
                            BpPopup.showToast('年消费额度超限');
                        } else {
                            BpPopup.showToast(resp.errorMsg);
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false, false, true);
                }

                // 保存历史信息
                var _saveHistoryInLocal = function(startPoint, endPoint) {
                    var keyOfSave = 'carAddressHistory_' + User.getProduct();
                    var _tmpHistory = localStorage.getItem(keyOfSave) ? JSON.parse(localStorage.getItem(keyOfSave)) : {};
                    _tmpHistory = _.toArray(_tmpHistory);
                    if (!_.find(_tmpHistory, { displayName: startPoint.displayName })) {
                        _tmpHistory.unshift(startPoint);
                    }
                    if (!_.find(_tmpHistory, { displayName: endPoint.displayName })) {
                        _tmpHistory.unshift(endPoint);
                    }
                    if (_tmpHistory.length > 6) {
                        _tmpHistory = _tmpHistory.slice(0, 5);
                    }
                    localStorage.setItem(keyOfSave, JSON.stringify(_tmpHistory));
                }

                // 导航我的账户
                vm.productNo = productNo.substr(0, 3) + '*****' + productNo.substr(8, 3);
                // 导航跳转
                vm.goToIndex = function(guide) {

                    // 进行数据缓存
                    historySolve('save');

                    if (guide === "order") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0006", "滴滴出行_首页_点击行程");
                    } else if (guide === "spec") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0007", "滴滴出行_首页_点击服务");
                    } else if (guide === "agreement") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0008", "滴滴出行_首页_点击协议");
                    } else if (guide === "agentCharge") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0017", "滴滴出行_首页_点击代扣服务协议");
                    } else if (guide === "caculateRule") {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0022", "滴滴出行_首页_明细_点击计价规则");
                    }

                    // 关闭modal
                    vm.closeModal();
                    $state.go(guide);
                }

                // 数据缓存
                var historySolve = function(method) {
                    if (method == 'save') {
                        ShareDataService.data_cost = vm.cost;
                        ShareDataService.data_agreement = vm.agreement;
                    } else {
                        ShareDataService.data_agreement = false;
                        ShareDataService.data_cost = null;
                    }
                }
            }
        ])
})();
