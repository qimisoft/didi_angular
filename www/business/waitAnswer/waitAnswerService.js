(function() {
    'use strict';

    angular.module('waitAnswer')
        .service('waitAnswerService', [
            '$rootScope',
            '$q',
            'DataService',
            function($rootScope, $q, DataService) {
                this.$cancelCar = function(reqData){//取消行程或者取消订单
                    var config = DataService.buildReqConfig('cancelCar');
                    var $defer = $q.defer();
                    var reqData = reqData || {};
                    var cancelCarRes = DataService.http(config,reqData);
                    cancelCarRes.then(function(res){
                        if(res.success){
                            $defer.resolve(res);
                        }
                        else{
                            $defer.reject(res);
                        }
                    },function(res){
                        $defer.reject(res);
                    });
                    return $defer.promise;
                }
            }
        ]);
})();
