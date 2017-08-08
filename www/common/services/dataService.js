(function() {
    'use strict';

    function dataService($http, $rootScope, $state, $ionicLoading, $ionicPopup, $q, BpPopup) {

        var _env = 2;
        var _isMock = false;

        var serverUrl = "",
            overUrl = "",
            adUrl = "";
        var errorCodes = ["FK0001", "AA0099", "AA0100", "900001", "000001", "000002", "000003", "000004",
            "000005", "SV0001", "EX0001", "RN0001", "RN0002", "SV0002", "MMJQ02", "MR0001", "NR0001", "C00001",
            "BZPR01", "BZPR02", "BZ0001", "BZ0002", "BZ0003", "BZ0006", "AM0002", "AM0003", "AM0004", "AM0005",
            "FK0002", "ORD020"
        ]; //特殊的错误码，做特殊提示
        (function() {
            switch (_env) {
                case 1:
                    // 生产
                    serverUrl = "https://mapi.bestpay.com.cn/mapi/";
                    overUrl = "https://mapi.bestpay.com.cn/mapi/";
                    adUrl = "https://mapi.bestpay.com.cn/";
                    break;
                case 2:
                    // 综测
                    serverUrl = "http://116.228.151.160:18002/mapi/";
                    overUrl = "http://116.228.151.160:18002/mapi/";
                    adUrl = "http://116.228.151.160:18002/";
                    break;
                case 3:
                    // 准生产
                    serverUrl = "https://mapi-pre.bestpay.com.cn/mapi/";
                    overUrl = "https://mapi-pre.bestpay.com.cn/mapi/";
                    adUrl = "https://mapi-pre.bestpay.com.cn/";
                    break;
                default:
                    serverUrl = "https://mapi.bestpay.com.cn/mapi/";
                    overUrl = "https://mapi.bestpay.com.cn/mapi/";
                    adUrl = "https://mapi.bestpay.com.cn/";
                    break;
            }
        })();

        var serverActions = null;

        function initialServerAction() {

            serverActions = {
                "adList": {
                    urlSuffix: "adList",
                    method: "POST",
                    overUrl: "https://mapi.bestpay.com.cn/mapi/adList",
                    initialParam: {},
                    response: {},
                    isMock: false,
                    hideTipOnError: true,
                    mockUrl: 'mockdata/adList.json'
                },
                "getPriceRule": {
                    urlSuffix: "getPriceRule",
                    method: "POST",
                    // overUrl: adUrl + "launch/api/adList",
                    initialParam: {},
                    response: {},
                    isMock: false,
                    hideTipOnError: true,
                    mockUrl: 'mockdata/getPriceRuleList.json'
                }
            }

            /*
             * interfaceName 接口名称
             * obj 接口下面需要配置的参数 ,如果不传，有默认值
             * exemple
             *       addInterface("queryCityCode",{
             *                    urlSuffix:"getBusiCities/V1",
             *                    mockUrl:""
             *       })
             * */
            function addInterface(interfaceName, obj) {
                if (!interfaceName) { //接口名称为必传参数
                    return;
                }
                serverActions[interfaceName] = {};
                var obj = obj || {};
                serverActions[interfaceName].urlSuffix = obj.urlSuffix || interfaceName;
                serverActions[interfaceName].method = obj.method || "POST";
                serverActions[interfaceName].initialParam = obj.initialParam || {};
                serverActions[interfaceName].response = obj.response || {};
                serverActions[interfaceName].isMock = obj.isMock || false;
                serverActions[interfaceName].mockUrl = obj.initialParam || "mockdata/" + interfaceName + ".json";
            }
            addInterface("getRedbagLink", { urlSuffix: "getRedbagLink" });
            addInterface("getCityIdByPoi", { urlSuffix: "getCityIdByPoi" });
            addInterface("cancelCar", { urlSuffix: "cancelCar" });
            addInterface("queryOrderState", { urlSuffix: "queryOrderState" });
            addInterface("getCityList", { urlSuffix: "getCityList" });
            addInterface("getAddresses", { urlSuffix: "getAddresses" });
            addInterface("getEstimateAmt", { urlSuffix: "getEstimateAmt" });
            addInterface("getEstimateRoute", { urlSuffix: "getEstimateRoute" });
            addInterface("bookCar", { urlSuffix: "bookCar" });
            addInterface("getOrderInfo", { urlSuffix: "getOrderInfo" });
            addInterface("getVoucherInfo", { urlSuffix: "getVoucherInfo" });
            addInterface("getAddressBook", { urlSuffix: "getAddressBook" });
            addInterface("manageAddressBook", { urlSuffix: "manageAddressBook" });
            addInterface("queryOrderList", { urlSuffix: "queryLocalOrder" });
            addInterface("getAmtDetail", { urlSuffix: "getAmtDetail" });
            addInterface("commentDriver", { urlSuffix: "commentDriver" });
            addInterface("cashierPlaceOrder", { urlSuffix: "cashierPlaceOrder" }); //收银台下单
        }

        initialServerAction();

        //common params add by King at 2016/12/13
        var DEVICE_IS_IOS = /iP(ad|hone|od)/.test(navigator.userAgent);
        var comParams = DEVICE_IS_IOS ? App.getCommonRequestParams() : JSON.parse(App.getCommonRequestParams()); //大厅参数
        //var comParams = {"SESSIONKEY":"6ba3d9d118c869d04bc4bfb5770956b5","CURRENTVERSION":"6.0.3",
        //    "IP":"fe80::f225:b7ff:fe07:d32e%wlan0","SYSTEM":"android","IMSI":"460016011511325",
        //    "SIG":"","BASEVERSION":"I9502ZNUHNK2","PHONE":"GT-I9502","BTMAC":"4C:3C:16:6F:0B:ED",
        //    "SYSVERSION":"4.4.2","V":"000001","IMEI":"355981058289556","DEVICENAME":"samsung",
        //    "WIFIMAC":"F0:25:B7:07:D3:2E","LOCALINFO":"{\"accuracy\":\"\",\"speed\":\"\",\"longitude\":\"121.60633\",\"latitude\":\"31.28415\"}",
        //    "KERNELVERSION":"3.4.5-3414878","TIMESTAMP":"000092"} // 测试参数
        //风控公共参数
        var appendCommonToParams = function(srcParams) {
            srcParams.optLocation = comParams.LOCALINFO ? JSON.parse(comParams.LOCALINFO).latitude + "," + JSON.parse(comParams.LOCALINFO).longitude : ""; //经纬度
            srcParams.optTime = $rootScope.dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss"); //业务操作时间
            srcParams.os = comParams.SYSTEM; //设备操作系统
            srcParams.osVersion = comParams.SYSVERSION; //设备操作系统版本
            srcParams.port = ""; //客户端设备请求（接口）
            srcParams.bestpayId = ""; //翼支付唯一标识
            srcParams.clientVersion = App.getClientVersion(); //客户端版本
            srcParams.deviceName = comParams.DEVICENAME; //客户端设备名称
            srcParams.deviceModel = comParams.PHONE; //设备型号
            srcParams.wifiMac = comParams.WIFIMAC; //wifi MAC地址
            srcParams.wifiName = ""; //wifi名称
            srcParams.network = ""; //网络类型
            srcParams.cellId = ""; //基站ID
            srcParams.lac = ""; //基站LAC
            srcParams.isRooted = ""; //是否root
            srcParams.imei = DEVICE_IS_IOS ? comParams.AIDENTIFIER : comParams.IMEI; //国际移动设备标识
            srcParams.imsi = DEVICE_IS_IOS ? comParams.AIDENTIFIER : comParams.IMSI; //国际移动用户  
            // ios的IMEI和IMSI获取不到，我们把这个AIDENTIFIER这个字段值赋给IMEI和IMSI，如果是Android，不变  from liuxiaoyu on 7/6/2017
            srcParams.mobileMac = ""; //手机MAC
            srcParams.mobileIp = comParams.IP; //手机IP
            srcParams.kernelVersion = comParams.BASEVERSION; //内核版本
            srcParams.identifierId = ""; //设备唯一  标识符属性
            srcParams.memo = ""; //备注信息
            srcParams.bizChannel = "38"; //业务渠道类型  默认为38
            srcParams.channel = "08"; //渠道类型 默认为08
            srcParams.btMac = comParams.BTMAC;
            /**/
            /* var product = User.getProduct();
             var deviceID = Preference.get(product + "deviceID","");
             if(deviceID == ""){
                 var timestamp = (new Date()).valueOf();//获取时间戳
                 Preference.put(product + "deviceID",timestamp);//将时间戳存为唯一标示
                 deviceID = timestamp;//时间戳设置为设备唯一标示
             }
             srcParams.deviceID = deviceID;*/
            // srcParams.deviceID = "6789";//和林炎确认，先随便传一个值，等后期优化 由于 Preference.put(product + "deviceID",timestamp);这里会导致ios闪退

            console.log("分控参数==========" + JSON.stringify(srcParams));
            return srcParams
        }

        function decorateParams(params) {
            var phoneNo = (User && User.getProduct()) || '';
            var sessionKey = (App && App.getSessionKey()) || '';
            var timestamp = $rootScope.dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss');
            var _params = {
                timestamp: timestamp,
                fromchannelId: "H5Client",
                sign: "123",
                sessionKey: sessionKey,
                phoneNo: phoneNo,
                productNo: phoneNo,
                keep: ""
            }
            _.extend(_params, params);
            _params.sign = _params.sign.toUpperCase();
            return _params;
        };

        return {
            getInitialParam: function(actionName) {
                var curAction = serverActions[actionName];
                return curAction.initialParam;
            },
            log: function() {
                console.log(111)
            },

            getResponse: function(actionName) {
                return serverActions[actionName].response;
            },
            run: function(actionName, data, successFunc, errFunc, completeFunc, isRetry, lodingConfig, isSafe) {
                /* actionName为serverActions的key
                 *  data为参数，如果不传，则使用初始化时那个对象
                 *  successFunc请求成功的返回
                 *  errFunc请求失败的返回
                 *  completeFunc请求完成的返回
                 *  errFunc请求完成的返回
                 *  isRetry主要是用于处理超时等给用户重试弹框
                 *  lodingConfig 在请求前后是否显示loading
                 */
                var curAction = serverActions[actionName];
                var ajaxTimeout = data.timeout || 30000; //设置超时时间，默认时间为30秒
                // 显示loading
                lodingConfig && $rootScope.showLoading();

                // 请求函数
                function request(iniConfig) {
                    $http(iniConfig).success(function(result, status, header, config) {
                        lodingConfig && $rootScope.hideLoading();
                        if (errorCodes.indexOf(result.errorCode) !== -1) { //其他错误码统一处理提示用
                            if (result.errorCode == "FK0001") {
                                result.errorMsg = "您的账户被锁定，请联系客服95106";
                            } else {
                                result.errorMsg = "系统繁忙，请稍后再试，错误码：" + result.errorCode;
                            }
                        }
                        curAction.response = result;
                        console.log("[resp params]: " + JSON.stringify(result));
                        if (result.errorCode == "100003") {
                            App.autoLogin(function(newSessionKey) {
                                console.log('[autologin new sessionKey]:' + newSessionKey);
                                if (newSessionKey) {
                                    $http(iniConfig).success(function(result, status, header, config) {
                                        $rootScope.hideLoading();
                                        curAction.response = result;

                                        //如果设置了缓存，则缓存数据
                                        if (curAction.needCache) {
                                            window.localStorage.setItem(curAction.key, JSON.stringify(result))
                                        }
                                        if (successFunc) successFunc(result, status, header, config);
                                        // }

                                    }).error(function(result, state, headers, config) {
                                        $rootScope.hideLoading();
                                        BpPopup.showToast("未取得数据,请稍后再试。");
                                    }).then(function(result) {
                                        completeFunc && completeFunc();
                                    })
                                }
                            })
                            return
                        }
                        // result.errorCode = "API500005";result.errorMsg='123';
                        if (isRetry && result.errorCode == "API500005") {
                            $rootScope.hideLoading();
                            $ionicPopup.confirm({
                                cancelText: '取消',
                                okText: '重试',
                                title: result.errorMsg
                            }).then(function(res) {
                                if (res) {
                                    request(iniConfig);
                                }
                            })
                        }

                        //如果设置了缓存，则缓存数据
                        if (curAction.needCache) {
                            window.localStorage.setItem(curAction.key, JSON.stringify(result))
                        }
                        if (successFunc) successFunc(result, status, header, config);

                    }).error(function(result, state, headers, config) {
                        $rootScope.hideLoading();
                        !curAction.hideTipOnError && BpPopup.showToast("未取得数据,请稍后再试。");
                        if (errFunc) errFunc(result);
                    }).then(function(result) {
                        completeFunc && completeFunc();
                    })
                }

                // mock逻辑判断
                if (curAction.isMock || _isMock) {
                    console.log(data || curAction.initialParam);
                    //curAction.response = curAction.mockData;
                    var url = null;
                    lodingConfig && $rootScope.hideLoading()
                    url = curAction.mockUrl;
                    $http({
                        method: 'GET',
                        withCredentials: true,
                        params: data,
                        timeout: ajaxTimeout,
                        url: url
                    }).success(function(result) {
                        successFunc && successFunc(result);
                    }).error(function(result, state, headers, config) {
                        lodingConfig && $rootScope.hideLoading();
                        BpPopup.showToast("网络或服务器异常,请稍后再试.");
                    }).then(function(result) {
                        completeFunc && completeFunc();
                    })

                } else {
                    var localData = window.localStorage.getItem(curAction.key);

                    if (curAction.needCache && localData) {
                        //判断有无开启缓存及缓存中是否有数据，有则尝试从缓存中读
                        lodingConfig && $rootScope.hideLoading();
                        successFunc(JSON.parse(localData));
                    } else {
                        //考虑网络不给力情况
                        var networkType = App.getNetworkType();
                        var clientVersion = App.getClientVersion();
                        var version = clientVersion.replace(/[.]/g, "");
                        var version_int = parseInt(version); //获得版本号
                        if (version_int >= 516) {
                            // 因IOS将网络断开的状态误写为monet，所以在IOS上新版前，不得不按平台分别处理
                            if (networkType == "unline") {
                                BpPopup.showToast("网络已断开.");
                            }
                        } else {
                            // 因IOS将网络断开的状态误写为monet，所以在IOS上新版前，不得不按平台分别处理
                            if (((!DEVICE_IS_IOS) && (networkType == "unline")) || (DEVICE_IS_IOS && (networkType == "monet"))) {
                                BpPopup.showToast("网络已断开.");
                            }
                        }
                        var httpConfig = {
                            method: curAction.method,
                            withCredentials: false,
                            headers: {
                                'Content-Type': 'application/json;charset=utf-8'
                            },
                            url: curAction.overUrl ? curAction.overUrl : [serverUrl, curAction.urlSuffix].join("")
                        };

                        data = data || {};

                        var finalData = angular.extend({}, curAction.initialParam, data);
                        finalData = decorateParams(data);

                        // 加风控参数
                        if (isSafe) {
                            appendCommonToParams(finalData);
                        }

                        if (curAction.method.toUpperCase() != "GET" && curAction.method.toUpperCase() != "DELETE") {
                            httpConfig.data = finalData;
                        } else {
                            httpConfig.params = finalData;
                        }
                        console.log("[current url]:" + httpConfig.url);
                        console.log("[" + curAction.method + " params]: " + JSON.stringify(finalData));
                        request(httpConfig);
                    }
                }
            },
            buildReqConfig: function(actionName, reqConfig) {
                reqConfig = reqConfig || {};
                var curAction = serverActions[actionName];
                var _def = {
                    method: 'POST',
                    withCredentials: false,
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    url: '',
                    isMock: true,
                    mockData: '',
                    retry: true,
                    retryBefore: function() {}
                }
                reqConfig.url = [serverUrl, curAction.urlSuffix].join("");
                _def = _.extend(_def, curAction, reqConfig);
                _def.mockData = _def.mockUrl;

                if (_def.isMock || _isMock) {
                    // if (true) {
                    _def.url = curAction.mockUrl;
                    _def.method = 'GET';
                }

                console.log('def:' + JSON.stringify(_def));
                return _def
            },
            http: function(reqConfig, params, q) {
                var that = this;
                console.log('reqConfig:' + JSON.stringify(reqConfig));
                var defer = q || $q.defer(); //声明延后执行

                var _defReqConfig = reqConfig;

                if (!_defReqConfig) {
                    _defReqConfig = {
                        method: 'POST',
                        withCredentials: false,
                        headers: {
                            'Content-Type': 'application/json;charset=utf-8'
                        }
                    }
                }

                var networkType = App.getNetworkType();
                var clientVersion = App.getClientVersion();
                var version = clientVersion.replace(/[.]/g, "");
                var version_int = parseInt(version); //获得版本号
                if (version_int >= 516) {
                    // 因IOS将网络断开的状态误写为monet，所以在IOS上新版前，不得不按平台分别处理
                    if (networkType == "unline") {
                        BpPopup.showToast("网络已断开。");
                    }
                } else {
                    // 因IOS将网络断开的状态误写为monet，所以在IOS上新版前，不得不按平台分别处理
                    if (((!DEVICE_IS_IOS) && (networkType == "unline")) || (DEVICE_IS_IOS && (networkType == "monet"))) {
                        BpPopup.showToast("网络已断开。");

                    }
                }

                var httpConfig = {
                    method: _defReqConfig.method,
                    withCredentials: _defReqConfig.withCredentials,
                    headers: _defReqConfig.headers,
                    url: _defReqConfig.url
                };

                params = params || {}
                var finalData = decorateParams(params);

                if (httpConfig.method.toUpperCase() !== 'GET' && httpConfig.method.toUpperCase() !== 'DELETE') {
                    httpConfig.data = finalData;
                } else {
                    httpConfig.params = finalData;
                }

                $http(httpConfig)
                    .success(function(data, status, headers, config) {
                        console.log('[success ' + _defReqConfig.url + ' result]' + JSON.stringify(data));
                        defer.resolve(data); //声明执行成功
                    })
                    .error(function(data, status, headers, config) {

                        console.log('[error ' + _defReqConfig.url + ' result]' + JSON.stringify(data));

                        if (!_defReqConfig.retry) {
                            //不弹出点击重试的弹框
                            defer.reject(data);
                            return
                        }

                        _defReqConfig.retryBefore && _defReqConfig.retryBefore();

                        var _defRetryOptions = {
                            title: '网络失败',
                            template: '网络好像开小差了，请再试一下！',
                            cancelText: '取消',
                            okText: '重试'
                        }

                        var retryOptions = _.isFunction(_defReqConfig.retry) ? _defReqConfig.retry(data) : (_.isObject(_defReqConfig.retry) ? _defReqConfig.retry : {});

                        _defRetryOptions = _.extend(_defRetryOptions, retryOptions);

                        /**
                         * [点击重试的弹框]
                         */
                        var confirmPopup = $ionicPopup.confirm(_defRetryOptions);
                        confirmPopup.then(function(res) {
                            if (res) {
                                console.log('Choose RETRY');
                                //重新发起请求，defer为原来的
                                that.http(reqConfig, params, defer);
                            } else {
                                console.log('Choose CANCLE');
                                //选择Cancel的时候执行失败
                                defer.reject(data);
                            }
                        });

                    });

                return defer.promise; //返回承诺，返回获取数据的API
            }
        };
    }

    angular.module('common.services', [])
        .factory('DataService', dataService);
})();
