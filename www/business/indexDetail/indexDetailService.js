/**
 * 首页扩展页判断手机号集成
 * @author Cici
 * created on 4/8/2017
 */
(function() {
    'use strict';
    angular.module('indexDetail')
        .service('indexDetailService', [
            '$rootScope',
            'BpPopup',
            function($rootScope, BpPopup) {
                this.checkPhoneNo = function(no, msgtype) {
                    if (!no) {
                        BpPopup.showToast('请填写' + msgtype);
                        return false;
                    } else {
                        var tmp = '' + no;
                        tmp = tmp.replace(/[-\s]+/g, '');
                        var _test = /^\d{11}$/.test(tmp);
                        if (!_test) {
                            BpPopup.showToast(msgtype + '只能是11位数字');
                        }
                        return _test;
                    }
                }
            }
        ]);
})();
