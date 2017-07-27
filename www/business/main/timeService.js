/**
 * 时间选择器数据
 * @author Cici
 * created on 5/5/2017
 */
(function() {
    'use strict';
    angular.module('Main')
        .service('TimeService', [
            '$rootScope',
            '$q',
            'DataService',
            function($rootScope, $q, DataService) {
                this.getDataTime = function() {
                    function fomatNames(date) {
                        var _date = new Date(date);
                        return _date.getMonth() + 1 + '月' + _date.getDate() + '日-' + ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][_date.getDay()]
                    }
                    var _now = new Date();
                    var hour = _now.getHours();
                    var minutes = _now.getMinutes();
                    var today = $rootScope.dateFormat(_now, "yyyy/MM/dd");
                    var tomorrow = $rootScope.dateFormat(new Date(_now.getTime() + 24 * 60 * 60 * 1000), "yyyy/MM/dd");
                    var thirday = $rootScope.dateFormat(new Date(_now.getTime() + 48 * 60 * 60 * 1000), "yyyy/MM/dd");
                    var temp = [{ name: '今天', names: fomatNames(today), value: today, sub: [{ name: '现在', value: 'now' }] }, { name: '明天', names: fomatNames(tomorrow), value: tomorrow, sub: [] }, { name: '后天', names: fomatNames(thirday), value: thirday, sub: [] }];
                    _.each(temp, function(val, index) {
                        if (val.sub.length > 0) {
                            // 今天
                            for (var i = hour; i < 24; i++) {
                                var _sub = [];
                                var min_temp = Math.ceil(minutes / 10) * 10;

                                if (i == hour) {
                                    if (min_temp + 30 < 60) {
                                        for (var j = min_temp + 30; j < 60; j = j + 10) {
                                            // 推后30分钟
                                            _sub.push({ name: j + '分', value: j })
                                        }
                                    } else {
                                        continue;
                                    }
                                } else if (i == (hour + 1)) {
                                    // 如果分钟等于50或者60
                                    if (min_temp === 50) {
                                        for (var j = 20; j < 60; j = j + 10) {
                                            _sub.push({ name: j + '分', value: j })
                                        }
                                    } else if (min_temp === 40) {
                                        for (var j = 10; j < 60; j = j + 10) {
                                            _sub.push({ name: j + '分', value: j })
                                        }
                                    } else {
                                        for (var j = 0; j < 60; j = j + 10) {
                                            j == 0 ? _sub.push({ name: '00' + '分', value: '00' }) : _sub.push({ name: j + '分', value: j })
                                        }
                                    }
                                } else {
                                    for (var j = 0; j < 60; j = j + 10) {
                                        j == 0 ? _sub.push({ name: '00' + '分', value: '00' }) : _sub.push({ name: j + '分', value: j })
                                    }
                                }
                                val.sub.push({ name: i + '点', value: i, sub: _sub })
                            }
                        } else {
                            // 明天后天
                            for (var i = 0; i < 24; i++) {
                                var _sub = [];
                                for (var j = 0; j < 60; j = j + 10) {
                                    j == 0 ? _sub.push({ name: '00' + '分', value: '00' }) : _sub.push({ name: j + '分', value: j })
                                }
                                val.sub.push({ name: i + '点', value: i, sub: _sub })
                            }
                        }
                    })
                    return temp
                };
            }
        ])
})();
