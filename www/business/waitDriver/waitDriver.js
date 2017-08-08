(function() {
    'use strict';
    //定义模块名
    var moduleName = 'waitDriver';
    var controllerName = moduleName + 'Ctrl';
    /**
     * @name  config
     * @description config block
     */
    function config($stateProvider) {
        //定义此模块的路由
        $stateProvider
            .state(moduleName, {
                cache: false,
                url: '/'+ moduleName,
                views: {
                    '@': {
                        templateUrl: 'business/'+moduleName+ '/'+moduleName+'.tpl.html',
                        controller: controllerName
                    }
                }
            })
    }
    angular.module(moduleName, [])
        .config(config)
        .controller(controllerName, [
            "$scope",
            "$state",
            "$stateParams",
            "$interval",
            "ShareDataService",
            "BpPopup",
            "DataService",
            "queryOrderStatus",
            function($scope, $state, $stateParams,$interval, shareData, pop, DataService,queryStatus) {

                //需要上个页面的参数：  orderNo  cityCode productType
                var vm = $scope.vm = {};
                console.log("shareData==============:" + JSON.stringify(shareData));
                vm.startLngLat =[121.92953,31.95317];//[31.24256,121.47095];//起点
                vm.endLngLat = [121.19912,31.1466783]; //终点
                vm.goingLngLat =[121.42953,31.18317];//司机的位置
                shareData.myOrder = shareData.myOrder || {"balance":0,"beginChargeTime":"2017-04-19 20:18:36","carAppearanceLevel":null,"cityCode":"4","class":"com.bestpay.planeticket.product.api.model.resmodel.taxi.LocalOrderRes$TaxiOrders","departureTime":"2017-04-19 19:31:49","driverAvatar":"http://xxxxx.jpg","driverCarType":"日产天籁","driverCard":"冀A**G05","driverComment":null,"driverLevel":"4.9","driverName":"张师傅","driverOrderCount":307,"driverPhone":"18612249028","driverServiceLevel":null,"endName":"上海市儿童医院(泸定路院区)","estimateAmt":7280,"finishTime":null,"flat":"31.24535","flng":"121.48441","inTimeLevel":null,"normalDistance":null,"normalTime":null,"orderNo":"20170419193149685536","orderState":"02","orderTime":"2017-04-19 19:31:47","passengerPhone":"15216661448","payAmt":0,"priceDetails":null,"productType":"201","rideType":null,"startName":"中国电信上海信息网络部","striveTime":null,"tlat":"31.22654","tlng":"121.38738","totalPrice":0,"type":"0","title":"已上车","$$hashKey":"object:22"};
                    //vm.productType = shareData.myOrder.productType || "301";
                console.log("【shareData.Myorder】" + JSON.stringify(shareData.myOrder));
                    vm.startLngLat[0] = shareData.myOrder.flng;
                    vm.startLngLat[1] = shareData.myOrder.flat;
                    vm.endLngLat[0] = shareData.myOrder.tlng;
                    vm.endLngLat[1] = shareData.myOrder.tlat;
                    vm.title = "";
                    vm.contentLab = "";

                    //vm.goingLngLat = vm.driverLngLat;//
                    vm.orderNo = shareData.myOrder.orderNo || "20170417095816731247";

                    vm.km = 0.0;
                    vm.min = 0;
                    vm.timer = null;

                //return;//测试用
                //监听页面离开事件
                $scope.$on('$ionicView.beforeLeave', function(ev, data) {
                    $interval.cancel(vm.timer);//页面离开，关闭此页面的定时器
                });

                var map = new AMap.Map('_mapContainer',{
                    resizeEnable: true,
                    zoom: 13,
                    center:  vm.startLngLat
                });
                vm.driving = null;//路线规划
                //自驾路线规划
                AMap.service('AMap.Driving',function(){//回调函数
                    //实例化Driving
                    //构造路线导航类
                     vm.driving = new AMap.Driving({
                        map: map,
                        panel: "panel",
                        hideMarkers:true

                    });
                    // 根据起终点名称规划驾车导航路线
                    //vm.driving.search(vm.startLngLat,vm.endLngLat);
                    //TODO: 使用driving对象调用驾车路径规划相关的功能
                });


                //添加起点坐标点
                var marker_start = new AMap.Marker({
                    icon :new AMap.Icon({
                        image: " ./img/start.png",
                        size: new AMap.Size(44, 66),  //图标大小
                        imageSize: new AMap.Size(44, 66)
                    }),
                    position : vm.startLngLat,
                    offset : new AMap.Pixel(-22,-66),
                    map : map
                });
                //添加终点坐标点
                var marker_end = new AMap.Marker({
                    icon :new AMap.Icon({
                        image: " ./img/end.png",
                        size: new AMap.Size(44, 66),  //图标大小
                        imageSize: new AMap.Size(44, 66)
                    }),
                    position : vm.endLngLat,
                    offset :new AMap.Pixel(-22,-66),
                    map : map
                });

               /* $scope.getMapcontentOutCar = function(km,min){
                   // pop.showToast(km + ";" + min);//测试用
                    return "<div class='driverInfo'>"+
                        "<div class='infoContent'>"+
                        "<span>距起点还有</span><span>"+km + "公里</span>"+
                        "</div>"+
                        "<div class='infoContent'>"+
                        "<span>约</span><span>"+min + "分钟</span>"+
                        "</div>"+
                        " <i class='infoPoint'></i>"+
                        " </div>";
                }*/
              /*  $scope.getMapcontentInCar = function(km,min){
                    return "<div class='driverInfo'>"+
                        '<div class="infoTitle">您已上车</div>'+
                        '<div class="infoContent">'+
                        " <span>距离终点：</span><span>"+km+"KM</span>"+
                        "</div>"+
                        " <div class='infoContent'>"+
                        "<span>预计时间：</span><span>"+min+"分钟</span>"+
                        "</div>"+
                        ' <i class="infoPoint"></i>'+
                        '</div>';
                }*/
                //添加小汽车
                var marker_car = new AMap.Marker({
                    icon :new AMap.Icon({
                        image: "././img/car.png",
                        size: new AMap.Size(62, 56),  //图标大小
                        imageSize: new AMap.Size(31, 28)
                    }),
                   /* position :  ["",""],*/
                    offset : new AMap.Pixel(-15,-14),
                    map : map
                });
                //添加content覆盖物
               /* var marker_content = new AMap.Marker({
                    content:$scope.getMapcontent,
                    position :  vm.startLngLat,
                    offset : new AMap.Pixel(-20,-100),
                    map : map
                });*/
                if(shareData.myOrder.orderState === "02"){ //如果是上车前
                    //$scope.getMapcontent = $scope.getMapcontentOutCar((vm.km,vm.min));
                    vm.title = "等待接驾";
                    vm.contentLab = "起点";
                }else{//上车后
                    vm.title = "您已上车";
                    vm.contentLab = "终点";
                    //marker_content.setOffset( new AMap.Pixel(-20,-150));
                    //$scope.getMapcontent =  $scope.getMapcontentInCar((vm.km,vm.min));
                }

                //添加地图插件
                AMap.plugin(['AMap.ToolBar','AMap.Scale','AMap.OverView'],
                    function(){
                        map.addControl(new AMap.ToolBar());

                        map.addControl(new AMap.Scale());
                    });

                //获取地图缩放比
               /* AMap.event.addListener(map,'zoomend',function(){
                    document.getElementById('info').innerHTML = '当前缩放级别：' + map.getZoom();
                });*/

                //根据地址获取经纬度，或根据经纬度获取地址
                /* AMap.service('AMap.Geocoder',function(){//回调函数
                 //实例化Geocoder
                 var geocoder = new AMap.Geocoder();
                 //TODO: 使用geocoder 对象完成相关功能

                 var lnglatXY=[31.2425647229,121.4709521602];//地图上所标点的坐标121.4859
                 geocoder.getAddress(lnglatXY, function(status, result) {
                 console.log(status + ";根据经纬度获取地址---" + JSON.stringify(result));
                 if (status === 'complete' && result.info === 'OK') {
                 //获得了有效的地址信息:
                 //即，result.regeocode.formattedAddress
                 }else{
                 //获取地址失败
                 }
                 });
                 geocoder.getLocation("上海浦东国际机场1号航站楼", function(status, result) {
                 console.log(status + ";根据地址获取经纬度====；" + JSON.stringify(result));
                 if (status === 'complete' && result.info === 'OK') {
                 //TODO:获得了有效经纬度，可以做一些展示工作
                 //比如在获得的经纬度上打上一个Marker
                 }else{
                 //获取经纬度失败
                 }
                 });
                 })*/
                //上车前
                vm.outCar = function(res,outTimer){
                    console.log("[outCar --实时查询订单---]");
                    console.log(JSON.stringify(res));
                    if(res.success){
                        _.extend(vm,res.result);

                        //res.orderState    00初始订单 01等待接单 02司机已接单  03已上车 04取消行程，代扣中
                        //                  05已取消 06已关闭 07行程结束，代扣中 08代扣失败 09部分代扣成功 10已完成
                        vm.timer = outTimer;
                        if(vm.orderState === "02"){//如果还在等待司机
                            vm.goingLngLat[0] = vm.dlng?vm.dlng : vm.goingLngLat[0];//司机实时经度位置
                            vm.goingLngLat[1] = vm.dlat?vm.dlat : vm.goingLngLat[1];//司机实时纬度位置

                            console.log(vm.goingLngLat[0]+ ";888888888888888888888--" +vm.goingLngLat[1] + "--" + map.getZoom() + ";-" + map.getScale());
                            //marker_content.hide();
                            marker_car.setPosition(vm.goingLngLat);

                            var getEstimateRouteParams = {
                                flng: vm.goingLngLat[0]+"",
                                flat: vm.goingLngLat[1]+"",
                                tlng:vm.startLngLat[0]+"",
                                tlat:vm.startLngLat[1]+"",
                                productType:shareData.myOrder.productType,//201 专车  301 快车
                                cityCode:vm.cityCode
                            };
                            DataService.run("getEstimateRoute",getEstimateRouteParams,function(getEstimateRouteRes){
                                console.log("[上车前-预估行程查询]" + JSON.stringify(getEstimateRouteRes));
                                getEstimateRouteRes.result =getEstimateRouteRes.result || {
                                    "dist": 21133,
                                    "duration": 2665,
                                    "slowTime": 315
                                };
                                if(getEstimateRouteRes.result){
                                    _.extend(vm,getEstimateRouteRes.result);
                                    vm.km = (vm.dist<100)?0.1:(vm.dist/1000).toFixed(1);
                                    vm.min = (vm.duration<60)?1:parseInt(vm.duration/60);//行驶时间 四舍五入
                                    //marker_content.setPosition(vm.goingLngLat);
                                    //marker_content.setContent($scope.getMapcontentOutCar(vm.km,vm.min));
                                    //marker_content.show();
                                }

                            });
                        }else if(vm.orderState === "03"){//已上车
                            //跳转到boundForDestination 页面
                         //   alert("已上车");
                            vm.title = "您已上车";
                            vm.contentLab = "终点";
                            $interval.cancel(outTimer);//如果状态改变，中断调用
                            queryStatus.run(60*1000,{orderNo:vm.orderNo},vm.inCar);
                           // return;
                        }

                    }
                }
                //上车后
                vm.inCar = function(res,intimer){
                    console.log("[inCar --实时查询订单---]");
                    console.log(JSON.stringify(res));
                    //测试用
                  /*  res.result = {"dlng": parseInt(vm.startLngLat[0]),"dlat":parseInt(vm.startLngLat[1]),"success":true};
                    vm.orderState = "03";
                    res.success = true;
                   res.result.dlng = (parseFloat(vm.startLngLat[0]) - 0.007);
                    res.result.dlat =(parseFloat(vm.startLngLat[1]) - 0.003);
                    vm.startLngLat[0] =  res.result.dlng;
                    vm.startLngLat[1] =  res.result.dlat;*/
                    if(res.success){
                        _.extend(vm,res.result);
                        //res.orderState    00初始订单 01等待接单 02司机已接单  03已上车 04取消行程，代扣中
                        //                  05已取消 06已关闭 07行程结束，代扣中 08代扣失败 09部分代扣成功 10已完成
                        vm.timer = intimer;
                        if(vm.orderState !== "03") {// 已上车，还在车上
                            $interval.cancel(intimer);//如果状态改变，中断调用
                            $state.go("orderDetail", {orderNo: vm.orderNo});
                        }
                        console.log(vm.goingLngLat[0]+ ";9999999--" +vm.goingLngLat[1] + "--" + map.getZoom() + ";-" + map.getScale());
                        //marker_content.hide();
                        if(vm.dlng && vm.dlat){//如果车经纬度有变化
                            vm.goingLngLat[0] = vm.dlng;//司机实时经度位置
                            vm.goingLngLat[1] = vm.dlat;//司机实时纬度位置
                            marker_car.setPosition(vm.goingLngLat);//
                            //自驾路线规划
                            vm.driving.search(vm.goingLngLat,vm.endLngLat);
                        }

                        var getEstimateRouteParams = {
                            flng: vm.goingLngLat[0]+"",
                            flat: vm.goingLngLat[1]+"",
                            tlng:vm.endLngLat[0]+"",
                            tlat:vm.endLngLat[1]+"",
                            productType:shareData.myOrder.productType,//201 专车  301 快车
                            cityCode:shareData.myOrder.cityCode
                        };
                        DataService.run("getEstimateRoute",getEstimateRouteParams,function(getEstimateRouteRes){
                            console.log("[上车前-预估行程查询]" + JSON.stringify(getEstimateRouteRes));
                            getEstimateRouteRes.result =getEstimateRouteRes.result || {
                                "dist": 21133,
                                "duration": 2665,
                                "slowTime": 315
                            };
                            if(getEstimateRouteRes.result){
                                _.extend(vm,getEstimateRouteRes.result);
                                vm.km = (vm.dist<100)?0.1:(vm.dist/1000).toFixed(1);//将米  转为 km
                                vm.min = (vm.duration<60)?1:parseInt(vm.duration/60);//行驶时间 四舍五入
                               /* marker_content.setPosition(vm.startLngLat);
                                marker_content.setContent($scope.getMapcontentInCar(vm.km,vm.min));
                                marker_content.show();*/
                            }

                        });
                    }
                }
                //return ;//测试用
                if(shareData.myOrder.orderState === "02"){ //如果是上车前
                    queryStatus.run(10*1000,{orderNo:vm.orderNo},vm.outCar);
                }else{//上车后
                    queryStatus.run(60*1000,{orderNo:vm.orderNo},vm.inCar);
                }

            }
        ]);
})();