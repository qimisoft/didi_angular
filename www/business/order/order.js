(function() {
    'use strict';
    //定义模块名
    var moduleName = 'Order';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state('order', {
                cache: false,
                url: '/order?access',
                views: {
                    '@': {
                        templateUrl: 'business/order/order.tpl.html',
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
            "DataService",
            "$stateParams",
            function($scope, $rootScope, $state, $location, $ionicHistory, OrderService, ShareDataService, BpPopup, dataService, $stateParams) {
                $scope.isShowMore = false;
                $scope.isView = false;
                if ($stateParams.access) {
                    ShareDataService.orderAccess = $stateParams.access;
                }
                $scope.onBack = function() {
                    if (ShareDataService.orderAccess && ShareDataService.orderAccess == 'trafficTrip') {
                        window.location.href = 'http://116.228.151.161:1080/subapps/airticket/main.html#/trafficTripOrder';
                    } else {
                        $state.go("index");
                    }
                };
                $scope.goToDetail = function(order) {
                    switch (order.orderState) {
                        case '01': // 等待接单
                            $state.go('waitAnswer', { orderNo: order.orderNo, orderTime: order.orderTime });
                            break;
                        case '02': // 司机已接单
                        case '03': // 服务中页面;
                        case '04': // 取消，代扣中;
                        case '05': // 已取消
                        case '06': // 已关闭
                        case '07': // 代扣中
                        case '08': // 代扣失败
                        case '09': // 部分代扣成功
                        case '10': // 已完成
                            ShareDataService.myOrder = order;
                            $state.go('orderDetail');
                            break;
                    }
                };
                var now = new Date();
                var lastTime = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
                var param = {
                    startTime: $rootScope.dateFormat(lastTime, 'yyyy-MM-dd hh:mm:ss'),
                    endTime: $rootScope.dateFormat(now, 'yyyy-MM-dd hh:mm:ss')
                };
                dataService.run("queryOrderList", param, function(resp) {
                    $scope.isView = true;
                    console.log("[queryOrderList result]:" + JSON.stringify(resp));
                    if (!resp.success) {
                        BpPopup.showToast(resp.errorMsg);
                        return
                    }
                    $scope.isShowMore = true;
                    var _result = resp.result || {};
                    var orders = _result.orders || {};
                    // orders = null;
                    $scope.orderLists = OrderService.classifyOrders(orders);
                    console.log("after classify: " + JSON.stringify($scope.orderLists));
                    if (!orders || !(orders.length > 0)) {
                        $scope.isShowMore = false;
                    }
                }, function(err) {
                    console.log(err);
                }, function() {}, false, true)
            }
        ])
})();
