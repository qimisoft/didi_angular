(function() {
    'use strict';

    angular.module('Order')
        .service('OrderService', [
            '$rootScope',
            '$q',
            'DataService',
            function($rootScope, $q, DataService) {
                console.log("enter in OrderService");
                var orderStates = [{
                    code: "00",
                    desc: '初始订单',
                    title: '初始订单',
                    classId: '00',
                    hint: '本次用车由滴滴为您提供服务'
                }, {
                    code: "01",
                    desc: '等待接单',
                    title: '等待接单',
                    classId: '00',
                    hint: '本次用车由滴滴为您提供服务'
                }, {
                    code: "02",
                    desc: '等待接驾',
                    title: '等待接驾',
                    classId: '00',
                    hint: '本次用车由滴滴为您提供服务'
                }, {
                    code: "03",
                    desc: '已上车',
                    title: '服务中',
                    classId: '00',
                    hint: '本次用车由滴滴为您提供服务'
                }, {
                    code: "04",
                    desc: '取消中',
                    title: '代扣中',
                    classId: '00',
                    hint: '本次用车正在取消'
                }, {
                    code: "05",
                    desc: '已取消',
                    title: '已取消',
                    classId: '01',
                    hint: '本次用车已取消'
                }, {
                    code: "06",
                    desc: '已关闭',
                    title: '已关闭',
                    classId: '01',
                    hint: '本次叫车暂未成功，请稍候再试'
                }, {
                    code: "07",
                    desc: '代扣中',
                    title: '代扣中',
                    classId: '00',
                    hint: '本次用车由滴滴为您提供服务'
                }, {
                    code: "08",
                    desc: '待支付',
                    title: '待支付',
                    classId: '00',
                    hint: '请及时充值付款，以免影响下次用车'
                }, {
                    code: "09",
                    desc: '待补款',
                    title: '待支付',
                    classId: '00',
                    hint: '请及时充值付款，以免影响下次用车'
                }, {
                    code: "10",
                    desc: '已完成',
                    title: '已完成',
                    classId: '01',
                    hint: '本次用车由滴滴为您提供服务'
                }];
                var classMap = [{ id: "00", desc: "未完成订单" }, { id: "01", desc: "已完成订单" }];

                var getState = function(codition) {
                    return codition ? _.find(orderStates, codition) : orderStates;
                };

                this.classifyOrders = function(orders) {
                    var orderLists = [];
                    var state = '';
                    _.each(classMap, function(v0) {
                        var _tmp = [];
                        _.each(orders, function(v1) {
                            state = getState({ code: v1.orderState });
                            if (v0.id == state.classId) {
                                v1.title = state.title;
                                _tmp.push(v1)
                            }
                        });
                        orderLists.push({
                            class: v0,
                            data: _tmp
                        })
                    });
                    return orderLists
                };

                this.formatOrder = function(order) {
                    var state = getState({ code: order.orderState });
                    // 定义top中显示的状态
                    order.desc = state.desc;
                    // 定义top中显示的灰色提示文字
                    order.hint = state.hint;
                    // 定义top中金额显示情况 00 不显示；10 预估金额；11 订单金额
                    if (order.orderState == '04' || order.orderState == '05' || order.orderState == '06') {
                        order.amtState = '10'; //预估金额
                    } else if (order.orderState == '02' || order.orderState == '03') {
                        order.amtState = '10'; //预估金额
                    } else {
                        order.amtState = '11'; //订单金额
                    }
                    // 定义top中图标显示情况
                    switch (order.orderState) {
                        case '02': // 司机已接单
                            order.stateIcon = 'ok';
                            break;
                        case '03': // 服务中页面
                            order.stateIcon = 'ok';
                            break;
                        case '04': // 取消行程，代扣中
                            order.stateIcon = 'cancel';
                            break;
                        case '05': // 已取消
                            order.stateIcon = 'cancel';
                            break;
                        case '06': // 已关闭，派车失败
                            order.stateIcon = 'fail';
                            break;
                        case '07': // 代扣中
                            order.stateIcon = 'wait';
                            break;
                        case '08': // 代扣失败
                            order.stateIcon = 'fail';
                            break;
                        case '09': // 部分代扣成功
                            order.stateIcon = 'fail';
                            break;
                        case '10': // 已完成
                            order.stateIcon = 'ok';
                            break;
                    }
                    return order;
                };

                this.formatDistance = function(scope) {
                    var order = scope.curOrder;
                    var name_temp = "起点";
                    var _params = {
                        flng: scope.order.flng,
                        flat: scope.order.flat,
                        productType: scope.order.productType, //201 专车  301 快车
                        cityCode: scope.order.cityCode
                    };
                    if (order.dlng && order.dlat && order.dlng != '0.0' && order.dlat != '0.0') {
                        _params.flng = order.dlng + '';
                        _params.flat = order.dlat + '';
                    }
                    if (order.orderState == '02') {
                        // 上车前终点是打车起点
                        _params.tlng = scope.order.flng;
                        _params.tlat = scope.order.flat;
                        name_temp = "起点";
                    } else {
                        // 上车后终点是打车终点
                        _params.tlng = scope.order.tlng;
                        _params.tlat = scope.order.tlat;
                        name_temp = "终点";
                    }
                    DataService.run("getEstimateRoute", _params, function(resp) {
                        console.log("[预估行程查询]" + JSON.stringify(resp));
                        if (resp.success) {
                            scope.carDis = resp.result;
                            scope.carDis.name = name_temp;
                        }
                    });
                }
            }
        ]);
})();
