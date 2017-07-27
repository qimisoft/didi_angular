(function() {
    'use strict';
    //定义模块名
    var moduleName = 'orderDetail';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('orderDetail', {
                cache: false,
                url: '/orderDetail?orderNo',
                views: {
                    '@': {
                        templateUrl: 'business/order/orderDetail.tpl.html',
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
            "OrderService",
            "ShareDataService",
            "BpPopup",
            "$stateParams",
            "DataService",
            "caculateRuleService",
            "$ionicModal",
            "$timeout",
            "TD",
            "cityService",
            "MainService",
            "aMapService",
            function($scope, $rootScope, $state, $location, $ionicHistory, OrderService, ShareDataService, BpPopup, $stateParams, dataService, caculateRuleService, $ionicModal, $timeout, TD, cityService, MainService, aMapService) {
                console.log("order: " + JSON.stringify(ShareDataService.myOrder));
                var order = null;
                var lastAmtState = null;
                var ruleList;
                var vm = $scope.vm = {};
                vm.handleBtnShow = false;
                vm.hasHandleBtn = true;
                var pageWithOutCloseBtn = ['08', '09'] // 没有上拉按钮的订单
                var needRefreshPage = ['07']; // 需要刷新订单的状态
                var needRefreshCar = ['02', '03']; // 需要小汽车位置的状态
                var pageTime = 60000; // 定时刷新页面间隔时间
                var carTime = 10000; // 定时刷新小汽车位置时间
                var amap = null;
                var dealWithReorder = function(order) {
                    var _city = _.find(cityService.getCityList(), { cityCode: order.cityCode })
                    ShareDataService.data_startPoint = { displayName: order.startName, lng: order.flng, lat: order.flat, cityCode: order.cityCode, cityName: _city.cityName };
                    ShareDataService.data_endPoint = { displayName: order.endName, lng: order.tlng, lat: order.tlat, cityCode: order.cityCode, cityName: _city.cityName };
                    ShareDataService.data_curCity = { cityCode: order.cityCode, cityName: _city.cityName };
                    // 重启计价规则
                    !caculateRuleService.getRuleListByCityCode(order.cityCode) && caculateRuleService.initRuleList(order.cityCode, '401');
                    ShareDataService.data_selectedCarType = null;
                    ShareDataService.data_agreement = false;
                    ShareDataService.data_cost = null;
                    $state.go('index', { isOrder: '1' });
                }
                vm.showDetail = function() {
                    vm.handleBtnShow = !vm.handleBtnShow;
                }
                var _rightBarClick = function() {
                    $scope.goto('help');
                };
                $scope.$on('$ionicView.enter', function() {
                    console.log('[ view life ] homeCtrl $ionicView.enter');
                    //设置标题
                    $rootScope.setTopBar('text', '帮助', _rightBarClick);
                });

                $scope.$on('$ionicView.beforeLeave', function(ev, data) {
                    $scope.priceDetail = null;
                    $scope.modal.hide();
                    $timeout.cancel($scope.timerPage);
                    $timeout.cancel($scope.timerCar);
                    // 页面离开关弹窗
                    MainService.confirmPopup && MainService.confirmPopup.close();
                });
                $scope.onBack = function() {
                    $state.go("order");
                };
                $ionicModal.fromTemplateUrl('business/order/orderCostDetail.tpl.html', {
                    scope: $scope
                }).then(function(modal) {
                    $scope.modal = modal;
                });
                $scope.initMap = function(orderState) {
                    amap = new AMap.Map('amap-order', {
                        resizeEnable: true,
                        zoom: 13,
                        center: [order.flng, order.flat]
                    });
                    //添加起点坐标点
                    aMapService.addMarker({ type: 'start', position: [order.flng, order.flat], map: amap });
                    //添加终点坐标点
                    aMapService.addMarker({ type: 'end', position: [order.tlng, order.tlat], map: amap });
                    // 需要的展示小汽车
                    if (needRefreshCar.indexOf(orderState) > -1) {
                        $scope.carMarker = aMapService.addMarker({ type: 'car', map: amap });
                        AMap.service('AMap.Driving', function() {
                            $scope.drivingLine = new AMap.Driving({
                                map: amap,
                                panel: "panel",
                                hideMarkers: true
                            });
                        });
                    }
                };

                if ($stateParams.orderNo) {
                    loadOrder($stateParams.orderNo, true);
                } else {
                    order = ShareDataService.myOrder;
                    buildOrder(order);
                }

                // 加载行程详情（需调用接口）
                function loadOrder(orderNo, isShowLoading) {
                    dataService.run("queryOrderList", { orderNo: orderNo }, function(resp) {
                        console.log("[queryOrderList result]:" + JSON.stringify(resp));
                        if (!resp.success) {
                            BpPopup.showToast(resp.errorMsg);
                            if (!order) {
                                $state.go("order");
                            }
                            return;
                        }
                        order = resp.result.orders[0];
                        buildOrder(order);
                    }, function(err) {
                        console.log(err);
                        if (!order) {
                            $state.go("order");
                        }
                        return;
                    }, null, false, isShowLoading)
                }
                // 刷新行程详情
                function refreshOrder(orderNo) {
                    $timeout.cancel($scope.timerPage);
                    $scope.timerPage = $timeout(function() {
                        loadOrder(orderNo, false);
                    }, pageTime);
                }
                // 刷新小汽车位置
                function queryState(orderNo) {
                    $timeout.cancel($scope.timerCar);
                    $scope.timerCar = $timeout(function() {
                        consoleOrderState(orderNo);
                    }, carTime);
                }

                function consoleOrderState(orderNo) {
                    dataService.run("queryOrderState", { orderNo: orderNo }, function(resp) {
                        console.log("[-----订单实时状态结果]");
                        console.log(JSON.stringify(resp));
                        if (resp.success) {
                            $scope.curOrder = resp.result;
                            var curPoi = [$scope.curOrder.dlng + '', $scope.curOrder.dlat + ''];
                            if ($scope.curOrder.orderState != $scope.order.orderState) {
                                $scope.carDis = null;
                                loadOrder(orderNo, false);
                            } else if ($scope.curOrder.orderState == '02' || $scope.curOrder.orderState == '03') {
                                // 改变小汽车位置
                                ($scope.curOrder.dlng && $scope.curOrder.dlat && $scope.curOrder.dlat != '0.0') && ($scope.carMarker.setPosition(curPoi));
                                // 已上车划线
                                if ($scope.curOrder.orderState == '03') {
                                    if ($scope.curOrder.dlng && $scope.curOrder.dlat && $scope.curOrder.dlat != '0.0') {
                                        $scope.drivingLine.search(curPoi, [$scope.order.tlng, $scope.order.tlat]);
                                    } else {
                                        $scope.drivingLine.search([$scope.order.flng, $scope.order.flat], [$scope.order.tlng, $scope.order.tlat])
                                    }
                                }
                                // 距离时间的显示
                                (!$scope.carDis) && ($scope.carDis = {});
                                OrderService.formatDistance($scope);
                                queryState(orderNo);
                            } else {
                                $scope.carDis = null;
                                loadOrder(orderNo, false);
                            }
                        } else {
                            BpPopup.showToast(resp.errorMsg);
                            queryState(orderNo);
                        }
                    }, function(err) {
                        console.log(err);
                        queryState(orderNo);
                    }, null, false);
                }

                // 整理一下order数据内容
                function buildOrder(order) {
                    order = OrderService.formatOrder(order);
                    if (lastAmtState && lastAmtState != order.amtState) {
                        $scope.priceDetail = null;
                        $scope.modal.hide();
                    }
                    lastAmtState = order.amtState;
                    if (order.orderState == "02") {
                        caculateRuleService.initRuleList(order.cityCode, order.productType || "401")
                            .then(function(data) {
                                var type = order.type; //订单类型 0:实时单 1:预付单
                                var time;
                                ruleList = caculateRuleService.getRuleListByType(order.cityCode, order.rideType || "200");
                                console.log("计价规则返回参数类型是====" + JSON.stringify(ruleList.priceRule));
                                if (type == 0 && ruleList.priceRule.cancelRealTime) { //实时单
                                    time = new Date((new Date((order.striveTime || order.orderTime).replace(/\-/g, "\/"))).getTime() + parseInt(ruleList.priceRule.cancelRealTime * 60000, 10));
                                    vm.time = $rootScope.dateFormat(time, "yyyy年MM月dd日hh:mm");
                                } else if (type == 1 && ruleList.priceRule.cancelBookTime) {
                                    time = new Date((new Date(order.departureTime.replace(/\-/g, "\/"))).getTime() - parseInt(ruleList.priceRule.cancelBookTime * 60000, 10)); //出发时间
                                    vm.time = $rootScope.dateFormat(time, "yyyy年MM月dd日hh:mm");
                                } else {
                                    time = type == 0 ? (new Date((order.striveTime || order.orderTime).replace(/\-/g, "\/"))).getTime() : (new Date(order.departureTime.replace(/\-/g, "\/"))).getTime();
                                    vm.time = $rootScope.dateFormat(new Date(time), "yyyy年MM月dd日hh:mm");
                                }
                                vm.penalty = type == 0 ? ruleList.priceRule.cancelRealMoney : ruleList.priceRule.cancelBookMoney; //违约金
                                if (vm.penalty <= 0) {
                                    vm.penalty = false;
                                    vm.priceRuleTxt = type == 0 ? "司机接单1分钟后取消可能会产生违约金，请确认后取消" : "用车前1个小时内取消可能会产生违约金，请确认后取消";
                                } else {
                                    vm.penalty = (vm.penalty / 100).toFixed(2);
                                }
                            });
                    }
                    if (!order.driverComment) {
                        order.isRemark = false;
                    } else {
                        order.isRemark = true;
                    }
                    $scope.optionsShow = {};
                    switch (order.orderState) {
                        case '02': // 司机已接单
                            $scope.optionsShow.remark = false;
                            $scope.optionsShow.again = false;
                            $scope.optionsShow.cancel = true;
                            break;
                        case '03': // 服务中页面
                            $scope.optionsShow.remark = false;
                            $scope.optionsShow.again = false;
                            $scope.optionsShow.cancel = false;
                            break;
                        case '08': // 代扣失败
                        case '09': // 部分代扣成功
                            $scope.optionsShow.remark = false;
                            $scope.optionsShow.again = false;
                            $scope.optionsShow.cancel = false;
                            break;
                        case '07': // 代扣中
                            $scope.optionsShow.remark = true;
                            $scope.optionsShow.again = true;
                            $scope.optionsShow.cancel = false;
                            break;
                        case '10': // 已完成
                            $scope.optionsShow.remark = true;
                            $scope.optionsShow.again = true;
                            $scope.optionsShow.cancel = false;
                            break;
                        case '04': // 取消行程，代扣中
                        case '05': // 已取消行程
                        case '06': // 已关闭
                            $scope.optionsShow.remark = false;
                            $scope.optionsShow.again = true;
                            $scope.optionsShow.cancel = false;
                            break;
                    }

                    $scope.initMap(order.orderState); //初始化地图

                    if (order.orderState == '08') {
                        order.btnTxt = '立即支付';
                    } else if (order.orderState == '09') {
                        order.btnTxt = '支付尾款￥' + (order.balance / 100).toFixed(2);
                    }
                    $scope.order = order;
                    if (pageWithOutCloseBtn.indexOf(order.orderState) > -1) {
                        vm.hasHandleBtn = false;
                    }
                    if (needRefreshPage.indexOf(order.orderState) > -1) {
                        pageTime = (order.orderState == '07' || order.orderState == '02') ? 10000 : 60000;
                        refreshOrder(order.orderNo);
                    }
                    if (needRefreshCar.indexOf(order.orderState) > -1) {
                        carTime = order.orderState == '02' ? 10000 : 60000;
                        consoleOrderState(order.orderNo);
                    }
                    if (order.orderState == '10') {
                        // 已完成订单，分享红包
                        MainService.giftAlert($scope);
                    }
                }

                var pay = function(json) {
                    var params = {};
                    var money = parseFloat(json['orderAmount'] / 100).toFixed(2); //订单金额
                    var productMoney = parseFloat(json['productAmount'] / 100).toFixed(2); //产品金额
                    console.log("下单返回数据===================" + JSON.stringify(json));
                    params['MERCHANTID'] = json['merchantID'];
                    params['MERCHANTPWD'] = json['merchantPwd'] || "";
                    params['ORDERSEQ'] = json['orderSeq'];
                    if (DEVICE_IS_IOS) { //IOS 调去收银台，商户号这个字段IOs和Android参数名称不同
                        params['ORDERREQTRNSEQ'] = json['orderReqTranSeq'];
                    } else {
                        params['ORDERREQTRANSEQ'] = json['orderReqTranSeq'];
                    }
                    params['ORDERAMOUNT'] = money;
                    console.log("订单金额==================：" + money);
                    params['ORDERTIME'] = json['orderTime'];
                    params['PRODUCTDESC'] = json['goodsName'];

                    params['ATTACH'] = json['attach'];
                    params['BACKMERCHANTURL'] = json['backMerchantUrl'] || "";
                    params['PRODUCTAMOUNT'] = productMoney;
                    console.log("产品金额==================：" + productMoney);
                    params['ATTACHAMOUNT'] = json['attachAmount'];
                    console.log("附加金额==================：" + json['attachAmount']);
                    params['CURTYPE'] = "RMB";
                    params['CUSTOMERID'] = User.getProduct();
                    params['ACCOUNTID'] = User.getProduct();
                    params['MAC'] = json['mac'] || "";
                    params['BUSITYPE'] = json['busiType'];


                    console.log("调收银台参数===================" + JSON.stringify(params));

                    return params;
                };
                var pas_onPay = function(json, success, fail) {
                    console.log("新版调取收银台接口入参======11===================" + JSON.stringify(json));
                    Payment.onPay(json, success, fail);
                };

                $scope.goto = function(page, index) {
                    switch (page) {
                        case 'gift':
                            MainService.giftAlert($scope, true);
                            break;
                        case 'help':
                            TD.TalkingData.onEventWithLabel("ddcx_0006_0003", "滴滴出行_行程详情页面_点击需要帮助");
                            $state.go('spec');
                            break;
                        case 'call':
                            TD.TalkingData.onEventWithLabel("ddcx_0006_0004", "滴滴出行_行程详情页面_点击联系司机");
                            Contacts.tel(order.driverPhone);
                            break;
                        case 'remark':
                            TD.TalkingData.onEventWithLabel("ddcx_0006_0009", "滴滴出行_行程详情页面_点击点评司机");
                            $state.go('appraise');
                            ShareDataService.remarkData = {
                                orderNo: order.orderNo,
                                totalPrice: order.totalPrice,
                                inTimeLevel: order.inTimeLevel, // 准时接送星级
                                carAppearanceLevel: order.carAppearanceLevel, // 车貌车况星级
                                driverServiceLevel: order.driverServiceLevel, // 司机服务星级
                                driverComment: order.driverComment, // 司机评价
                                isAppraise: order.isRemark
                            };
                            break;
                        case 'again':
                            TD.TalkingData.onEventWithLabel("ddcx_0006_0010", "滴滴出行_行程详情页面_点击重新预订");
                            if (_.find(cityService.getCityList(), { cityCode: order.cityCode })) {
                                dealWithReorder(order);
                            } else {
                                cityService.initalCityList().then(function(data) {
                                    dealWithReorder(order);
                                })
                            }
                            break;
                        case 'cancel':
                            TD.TalkingData.onEventWithLabel("ddcx_0006_0005", "滴滴出行_行程详情页面_点击取消订单");
                            if (order.orderState == '03') {
                                BpPopup.alert('开始服务后订单不可取消');
                                return;
                            } else {
                                MainService.cancelTrip(order.orderNo); //产生费用，弹窗取消
                            }
                            break;
                    }
                };
                $scope.confirmPopupClose = function() {
                    MainService.confirmPopup.close();
                }
                $scope.giftShare = function() {
                    console.log('------点击分享红包');
                    var shareJson = {
                        title: $scope.giftInfo.title || '送您滴滴打车红包', //分享标题
                        text: $scope.giftInfo.content || '你的好友小翼刚刚领了滴滴出行代金券，不来看看嘛？', //分享内容
                        download: $scope.giftInfo.link, //分享链接
                        url: '' //分享图片
                    };
                    App.jumpToNView("06", shareJson);
                };
                $scope.openModel = function() {
                    if (order.amtState == '10') {
                        TD.TalkingData.onEventWithLabel("ddcx_0006_0001", "滴滴出行_行程详情页面_点击预估金额");
                    }
                    if (!$scope.priceDetail) {
                        $scope.priceDetail = {};
                        if (order.amtState == '11') { // 订单金额
                            order.priceDetails = order.priceDetails ? order.priceDetails : {};
                            $scope.priceDetail = order.priceDetails;
                            var hasOther = false,
                                hasService = false,
                                other = 0,
                                service = 0,
                                i;
                            for (i = 0; i < $scope.priceDetail.length; i++) {
                                switch ($scope.priceDetail[i].feeType) {
                                    case "other_fee":
                                        other = $scope.priceDetail[i].amount || 0;
                                        hasOther = true;
                                        break;
                                    case "servicePrice":
                                        service = $scope.priceDetail[i].amount || 0;
                                        hasService = true;
                                        break;
                                }
                            }
                            for (i = 0; i < $scope.priceDetail.length; i++) {
                                switch ($scope.priceDetail[i].feeType) {
                                    case "other_fee":
                                        $scope.priceDetail[i].amount = Number(other) + Number(service);
                                        break;
                                    case "servicePrice":
                                        $scope.priceDetail[i].amount = 0;
                                        break;
                                }
                            }
                            if (!hasOther && hasService) {
                                $scope.priceDetail.push({
                                    "name": "其他费用",
                                    "amount": service,
                                    "feeType": "other_fee"
                                })
                            }
                            $scope.priceDetail.total_price = order.totalPrice || 0;
                            $scope.modal.show();
                        } else if (order.amtState == '10') { // 预估金额
                            var param = {};
                            param.orderNo = order.orderNo;
                            param.flng = order.flng;
                            param.flat = order.flat;
                            param.tlng = order.tlng;
                            param.tlat = order.tlat;
                            param.productType = order.productType;
                            param.rideType = order.rideType;
                            param.cityCode = order.cityCode;
                            param.type = order.type;
                            param.dateTime = order.departureTime;

                            dataService.run("getAmtDetail", param, function(resp) {
                                console.log("[getAmtDetail result]:" + JSON.stringify(resp));
                                if (!resp.success) {
                                    $scope.priceDetail = null;
                                    BpPopup.showToast(resp.errorMsg);
                                    return
                                }
                                var detail = resp.result;
                                $scope.priceDetail.start_price = detail.startPrice || 0;
                                $scope.priceDetail.normal_fee = detail.tripPrice || 0;
                                $scope.priceDetail.normal_time_fee = detail.durationPrice || 0;
                                $scope.priceDetail.dynamic_price = detail.dynamicPrice || 0;
                                $scope.priceDetail.servicePrice = detail.servicePrice || 0;
                                $scope.priceDetail.other = detail.otherPrice || 0;
                                $scope.priceDetail.normalDistance = detail.trip || 0;
                                $scope.priceDetail.normalTime = detail.duration || 0;
                                $scope.priceDetail.guarantee = detail.guarantee || 0;
                                $scope.priceDetail.total_price = detail.price || 0;
                                $scope.modal.show();
                            }, function(err) {
                                console.log(err);
                                $scope.priceDetail = null;
                                return;
                            }, null, false, true)
                        }
                    } else {
                        $scope.modal.show();
                    }
                };
                $scope.closeModal = function() {
                    $scope.modal.hide();
                };

                $scope.payOrder = function() {
                    var paramsOrder = {
                        orderAmount: (order.orderState == "08" ? order.totalPrice : order.balance) + "",
                        orderTime: $rootScope.dateFormat(new Date(), "yyyyMMddhhmmss"),
                        orderSeq: order.orderNo,
                        productAmount: (order.orderState == "08" ? order.totalPrice : order.balance) + "",
                        accountId: User.getProduct(),
                        busiType: "04",
                        payType: "1",
                        goodsName: "滴滴出行",
                        goodPayType: "0"
                    };
                    TD.TalkingData.onEventWithLabel("ddcx_0006_0012", "滴滴出行_行程详情页面_点击支付尾款");
                    var sign = MessageDigest.digest("md5", "" + paramsOrder.orderAmount + paramsOrder.orderSeq + paramsOrder.productAmount + paramsOrder.accountId + paramsOrder.busiType + $rootScope.key);
                    //var sign = "";//测试用
                    paramsOrder.sign = sign;
                    console.log("下单请求参数============" + JSON.stringify(paramsOrder));
                    dataService.run("cashierPlaceOrder", paramsOrder, function(res) {
                        if (res.success) {
                            console.log("下单返回参数============" + JSON.stringify(res.result));
                            pas_onPay(pay(res.result), function() {
                                loadOrder(order.orderNo);
                            }, function(err) {
                                loadOrder(order.orderNo);
                            });
                        } else {
                            BpPopup.showToast(res.errorMsg);
                        }
                    }, function(res) {
                        BpPopup.showToast("系统繁忙，请稍后重试");
                    }, null, false, true);
                };
            }
        ])
})();
