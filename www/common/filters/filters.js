(function() {
    'use strict';

    function httpTohttps() {
        return function(url) {
            if (!url) {
                return;
            }
            var temp = url.substr(4, 1);
            if (temp == ':') {
                var temp2 = url.substr(5, url.length);
                console.log('https:' + temp2);
                return 'https:' + temp2;
            } else {
                console.log(url);
                return url;
            }
        };
    }

    function minutesToFomat() {
        return function(val) {
            if (!val) {
                return '--分钟';
            }
            if (Math.floor(val / 3600) === 0) {
                return Math.floor(val / 60) + '分钟';
            } else {
                return Math.floor(val / 3600) + '小时' + Math.floor(val / 60) + '分钟';
            }
        };
    }

    function minutesToHours() {
        return function(val) {
            if (!val) {
                if (val === 0) {
                    return '0分钟';
                } else {
                    return '--分钟';
                }
            }
            val = Math.ceil(val);
            if (Math.floor(val / 60) === 0) {
                return val + '分钟';
            } else {
                if (val % 60 == 0) {
                    return Math.floor(val / 60) + '小时';
                } else {
                    return Math.floor(val / 60) + '小时' + (val % 60) + '分钟';
                }
            }
        };
    }

    function mToKm() {
        return function(val) {
            return val ? ((val < 100) ? 0.1 : (val / 1000).toFixed(1)) : (val === 0 ? '0' : '--');
        };
    }

    function uppercase() {
        return function(text) {
            return text ? text.toUpperCase() : text;
        };
    }

    function fenToYuan() {
        return function(val) {
            if (val == 0) {
                return "0.00";
            }
            if (!val) {
                return '--';
            }
            var f_x = val == 0 ? "0.00" : (val / 100);
            var s_x = f_x.toString();
            var pos_decimal = s_x.indexOf('.');
            if (pos_decimal < 0) {
                pos_decimal = s_x.length;
                s_x += '.';
            }
            while (s_x.length <= pos_decimal + 2) {
                s_x += '0';
            }
            return s_x;
        }
    }

    function translate() {
        return function(val, type) {
            //var rideTypeMap = [{id: '100', desc: '舒适型'},{id: '400', desc: '商务型'},{id: '200', desc: '豪华型'},{id:'500', desc: '优选型'},{id:'600', desc: '经济型'}];
            //var productTypeMap = [{id: "201", desc: "专车"}, {id: "301", desc: "快车"}, {id: "401", desc: "全部"}];
            var rideTypeMap = {
                '100': '舒适型',
                '400': '六座型',
                '200': '豪华型',
                '500': '优选型',
                '600': '快车'
            };
            var productTypeMap = {
                '201': '专车',
                '301': '快车',
                '401': '全部'
            };
            var feeTypeMap = {
                'empty_fee': '远途费',
                'highway_fee': '高速费',
                'bridge_fee': '路桥费',
                'low_speed_fee': '低速费',
                'night_fee': '夜间费',
                'normal_fee': '里程费',
                'other_fee': '其他费用',
                'park_fee': '停车费',
                'start_price': '起步费',
                'tip_fee': '加价费用',
                'limit_pay': '最低消费补足',
                'combo_fee': '套餐费用',
                'normal_time_fee': '时长费',
                'cancel_fee': '违约费',
                'dynamic_price': '临时加价',
                'wait_fee': '等候费',
                'refund_price': '退款金额',
                'servicePrice': '服务费'
            };

            var map = [];
            switch (type) {
                case 'rideType':
                    map = rideTypeMap;
                    break;
                case 'productType':
                    map = productTypeMap;
                    break;
                case 'feeType':
                    map = feeTypeMap;
                    break;
                default:
                    map = [];
                    break;
            }
            return map[val] || '-';
        }
    }
    angular.module('common.filters', [])
        .filter('uppercase', uppercase)
        .filter('fen2yuan', fenToYuan)
        .filter('m2km', mToKm)
        .filter('minutes2Fomat', minutesToFomat)
        .filter('translate', translate)
        .filter('minutes2Hours', minutesToHours)
        .filter('http2https', httpTohttps)
})();