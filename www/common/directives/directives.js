/*ionScrollMinh && timePicker
 *
 *原型来自 github：https://github.com/minh8023/ionic-citypicker
 *
 *Modified by Cici 5/5/2017
 */
(function() {
    'use strict';
    angular.module('common.directives', ['ionic'])
        .directive('ionScrollMinh', [
            '$timeout',
            '$controller',
            '$ionicBind',
            '$ionicConfig',
            function($timeout, $controller, $ionicBind, $ionicConfig) {
                return {
                    restrict: 'E',
                    scope: true,
                    controller: function() {},
                    compile: function(element, attr) {
                        var scrollCtrl;
                        element.addClass('scroll-view ionic-scroll');
                        //We cannot transclude here because it breaks element.data() inheritance on compile
                        var innerElement = angular.element('<div class="scroll"></div>');
                        innerElement.append(element.contents());
                        element.append(innerElement);

                        var nativeScrolling = attr.overflowScroll !== "false" && (attr.overflowScroll === "true" || !$ionicConfig.scrolling.jsScrolling());

                        return { pre: prelink };

                        function prelink($scope, $element, $attr) {
                            $ionicBind($scope, $attr, {
                                direction: '@',
                                paging: '@',
                                $onScroll: '&onScroll',
                                $onScrollComplete: '&onScrollComplete',
                                scroll: '@',
                                scrollbarX: '@',
                                scrollbarY: '@',
                                zooming: '@',
                                minZoom: '@',
                                maxZoom: '@'
                            });
                            $scope.direction = $scope.direction || 'y';

                            if (angular.isDefined($attr.padding)) {
                                $scope.$watch($attr.padding, function(newVal) {
                                    innerElement.toggleClass('padding', !!newVal);
                                });
                            }
                            if ($scope.$eval($scope.paging) === true) {
                                innerElement.addClass('scroll-paging');
                            }

                            if (!$scope.direction) { $scope.direction = 'y'; }
                            var isPaging = $scope.$eval($scope.paging) === true;

                            if (nativeScrolling) {
                                $element.addClass('overflow-scroll');
                            }

                            $element.addClass('scroll-' + $scope.direction);

                            var scrollViewOptions = {
                                el: $element[0],
                                delegateHandle: $attr.delegateHandle,
                                locking: ($attr.locking || 'true') === 'true',
                                bouncing: $scope.$eval($attr.hasBouncing),
                                paging: isPaging,
                                scrollbarX: $scope.$eval($scope.scrollbarX) !== false,
                                scrollbarY: $scope.$eval($scope.scrollbarY) !== false,
                                scrollingX: $scope.direction.indexOf('x') >= 0,
                                scrollingY: $scope.direction.indexOf('y') >= 0,
                                zooming: $scope.$eval($scope.zooming) === true,
                                maxZoom: $scope.$eval($scope.maxZoom) || 3,
                                minZoom: $scope.$eval($scope.minZoom) || 0.5,
                                preventDefault: true,
                                nativeScrolling: nativeScrolling,
                                scrollingComplete: onScrollComplete
                            };

                            if (isPaging) {
                                scrollViewOptions.speedMultiplier = 0.8;
                                scrollViewOptions.bouncing = false;
                            }
                            scrollCtrl = $controller('$ionicScroll', {
                                $scope: $scope,
                                scrollViewOptions: scrollViewOptions
                            });

                            function onScrollComplete() {
                                $scope.$onScrollComplete({
                                    scrollTop: scrollCtrl.scrollView.__scrollTop,
                                    scrollLeft: scrollCtrl.scrollView.__scrollLeft
                                });
                            }
                            $scope.$on('$destroy', function() {
                                if (scrollViewOptions) {
                                    scrollViewOptions.scrollingComplete = null;
                                    delete scrollViewOptions.el;
                                }
                                innerElement = null;
                                $element = null;
                                attr.$$element = null;
                            });
                        }
                    }
                };
            }
        ])
        .directive('timePicker', ["TD",'$rootScope', '$ionicPopup', 'BpPopup', 'TimeService', '$timeout', '$ionicScrollDelegate', '$ionicModal', function(TD,$rootScope, $ionicPopup, BpPopup, TimeService, $timeout, $ionicScrollDelegate, $ionicModal) {
            function isBoolean(value) {
                return typeof value === 'boolean'
            }

            function isArray(value) {
                return toString.apply(value) === '[object Array]'
            }

            function formatDate(date) {
                // 时间转换 '2017/05/05 17:00:00'--> 5月5日 17:00 周四
                var _date = new Date(date);
                return _date.getMonth() + 1 + '月' + _date.getDate() + '日 ' + _date.getHours() + ':' + (_date.getMinutes() == 0 ? '00' : _date.getMinutes()) + ' ' + ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][_date.getDay()]
            }
            return {
                restrict: 'AE',
                template: '<div class={{vm.cssClass}}><span>{{vm.areaData}}</span></div></div>',
                scope: {
                    options: '=options'
                },
                link: function(scope, element, attrs) {
                    var vm = scope.vm = {},
                        so = scope.options,
                        citypickerModel = null;
                    vm.uuid = Math.random().toString(36).substring(3, 8)
                    vm.provinceHandle = 'province-' + vm.uuid
                    vm.cityHandle = 'city-' + vm.uuid
                    vm.countryHandle = 'country-' + vm.uuid
                    vm.buttonText = so.buttonText || '确定'
                    vm.cssClass = 'ionic-citypicker ' + (angular.isDefined(so.cssClass) ? so.cssClass : '')
                    vm.barCssClass = angular.isDefined(so.barCssClass) ? so.barCssClass : 'bar-stable'
                    vm.backdrop = isBoolean(so.backdrop) ? so.backdrop : true
                    vm.backdropClickToClose = isBoolean(so.backdropClickToClose) ? so.backdropClickToClose : false
                    vm.hardwareBackButtonClose = isBoolean(so.hardwareBackButtonClose) ? so.hardwareBackButtonClose : true
                    vm.watchChange = isBoolean(so.watchChange) ? so.watchChange : false
                    vm.step = so.step || 44 // 滚动步长 （li的高度）
                    vm.defaultAreaData = [$rootScope.dateFormat(new Date(), "yyyy/MM/dd"), 'now']
                    vm.valueData = angular.isDefined(so.valueData) ? so.valueData : null
                    vm.areaData = vm.valueData ? formatDate(vm.valueData) : '现在用车'
                    vm.returnOk = function() {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0014","滴滴出行_首页_点击确定用车时间");
                        var s_areaData = '';
                        var v_areaData = null;
                        if (vm.province.name == '今天' && vm.city.name == '现在') {
                            s_areaData = '现在用车';
                        } else {
                            if (vm.city && vm.city.sub && vm.city.sub.length > 0) {
                                s_areaData = vm.province.names.split('-')[0] + ' ' + vm.city.value + ':' + vm.country.value + ' ' + vm.province.names.split('-')[1]
                                v_areaData = vm.province.value + ' ' + vm.city.value + ':' + vm.country.value
                            } else {
                                s_areaData = vm.province.names.split('-')[0] + ' ' + vm.city.value + ' ' + vm.province.names.split('-')[1]
                                v_areaData = vm.province.value + ' ' + vm.city.value
                            }
                        }
                        so.areaData = vm.areaData = s_areaData
                        so.valueData = vm.valueData = v_areaData == null ? v_areaData : $rootScope.dateFormat(new Date(v_areaData), "yyyy-MM-dd hh:mm:ss");
                        $timeout(function() {
                            citypickerModel && citypickerModel.hide()
                            so.buttonClicked && so.buttonClicked()
                        }, 50)
                    }
                    vm.returnCancel = function() {
                        TD.TalkingData.onEventWithLabel("ddcx_0001_0015","滴滴出行_首页_点击取消用车时间");
                        citypickerModel && citypickerModel.hide()
                        $timeout(function() {
                            vm.initAreaData(vm.valueData)
                        }, 150)
                    }
                    vm.clickToClose = function() {
                        vm.backdropClickToClose && vm.returnCancel()
                    }
                    vm.getValue = function(name) {
                        $timeout.cancel(vm.runing)
                        switch (name) {
                            case 'province':
                                if (!vm.AreaService) { BpPopup.Toast('province数据出错，请重试') }
                                var province = true,
                                    Handle = vm.provinceHandle,
                                    HandleChild = vm.cityHandle
                                break
                            case 'city':
                                if (!vm.province.sub) { BpPopup.Toast('city数据出错，请重试') }
                                var city = true,
                                    Handle = vm.cityHandle
                                var HandleChild = vm.countryHandle
                                break
                            case 'country':
                                if (!vm.city.sub) { BpPopup.Toast('country数据出错，请重试') }
                                var country = true,
                                    Handle = vm.countryHandle,
                                    HandleChild = null;
                                break
                        }
                        var top = $ionicScrollDelegate.$getByHandle(Handle).getScrollPosition().top // 当前滚动位置
                        var step = Math.round(top / vm.step)

                        Handle && ($ionicScrollDelegate.$getByHandle(Handle).scrollTo(0, step * vm.step, true))

                        vm.runing = $timeout(function() {
                            province && (vm.province = vm.AreaService[step], vm.city = vm.province.sub[0], vm.country = {}, (vm.city && vm.city.sub && (vm.country = vm.city.sub[0]))) //处理省市乡联动数据
                            city && (vm.city = vm.province.sub[step], vm.country = {}, (vm.city && vm.city.sub && (vm.country = vm.city.sub[0]))) // 处理市乡联动数据
                            country && (vm.country = vm.city.sub[step]) // 处理乡数据
                            HandleChild && $ionicScrollDelegate.$getByHandle(HandleChild).scrollTop() // 初始化子scroll top位
                        }, 60)
                    }
                    vm.initAreaData = function(AreaData) {
                        if (AreaData) {
                            AreaData = [AreaData.split(' ')[0], AreaData.split(' ')[1].split(':')[0], AreaData.split(' ')[1].split(':')[1]]
                        } else {
                            AreaData = vm.defaultAreaData
                        }
                        if (AreaData[0]) { // 初始化省
                            for (var i = 0; i < vm.AreaService.length; i++) {
                                if (AreaData[0] == vm.AreaService[i].value) {
                                    $ionicScrollDelegate.$getByHandle(vm.provinceHandle).scrollTo(0, i * vm.step)
                                    vm.province = vm.AreaService[i]
                                    break
                                }
                            }
                        }
                        if (AreaData[1] && vm.province && vm.province.sub) { // 初始化市
                            for (var i = 0; i < vm.province.sub.length; i++) {
                                if (AreaData[1] == vm.province.sub[i].value) {
                                    $ionicScrollDelegate.$getByHandle(vm.cityHandle).scrollTo(0, i * vm.step)
                                    vm.city = vm.province.sub[i]
                                    break
                                }
                            }
                        }
                        if (AreaData[2] && vm.city && vm.city.sub) { // 初始化区
                            for (var i = 0; i < vm.city.sub.length; i++) {
                                if (AreaData[2] == vm.city.sub[i].value) {
                                    $ionicScrollDelegate.$getByHandle(vm.countryHandle).scrollTo(0, i * vm.step)
                                    vm.country = vm.city.sub[i]
                                    break
                                }
                            }
                        }
                    }
                    if (vm.watchChange) {
                        scope.$watch('options.areaData', function(newVal, oldVal) {
                            if (newVal !== oldVal && isArray(newVal) && newVal.length > 1 && newVal.join(vm.tag) !== vm.areaData) {
                                if (vm.isCreated) {
                                    vm.initAreaData(newVal)
                                } else {
                                    vm.defaultAreaData = newVal
                                }
                                vm.areaData = newVal.join(vm.tag)
                            }
                        })
                    }
                    element.on("click", function() {
                        if (citypickerModel) {
                            TD.TalkingData.onEventWithLabel("ddcx_0001_0013","滴滴出行_首页_点击选择用车时间");
                            citypickerModel.show()
                            vm.AreaService = TimeService.getDataTime(); //每次打开picker都要初始化一次时间
                            return false
                        }
                        vm.isCreated = true
                        $ionicModal.fromTemplateUrl('business/main/timePicker.tpl.html', {
                            scope: scope,
                            animation: 'slide-in-up',
                            backdropClickToClose: vm.backdropClickToClose,
                            hardwareBackButtonClose: vm.hardwareBackButtonClose,
                        }).then(function(modal) {
                            citypickerModel = modal;
                            vm.AreaService = TimeService.getDataTime();
                            $timeout(function() {
                                citypickerModel.show();
                                vm.initAreaData(vm.valueData)
                            }, 50)
                        })
                    })
                    scope.$on('$destroy', function() {
                        citypickerModel && citypickerModel.remove();
                    });
                }
            }
        }])
})();
