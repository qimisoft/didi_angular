(function() {
    'use strict';
    angular.module('common.shareDataService', [])
        .service('ShareDataService', [
            '$rootScope',
            function($rootScope) {
                /**
                 * ShareDataService是用来多个页面之间共享数据
                 * @method set(name, val) name是唯一的key, val是要保存的值
                 * @method get(name) 根据唯一的key name在shareDatas对象中取值
                 * @method getCopy(name) 根据唯一的key name在shareDatas对象中取值,返回copy后的值
                 * 
                 * shareDatas对象key定义说明:
                 * 
                 * 1.共享请求返回的数据
                 *     共享请求返回数据请以 “ajax_” 开头，后面拼接你的请求的缩写，如很长请采用驼峰命名
                 *     例如：
                 *         查询历史数据的请求结果（queryHistory）
                 *         此时key的名称为 ajax_queryHistory
                 *         
                 * 2.共享一个单独的对象
                 *      共享一个单独的对象请以 “data_” 开头，后面拼接你的变量名，如很长请采用驼峰命名
                 *      例如：
                 *          lbs的值
                 *          此时key的名称为 data_lbs
                 *
                 * 3.共享一个其他的数据
                 *     共享不在上面几个类型之外的数据，请以 “other_” 开头，后面拼接你的变量名，如很长请采用驼峰
                 *     例如：
                 *         other_thisIsOtherData
                 *
                 * 注：
                 *     如果通过 ShareDataService.data_saveSomething = 'something' 方式保存数据，key请参照上述定义，
                 *     同时不要用set, get, getCopy 即ShareDataService.set='something', ShareDataService.get='something', ShareDataService.getCopy='something'是不被允许的
                 */

                var shareDatas = {};

                this.set = function(name, val) {
                    shareDatas[name] = val;
                }
                this.get = function(name) {
                    return _.copy(shareDatas[name])
                }
                this.getCopy = function(name) {
                    return _.copy(shareDatas[name])
                }
            }
        ]);
})();
