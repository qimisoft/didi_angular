/**
 * 首页弹窗集合
 * @author Cici
 * created on 4/10/2017
 *
 * 取消行程(cancelTrip)弹窗添加 by Cici on 6/19/2017
 *
 * 价格变动弹窗添加 by Cici on 7/3/2017
 *
 * 非三星用户弹窗添加 by Cici on 7/6/2017
 *
 * 红包弹窗添加 by Cici on 7/14/2017
 
 */
(function() {
    'use strict';
    var productNo = User.getProduct();
    angular.module('Main')
        .service('MainService', [
            '$ionicPopup',
            '$state',
            '$stateParams',
            'ShareDataService',
            'DataService',
            'BpPopup',
            "TD",
            function($ionicPopup, $state, $stateParams, ShareDataService, DataService, BpPopup, TD) {
                this.confirmPopup = null;

                // 获取未完成订单
                this.getOrdering = function(vm, $scope) {
                    var that = this;
                    // that.showOrdering(vm, $scope)
                    // return;
                    vm.hasOrdering = null;
                    DataService.run('getOrderInfo', { timeout: null }, function(data) {
                        console.log('[查询未完成订单成功]');
                        console.log(data);
                        // 当前页面不是首页，不执行
                        if ($state.current.name != 'index') {
                            return;
                        }
                        if (data.success) {
                            if (data.result != null) {
                                // 查到的第一个订单保存起来
                                vm.hasOrdering = data.result.orders[0];
                            }
                            if (!vm.hasOrdering) {
                                vm.freshStartPoint(); //没有未完成的订单状态下  //add by microcosm
                                return;
                            }
                            // vm.hasOrdering.orderState = '08';
                            // 不是刚刚进入首页，比如选完地址，不弹出弹框；
                            if ($stateParams.isOrder === '1') {
                                return;
                            }

                            switch (vm.hasOrdering.orderState) {
                                // 有正在等待应答的订单
                                case '01':
                                    that.confirmPopup = $ionicPopup.show({
                                        template: '<picture class="point-img"></picture><span>您有一笔叫车订单待应答</span>',
                                        scope: $scope,
                                        buttons: [{
                                            text: '立即前往',
                                            type: 'button-positive',
                                            onTap: function(e) {
                                                return true
                                            }
                                        }]
                                    });
                                    that.confirmPopup.then(function(res) {
                                        if (res) {
                                            $state.go('waitAnswer', {
                                                orderNo: vm.hasOrdering.orderNo,
                                                orderTime: vm.hasOrdering.orderTime
                                            });
                                        }
                                    });
                                    break;

                                    // 有正在代扣中的订单+取消
                                case '04':
                                case '07':
                                    that.confirmPopup = $ionicPopup.show({
                                        template: '<picture class="alert-img"></picture><span>您有一个订单正在代扣，<br>待支付后再使用用车服务</span>',
                                        scope: $scope,
                                        buttons: [{
                                            text: '取消',
                                            type: 'button-light',
                                            onTap: function(e) {
                                                return false
                                            }
                                        }, {
                                            text: '查看',
                                            type: 'button-positive',
                                            onTap: function(e) {
                                                return true
                                            }
                                        }]
                                    });
                                    that.confirmPopup.then(function(res) {
                                        if (res) {
                                            ShareDataService.myOrder = vm.hasOrdering;
                                            $state.go('orderDetail');
                                        } else {
                                            that.confirmPopup = null;
                                        }
                                    });
                                    break;

                                    // 有未支付完成的订单
                                case '08':
                                case '09':
                                    that.confirmPopup = $ionicPopup.show({
                                        template: '<picture class="point-img"></picture><span>您有一笔订单未支付，<br>请支付后再叫车吧</span>',
                                        scope: $scope,
                                        buttons: [{
                                            text: '去支付',
                                            type: 'button-positive',
                                            onTap: function(e) {
                                                return true
                                            }
                                        }]
                                    });
                                    that.confirmPopup.then(function(res) {
                                        if (res) {
                                            ShareDataService.myOrder = vm.hasOrdering;
                                            $state.go('orderDetail');
                                        }
                                    });
                                    break;

                                    // 有正在进行中的订单
                                case '02':
                                case '03':
                                    that.showOrdering(vm, $scope);
                                    break;
                            }

                        }
                    }, null, null, false, false)
                }

                // 正在进行中的订单
                this.showOrdering = function(vm, $scope) {
                    var that = this;
                    that.confirmPopup = $ionicPopup.show({
                        template: '<picture class="wait-img"></picture><span>您有一个订单正在进行</span>',
                        scope: $scope,
                        buttons: [{
                            text: '返回',
                            type: 'button-light',
                            onTap: function(e) {
                                return false
                            }
                        }, {
                            text: '查看',
                            type: 'button-positive',
                            onTap: function(e) {
                                return true
                            }
                        }]
                    });
                    that.confirmPopup.then(function(res) {
                        if (res) {
                            ShareDataService.data_agreement = false;
                            ShareDataService.data_cost = null;
                            ShareDataService.myOrder = vm.hasOrdering;
                            $state.go('orderDetail');
                        } else {
                            that.confirmPopup = null;
                        }
                    })
                }

                // 输入乘客手机号弹框
                this.showPassenger = function(vm, $scope, flag) {
                    vm.passengerTemp = vm.passengerPhone;
                    var that = this;
                    that.confirmPopup = $ionicPopup.show({
                        template: '<div class="close-btn" ng-click="vm.confirmPopupClose()"></div><div class="passenger-wrap"><span>请输入乘车人联系电话</span><div class="holder"><div class="clear-btn" ng-if="vm.passengerTemp" ng-click="vm.clearInput()"></div><input type="tel" placeholder="请输入手机号" maxlength="11" ng-model="vm.passengerTemp"></div></div>',
                        scope: $scope,
                        buttons: [{
                            text: '确定',
                            type: 'button-positive',
                            onTap: function(e) {
                                if (!checkPhoneNo()) {
                                    e.preventDefault();
                                } else {
                                    return true;
                                }
                            }
                        }]
                    });
                    that.confirmPopup.then(function(res) {
                        if (res) {
                            vm.passengerPhone = vm.passengerTemp;
                            ShareDataService.data_passengerPhone = vm.passengerPhone;
                        } else {
                            that.confirmPopup = null;
                        }
                    })
                    vm.clearInput = function() {
                        vm.passengerTemp = null;
                    }

                    function checkPhoneNo() {
                        if (!vm.passengerTemp) {
                            BpPopup.showToast('请填写乘车人手机号');
                            return false;
                        } else {
                            var tmp = '' + vm.passengerTemp;
                            tmp = tmp.replace(/[-\s]+/g, '');
                            var _test = /^1(1|3|4|5|7|8)\d{9}$/.test(tmp);
                            if (!_test) {
                                BpPopup.showToast('请输入正确的手机号');
                            }
                            return _test;
                        }
                    }
                }

                // 充值弹窗
                this.showToCharge = function(vm, $scope) {
                    var that = this;
                    that.confirmPopup = $ionicPopup.confirm({
                        cancelText: '取消',
                        okText: '去充值',
                        title: '您的余额不能低于' + (vm.cost.guarantee / 100).toFixed(2) + '元，无法申请用车，请及时充值'
                    })
                    that.confirmPopup.then(function(res) {
                        if (res) {
                            TD.TalkingData.onEventWithLabel("ddcx_0001_0020", "滴滴出行_首页_点击去充值");
                            App.jumpToNView("04", {}, function() {
                                TD.TalkingData.onEventWithLabel("ddcx_0001_0023", "滴滴出行_首页_点击去充值_充值成功");
                            }, function() {}, function() {});
                        } else {
                            TD.TalkingData.onEventWithLabel("ddcx_0001_0021", "滴滴出行_首页_点击取消充值");
                        }
                    })
                }

                // 取消行程弹窗
                this.cancelTrip = function(orderno, loadOrder) {
                    var that = this;
                    that.confirmPopup = $ionicPopup.confirm({
                        title: '',
                        template: '频繁取消可能导致处罚金额且无司机应答',
                        cancelText: '确定取消',
                        cancelType: 'button-default',
                        okText: '暂不取消',
                        okType: 'button-positive'
                    });
                    that.confirmPopup.then(function(res) {
                        if (!res) { //确定取消
                            TD.TalkingData.onEventWithLabel("ddcx_0006_0007", "滴滴出行_行程详情页面_点击确认取消订单");
                            var params = { orderNo: orderno, force: true };
                            DataService.run("cancelCar", params, function(succRes) {
                                if (succRes.success) {
                                    if (loadOrder) {
                                        loadOrder(orderno)
                                    } else {
                                        $state.go("orderDetail", { orderNo: orderno });
                                    }
                                } else {
                                    BpPopup.showToast("系统繁忙，请稍后重试");
                                }
                            }, function(errRes) {
                                BpPopup.showToast("系统繁忙，请稍后重试");
                            }, null, false, true);
                        } else { //暂不取消
                            TD.TalkingData.onEventWithLabel("ddcx_0006_0006", "滴滴出行_行程详情页面_点击暂不取消订单");
                            $state.go("orderDetail", { orderNo: orderno });
                        }
                    });
                }

                // 价格变动弹窗
                this.amtChange = function(vm, $scope) {
                    var that = this;
                    that.confirmPopup = $ionicPopup.show({
                        template: '<picture class="point-img"></picture><span>价格变动请刷新</span>',
                        scope: $scope,
                        buttons: [{
                            text: '立即刷新',
                            type: 'button-positive',
                            onTap: function(e) {
                                return true
                            }
                        }]
                    });
                    that.confirmPopup.then(function(res) {
                        if (res) {
                            vm.getPres();
                        }
                    })
                }

                // 非三星用户弹窗
                this.authorityAlert = function(vm, $scope, msg) {
                    var that = this;
                    that.confirmPopup = $ionicPopup.show({
                        template: '<picture class="alert-img"></picture><span>' + msg + '</span>',
                        scope: $scope,
                        buttons: [{
                            text: '立即认证',
                            type: 'button-positive',
                            onTap: function(e) {
                                return true
                            }
                        }, {
                            text: '取消',
                            type: 'button-light',
                            onTap: function(e) {
                                return false
                            }
                        }]
                    });
                    that.confirmPopup.then(function(res) {
                        if (res) {
                            App.jumpToNView("01", {}, function() {}, function() {}, function() {});
                        }
                    })
                }

                // 红包弹窗
                this.giftAlert = function(scope, isPop) {
                    var that = this;
                    var sessionKey = (App && App.getSessionKey()) || '';
                    var _params = {
                        loginNo: productNo,
                        sessionID: sessionKey,
                        "merchantOrderInfo": scope.order.orderNo + '',
                        "requestChannel": "08"
                    }
                    DataService.run("getRedbagLink", _params, function(resp) {
                        console.log("-----红包分享接口请求成功");
                        console.log(resp);
                        // resp.result = null;
                        if (resp.success && resp.result && resp.result.linkFlag === '01') {
                            !isPop && (scope.optionsShow.gift = true);
                            scope.giftInfo = {};
                            scope.giftInfo.link = resp.result.redbagLinkInfo.substring(resp.result.redbagLinkInfo.indexOf('http'));
                            scope.giftInfo.link = scope.giftInfo.link.substring(0, scope.giftInfo.link.indexOf('@@'));
                            scope.giftInfo.title = scope.giftInfo.title;
                            scope.giftInfo.content = scope.giftInfo.content;
                            if (!isPop && scope.order.finishTime && (new Date().getTime() - new Date(scope.order.finishTime).getTime()) > 24 * 60 * 60 * 1000) {
                                // 订单完成24小时之内弹，过了24小时不弹出弹窗
                                return;
                            }
                            that.confirmPopup = $ionicPopup.show({
                                template: '<div class="gift-confirm"><div class="close" ng-click="confirmPopupClose()"></div><div class="inners"><button class="button" ng-click="giftShare()">分享得红包</button></div></div>',
                                scope: scope
                            });
                            document.querySelector('.popup-container .popup').style.background = 'transparent';
                        } else {
                            if (!isPop) {
                                if (resp.result.linkFlag === '02') {
                                    scope.optionsShow.gift = true;
                                } else {
                                    scope.optionsShow.gift = false;
                                }
                            }
                            isPop && (BpPopup.showToast('红包已领完'));
                        }
                    }, function(err) {
                        console.log(err);
                    }, null, false, true);
                }

                this.getLocationByLngLat = function(callback) {
                    //根据地址获取经纬度，或根据经纬度获取地址
                    var lnglat = getDLntDLat();
                    var endPoint = null;
                    if (!lnglat) {
                        callback(endPoint);
                        return;
                    }
                    AMap.service('AMap.Geocoder', function() { //回调函数
                        //实例化Geocoder
                        var geocoder = new AMap.Geocoder();
                        //TODO: 使用geocoder 对象完成相关功能

                        var lnglatXY = [lnglat.dlng, lnglat.dlat]; //地图上所标点的坐标121.4859
                        //var lnglatXY = [121.31985,31.1937];//地图上所标点的坐标121.4859

                        geocoder.getAddress(lnglatXY, function(status, obj) {
                            //获得了有效的地址信息:
                            console.log(status + ";根据经纬度获取地址---" + JSON.stringify(obj));
                            var object = obj.regeocode;
                            if (status === 'complete' && obj.info === 'OK') {
                                endPoint = {
                                    displayName: object.addressComponent.building ? object.addressComponent.building : object.addressComponent.street + object.addressComponent.streetNumber,
                                    lng: lnglat.dlng + '',
                                    lat: lnglat.dlat + '',
                                    cityName: object.addressComponent.city != '' ? object.addressComponent.city : object.addressComponent.province,
                                    address: object.addressComponent.district + object.addressComponent.street + object.addressComponent.streetNumber
                                };

                                callback(endPoint);
                                //ShareDataService.data_endPoint = vm.endPoint;
                                //目的地定位完成
                                //_getPres(vm,ShareDataService.data_selectedCarType);
                            } else {
                                BpPopup.showToast('终点位置获取失败，请手动选择');
                                callback(endPoint);
                            }
                        });
                    })

                }

                var getDLntDLat = this.getDLntDLat = function() {
                    var pageName = "";
                    var params = window.location.search; //// 格式为：" ?lat=nihao&lng=122 "
                    console.log("search00000:" + params);
                    if (!params) {
                        return;
                    }
                    var parray = params.substring(1).split("&");
                    var paramsJSON = {};
                    for (var p = 0; p < parray.length; p++) {
                        var pl = parray[p].split("=");
                        paramsJSON[pl[0]] = pl[1];
                    }
                    console.log("paramsJSON===" + JSON.stringify(paramsJSON));
                    //getLocationByLngLat(vm,paramsJSON.lng,paramsJSON.lat);
                    return paramsJSON;
                };

            }
        ])
})();