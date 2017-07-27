(function() {
    'use strict';
    //定义模块名
    var moduleName = 'waitAnswer';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('waitAnswer', {
                cache: false,
                url: '/waitAnswer?orderNo&orderTime',
                views: {
                    '@': {
                        templateUrl: 'business/waitAnswer/waitAnswer.tpl.html',
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
            "$ionicPopup",
            "$interval",
            "waitAnswerService",
            "ShareDataService",
            "DataService",
            "BpPopup",
            "$stateParams",
            "TD",
            "MainService",
            function($scope, $rootScope, $state, $location, $ionicHistory, $ionicPopup, $interval, waitAnswerService, ShareDataService, DataService, BpPopup, $stateParams, TD, MainService) {
                var vm = $scope.vm = {};
                vm.isAlready = false; //判断是否接单，false未接单,如果接单了，则跳转到行程详情页面，再进行取消。
                //$stateParams.orderNo = "20170420094524591007";
                var orderstateParams = { orderNo: $stateParams.orderNo };
                var confirmPopup = null;

                $scope.onBack = function() {
                        App.exitApp(); //产品闵越双 确认这么做 出事她担着
                    }
                    //对应的订单等待时间，如果从上一页传过来订单时间，则直接根据订单时间来进行判断等待时间（单位为10ms），默认为-1，
                var time = $stateParams.orderTime ? (parseInt((new Date() - new Date($stateParams.orderTime.replace(/\-/g, "\/"))) / 100)) : -1;

                var orderState$intervalTime = $interval(function() {
                    if (time >= 6 * 60 * 1000) {
                        $interval.cancel(orderState$intervalTime);
                        BpPopup.showToast("等待订单超时，请重新下单");
                        $state.go('index');
                        return;
                    }
                    DataService.run("queryOrderState", orderstateParams, function(res) {
                        if (res.success && res.result) {
                            ShareDataService.myOrder = res.result;
                        }
                        if (res.success && res.result && res.result.orderState != "01") { //订单实时，如果为01等待接单
                            //clearInterval(orderStateTime);
                            $interval.cancel(orderState$intervalTime);
                            vm.isAlready = true;
                            if (res.result.orderState == "02") {
                                BpPopup.showToast("您的订单已被司机接单");
                                $state.go('orderDetail'); //参数已经通过ShareDataService.myOrder中传过去
                            } else {
                                $state.go('orderDetail', { orderNo: $stateParams.orderNo });
                            }
                        } else {
                            vm.isAlready = false;
                        }
                    }, function() {});
                }, 10000);
                DataService.run("queryOrderState", orderstateParams, function(res) {
                    if (res.success && res.result) {
                        ShareDataService.myOrder = res.result;
                    }
                    if (res.success && res.result && res.result.orderState != "01") { //订单实时，如果为01等待接单
                        //clearInterval(orderStateTime);
                        $interval.cancel(orderState$intervalTime);
                        vm.isAlready = true;
                        if (res.result.orderState == "02") {
                            BpPopup.showToast("您的订单已被司机接单");
                            $state.go('orderDetail'); //参数已经通过ShareDataService.myOrder中传过去
                        } else {
                            $state.go('orderDetail', { orderNo: $stateParams.orderNo });
                        }
                    } else {
                        vm.isAlready = false;
                    }
                }, function() {});

                /*定时10s 查询实时订单（需要在逻辑跳转关闭定时器）*/
                //var orderStateTime = setInterval(function(){
                //    console.log("waitAnswer Time = "+time);
                //
                //    DataService.run("queryOrderState",orderstateParams,function(res){
                //        if(res.success && res.result){
                //            ShareDataService.myOrder = res.result;
                //        }
                //        if(res.success && res.result && res.result.orderState != "01"){//订单实时，如果为01等待接单
                //            clearInterval(orderStateTime);
                //            vm.isAlready = true;
                //            if(res.result.orderState == "02"){
                //                BpPopup.showToast("您的订单已被司机接单");
                //                $state.go('orderDetail');//参数已经通过ShareDataService.myOrder中传过去
                //            }else{
                //                $state.go('orderDetail',{orderNo:$stateParams.orderNo});
                //            }
                //        }else{
                //            vm.isAlready = false;
                //        }
                //    },function(){});
                //
                //    if(time >= 6 * 60 * 1000){
                //        BpPopup.showToast("等待订单超时，请重新下单");
                //        $state.go('index');
                //    }
                //
                //},10000);

                $scope.$on('$ionicView.beforeLeave', function(ev, data) {
                    //clearInterval(orderStateTime);
                    $interval.cancel(orderState$intervalTime);
                    confirmPopup.close(); //离开页面 关闭弹框啊 add by lison 20170428
                });

                vm.goToCancelTrip = function() { //取消行程
                    //clearInterval(orderStateTime);
                    $interval.cancel(orderState$intervalTime);
                    // $state.go('cancelTrip',{orderNo:$stateParams.orderNo});
                    MainService.cancelTrip($stateParams.orderNo); //产生费用，弹窗取消
                }
                vm.goToBack = function() {
                    TD.TalkingData.onEventWithLabel("ddcx_0005_0001", "滴滴出行_等待应答页面_点击取消订单");
                    confirmPopup = $ionicPopup.confirm({
                        title: '',
                        template: '正在为您寻找车辆，确定不再等一下吗？', //您是否取消此次订单 改的
                        cancelText: '取消订单',
                        cancelType: 'button-default',
                        okText: '再等一下',
                        okType: 'button-positive'
                    });
                    confirmPopup.then(function(res) {
                        if (!res) { //弹框点击取消订单
                            TD.TalkingData.onEventWithLabel("ddcx_0005_0002", "滴滴出行_等待应答页面_点击立即取消");
                            if (!vm.isAlready) { //如果司机没有接单，则直接调用取消接口，否则直接跳转取消行程页面
                                console.log('返回上一页');
                                var params = { orderNo: $stateParams.orderNo, force: false };
                                $rootScope.showLoading();
                                waitAnswerService.$cancelCar(params).then(function(cancelRes) {
                                    $rootScope.hideLoading();
                                    $interval.cancel(orderState$intervalTime);
                                    if (cancelRes.result.isCost) {
                                        // BpPopup.showToast("您的订单已被司机接单");
                                        // $state.go('cancelTrip',{orderNo:$stateParams.orderNo});
                                        MainService.cancelTrip($stateParams.orderNo); //产生费用，弹窗取消
                                    } else {
                                        //$scope.back();
                                        $state.go('index', { isOrder: '1' });
                                    }
                                }, function(errorRes) {
                                    $rootScope.hideLoading();
                                    errorRes ? BpPopup.showToast(errorRes.errorMsg) : BpPopup.showToast("系统繁忙，请稍后重试");
                                });
                            } else {
                                //clearInterval(orderStateTime);
                                $interval.cancel(orderState$intervalTime);
                                // $state.go('cancelTrip',{orderNo:$stateParams.orderNo});
                                MainService.cancelTrip($stateParams.orderNo); //产生费用，弹窗取消
                            }
                        } else {
                            TD.TalkingData.onEventWithLabel("ddcx_0005_0003", "滴滴出行_等待应答页面_点击继续等待");
                            console.log('不取消订单');
                        }
                    });

                };



                var canvas = document.getElementById("canvas"),
                    ctx = canvas.getContext("2d"),
                    percent = 600000, // 最终百分比
                    maxVal = 60,

                    circleX = canvas.width / 2, // 中心x坐标
                    circleY = canvas.height / 2, // 中心y坐标
                    radius = 200, // 圆环半径
                    lineWidth = 4, // 圆形线条的宽度
                    lineColor = '#cbcbcb',
                    sectorLineColor = '#ff8803',
                    symbolRadius = 10,
                    symbolBgColor = '#ff8803',
                    fontSize = 36; // 字体大小

                // 画圆
                var _circle = function(cx, cy, r) {
                    ctx.beginPath();
                    ctx.moveTo(cx + r, cy);
                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = lineColor;
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.stroke();
                }

                // 画小圆
                var _circleSmall = function(cx, cy, r, radius) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - radius);
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fillStyle = symbolBgColor;
                    ctx.fill();
                }

                // 画弧线
                var _sector = function(cx, cy, r, startAngle, endAngle, anti) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r); // 从圆形底部开始画
                    ctx.lineWidth = lineWidth;

                    // 渐变色 - 可自定义
                    var linGrad = ctx.createLinearGradient(
                        circleX, circleY - radius - lineWidth, circleX, circleY + radius + lineWidth
                    );
                    linGrad.addColorStop(0.0, '#ec847a');
                    linGrad.addColorStop(0.5, '#9bc4eb');
                    linGrad.addColorStop(1.0, '#eccd23');

                    // ctx.strokeStyle = linGrad;
                    ctx.strokeStyle = sectorLineColor;

                    // 圆弧两端的样式
                    ctx.lineCap = 'round';

                    var tmp_startAngle = startAngle % 360;
                    var tmp_endAngle = endAngle % 360;

                    // 圆弧
                    ctx.arc(
                        cx, cy, r,
                        tmp_startAngle * (Math.PI / 180.0) - (Math.PI / 2),
                        tmp_endAngle * (Math.PI / 180.0) - (Math.PI / 2),
                        anti
                    );
                    ctx.stroke();
                }

                var _getTimeStr = function(time) {
                        time = Math.floor(time / 10);

                        var str = "00:00",
                            temp = (time % 60).toString();
                        if (Math.floor(time / 60) == 0) {
                            str = "00:" + (temp.length == 1 ? "0" + temp : temp);
                        } else {
                            var timeNum = "";
                            if (Math.floor(time / 60) < 10) {
                                timeNum = '0' + Math.floor(time / 60);
                            } else {
                                timeNum = Math.floor(time / 60);
                            }
                            str = timeNum + ":" + (temp.length == 1 ? "0" + temp : temp);
                        }
                        return str;
                    }
                    // 刷新
                var _loading = function() {
                    if (time == percent) {
                        clearInterval(circleLoading);
                    }
                    time++;
                    ctx.strokeStyle = lineColor;
                    // 清除canvas内容
                    ctx.clearRect(0, 0, circleX * 2, circleY * 2);

                    // 中间的字
                    ctx.font = fontSize + 'px April';
                    ctx.fillStyle = '#a4a4a4';
                    ctx.fillText("已等待", 300, 240);

                    ctx.beginPath();
                    ctx.font = '60px April';
                    // ctx.symbolBgColor = lineColor;
                    ctx.fillStyle = symbolBgColor;
                    ctx.fillText(_getTimeStr(time), circleX + 5, circleY + 20);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // ctx.fillStyle = lineColor;


                    // 圆形
                    _circle(circleX, circleY, radius);

                    // 圆弧
                    _sector(circleX, circleY, radius, 0, time / 10 / maxVal * 360);

                    var ao = time / 10 / maxVal * 360;
                    var x1 = circleX + radius * Math.cos(ao * Math.PI / 180 - (Math.PI / 2));
                    var y1 = circleY + radius * Math.sin(ao * Math.PI / 180 - (Math.PI / 2));
                    _circleSmall(x1, y1, symbolRadius, radius);

                }
                var circleLoading = null;

                /*第一次使用300毫秒目的是解决使用Android4.3系统以下的版本适配问题，会重复显示时间的问题*/
                window.setTimeout(function() {
                    _loading(); // setTimeout(_loading(), 6000);
                    circleLoading = window.setInterval(function() {
                        _loading(); // setTimeout(_loading(), 6000);
                    }, 100);
                }, 300);




            }
        ])
})();
