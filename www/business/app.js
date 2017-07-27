(function() {
    'use strict';
    angular.module('ngIOS9UIWebViewPatch', ['ng']).config(['$provide',
        function($provide) {
            'use strict';

            $provide.decorator('$browser', ['$delegate', '$window',
                function($delegate, $window) {

                    if (isIOS9UIWebView($window.navigator.userAgent)) {

                        return applyIOS9Shim($delegate);
                    }

                    return $delegate;

                    function isIOS9UIWebView(userAgent) {
                        return /(iPhone|iPad|iPod).* OS 9_\d/.test(userAgent) && !/Version\/9\./.test(userAgent);
                    }

                    function applyIOS9Shim(browser) {
                        var pendingLocationUrl = null;
                        var originalUrlFn = browser.url;

                        browser.url = function() {
                            if (arguments.length) {
                                pendingLocationUrl = arguments[0];
                                return originalUrlFn.apply(browser, arguments);
                            }

                            return pendingLocationUrl || originalUrlFn.apply(browser, arguments);
                        };

                        window.addEventListener('popstate', clearPendingLocationUrl, false);
                        window.addEventListener('hashchange', clearPendingLocationUrl, false);

                        function clearPendingLocationUrl() {

                            pendingLocationUrl = null;
                        }

                        return browser;
                    }
                }
            ]);
        }
    ]);
    var appModuleList = [
        'ionic',
        'ngIOS9UIWebViewPatch',
        'common.services',
        'common.directives',
        'common.filters',
        'common.shareDataService',
        'common.popupService',
        'common.aMapService',
        'talkingData',
        'app.Global',
        'templates',
        'Main',
        'Order',
        'orderDetail',
        'orderCancel',
        'spec',
        'city',
        'waitAnswer',
        'searchPlace',
        'indexDetail',
        'cancelTrip',
        'address',
        'startPoint',
        'agreement',
        'appraise',
        'caculateRule',
        'waitDriver',
    ];
    angular.module('app', appModuleList)
        .run(function($ionicPlatform, $rootScope) {
            $ionicPlatform.ready(function() {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
            });
            var viewportWidth = document.documentElement.clientWidth;
            console.log('[viewportWidth]:' + viewportWidth);
            var rootSize = viewportWidth > 600 ? 65 : viewportWidth * (100 / 750);
            document.documentElement.style['font-size'] = rootSize + 'px';
            window.forge = true;
        })
        .config(function($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider) {
            $ionicConfigProvider.tabs.position("bottom");
            $ionicConfigProvider.tabs.style("standard");
            $ionicConfigProvider.backButton.previousTitleText(false).text('').icon('ion-ios-arrow-back');

            $urlRouterProvider.otherwise('/index');
        })

    angular.module("templates", []);

    var ctrls = angular.module('app.Global', ['ionic', 'common.services'])
    ctrls
        .controller('GlobalCtrl', ["$scope",
            "$rootScope", "$state", "$ionicLoading", "$ionicModal", "$timeout", "$ionicHistory", "$ionicScrollDelegate", "$ionicTabsDelegate", "$sce", "DataService", "$ionicPopup", "$document", "TD", "ShareDataService",
            function($scope, $rootScope, $state, $ionicLoading, $ionicModal, $timeout, $ionicHistory, $ionicScrollDelegate, $ionicTabsDelegate, $sce, DataService, $ionicPopup, $document, TD, ShareDataService) {

                $rootScope.key = "H56JLrxVHOaycdMFH6UM";
                $scope.back = function() {
                    history.go(-1);
                }
                TD.setWebViewFlag(); //打卡talkingData开关
                $rootScope.showLoading = function() {
                    $ionicLoading.show();
                }
                $rootScope.hideLoading = function() {
                    $ionicLoading.hide();
                }
                $rootScope.showToast = function(msg) {
                    $ionicLoading.show({
                        noBackdrop: true,
                        hideOnStateChange: true,
                        duration: 1000,
                        template: msg || "Loding"
                    });
                }

                // window.$ionicScrollDelegate=$ionicScrollDelegate;
                $rootScope.resize = function() {
                    $ionicScrollDelegate.resize()
                };

                $rootScope.trustSrc = function(src) {
                    return $sce.trustAsResourceUrl(src);
                }

                $rootScope.cacheFlag = true;
                $rootScope.setCache = function(flag) {
                    $rootScope.cacheFlag = flag;
                }
                $rootScope.schemeUrl = "";

                var TDViewPageMap = {
                    "index": "滴滴出行-首页"
                };

                var currentViewBackFun = null; //定义返回事件，在点native title返回时执行。如果当前view的scope没有定义，则按历史返回
                $rootScope.$on('$ionicView.afterEnter', function(ev, data) {
                    console.log('rootScope after enter data :' + data.stateName);
                    if (data && data.title) {
                        //主动设置native title bar的标题
                        console.log('set title common:' + data.title);
                        App.setTitle(data.title);
                        console.log('rootScope after enter 1:' + data.title);
                    } else {
                        $rootScope.viewTitle && App.setTitle($rootScope.viewTitle);
                        console.log('rootScope after enter 2:' + data.title);
                    }

                    TD.TalkingData.onPageBegin(TDViewPageMap[data.stateName]);

                    if ((typeof ev.targetScope.onBack) != "undefined") {
                        //如果view的scope定义了返回方法，则先存起来，待后面点了native返回再执行
                        currentViewBackFun = ev.targetScope.onBack;
                    } else {
                        // 如果没有定义返回，则清空返回方法，以便历史返回
                        currentViewBackFun = null;
                    }
                });

                $rootScope.$on('$ionicView.beforeLeave', function(ev, data) {
                    console.log('rootScope before leave data :' + data.stateName);
                    TD.TalkingData.onPageEnd(TDViewPageMap[data.stateName]);

                    //隐藏右上角的按钮
                    App && App.hideTopRightBar && App.hideTopRightBar();
                    document.removeEventListener("topBarClick", $rootScope.topBarClick, false);
                    var input = document.querySelectorAll("input");
                    _.each(input, function(val) {
                        val.blur();
                    });
                });

                // 对通讯录导入的电话号码进行处理
                $rootScope.formatContact = function(phoneNo) {
                    if (!phoneNo) {
                        return;
                    }
                    var phone = phoneNo.replace(/-/g, "").replace('-', "").replace(/\s*/g, "").replace(/\D/g, "");
                    phone = phone.replace('-', "").replace('-', "").replace(' ', "");
                    if (phone.length > 11) {
                        if (phone.substring(0, 3) == "+86") {
                            phone = phone.substring(3, phone.length);
                        } else if (phone.substring(0, 2) == "86") {
                            phone = phone.substring(2, phone.length);
                        }
                        phone = phone.replace(/\+/g, "");
                        phone = phone.substring(0, 11);
                    } else {
                        phone = phone.replace(/\+/g, "");
                    }
                    return phone;
                }

                // 对Date的扩展，将 Date 转化为指定格式的String
                // 例子： 
                // dateFormat(date,"yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
                // dateFormat(date,"yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
                $rootScope.dateFormat = function(date, fmt) {
                    var o = {
                        "M+": date.getMonth() + 1, //月份 
                        "d+": date.getDate(), //日 
                        "h+": date.getHours(), //小时 
                        "m+": date.getMinutes(), //分 
                        "s+": date.getSeconds(), //秒 
                        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
                        "S": date.getMilliseconds() //毫秒 
                    };
                    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                    for (var k in o)
                        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                    return fmt;
                }

                if (typeof App != "undefined") {
                    // 在app里则捕获返回按钮
                    App.overrideBackPressed(true);
                    App.setKeyEventListener(function(event) {
                        if (event == 'backpress') {
                            $rootScope.hideLoading();
                            console.log("[Ionic History]: " + JSON.stringify($ionicHistory.viewHistory()));
                            var _history = $ionicHistory.viewHistory();
                            if (!_history.backView && !ShareDataService.orderAccess) {
                                App.exitApp();
                            } else if (currentViewBackFun) {
                                currentViewBackFun();

                            } else {
                                $ionicHistory.goBack();
                            }

                        }
                    });
                }

                $rootScope.setTopBar = function(type, url_text, callback) {
                    if (type != "text" && type != "localImage" && type != "remoteImage") {
                        return;
                    }
                    try {
                        // console.log("callback:" + callback);
                        var ff = callback;
                        // console.log("ffff:" + ff + ";; " + ff.name || ff.toString().match(/function\s*([^(]*)\(/)[1]);

                        var clientVer = App.getClientVersion();
                        clientVer = parseInt(clientVer.replace(/\./g, ""));
                        if (clientVer >= 504) { //
                            App.setTopRightBar({
                                type: type, //[text|localImage|remoteImage],        //类型，text为文本
                                value: url_text //case type{ when text then:文本内容， when ...Image then:图片路径}
                            });
                            var callback = callback || function() {
                                alert("please set you top event");
                                return;
                            };
                            document.removeEventListener("topBarClick", $rootScope.topBarClick, false);
                            document.addEventListener("topBarClick", callback, false);
                            $rootScope.topBarClick = callback;
                        } else { //不支持头部文本设置的客户端版本
                            $ionicLoading.show({
                                noBackdrop: true,
                                hideOnStateChange: true,
                                duration: 1000,
                                template: "客户端版本过低，顶部设置失败！请升级您的翼支付版本"
                            });
                            return;
                        }
                    } catch (e) {

                    }
                }
            }
        ])
})();
