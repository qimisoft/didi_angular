(function() {
    'use strict';
    angular.module('waitDriver')
        .service('waitDriverService', [
            '$rootScope',
            '$q',
            'DataService',
            function($rootScope, $q, DataService) {
                
            }
        ]).directive('kmMin',function(){
            return {
                restrict: 'EA',
                template: "<div class='carInfo'>"+
                                "<div class='iconbody'>"+
                                 "<i class='icon'></i>"+
                                "</div>"+
                                " <div class='km_min'>"+
                                    "<div class='title'>{{vm.title}}</div>"+
                                    " <div class='content'>"+
                                        " <span class='c1'>距{{vm.contentLab}}还有</span><span class='c2'>{{vm.km}}公里约{{vm.min}}分钟</span>"+
                                     "</div>"+
                                 "</div>"+
                          "</div>",
                controllerAs: 'myController',
                controller: function() {
                    this.name = "Kavlez";
                }
            };
        }).service("queryOrderStatus",function($http,$interval,DataService){
            return{
                run:function(waitTime,params,sucCallback){
                    if(waitTime <= 10000){
                        params.timeout  =  9800;//设置终止时间为9.8秒
                    }
                    DataService.run("queryOrderState",params,function(res){//实时订单查询
                        console.log("调用时间为：" + waitTime);
                        var timer = $interval(function(){//设置多长时间调用一次
                            DataService.run("queryOrderState",params,function(res){
                                sucCallback(res ,timer);
                            });
                        },waitTime);
                        sucCallback(res,timer);
                    });
                }
            }
        });;
})();
