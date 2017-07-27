(function() {
    'use strict';
    angular.module('talkingData', []).factory('TD', ['$window',
        function($window) {

            var TD = {
                eventId: '',
                setEventId: function(eventId) {
                    TD.eventId = eventId;
                },
                isWebviewFlag: false,
                setWebViewFlag: function() {
                    this.isWebviewFlag = true;
                    console.log("isWebviewFlag = " + this.isWebviewFlag);
                },
                loadURL: function(url) {
                    var iFrame;
                    iFrame = document.createElement("iframe");
                    iFrame.setAttribute("style", "display:none;");
                    iFrame.setAttribute("height", "0px");
                    iFrame.setAttribute("width", "0px");
                    iFrame.setAttribute("frameborder", "0");
                    iFrame.setAttribute("src", url);
                    document.body.appendChild(iFrame);
                    iFrame.parentNode.removeChild(iFrame);
                    iFrame = null;
                },

                exec_talkingData: function(funName, args) {
                    console.log('TD exec_talkingData: ' + TD.isWebviewFlag + ' ' + JSON.stringify(args));
                    if (TD.isWebviewFlag) {
                        var commend = {
                            functionName: funName,
                            arguments: args
                        };

                        var jsonStr = JSON.stringify(commend);
                        var url = "talkingdata:" + jsonStr;
                        console.log("exec_talkingData url: " + url);
                        this.loadURL(url);
                    }
                },

                TalkingData: {
                    getDeviceId: function(callBack) {
                        TD.exec_talkingData("getDeviceId", [callBack.name]);
                    },
                    onEvent: function(eventId) {
                        TD.exec_talkingData("trackEvent", [eventId]);
                    },
                    onEventWithLabel: function(eventId, eventLabel) {
                        TD.exec_talkingData("trackEventWithLabel", [eventId, eventLabel]);
                    },
                    onEventWithParameters: function(eventId, eventLabel, eventData) {
                        TD.exec_talkingData("trackEventWithParameters", [eventId, eventLabel, eventData]);
                    },
                    onPageBegin: function(pageName) {
                        var pageName = pageName;
                        TD.exec_talkingData("trackPageBegin", [pageName]);
                    },
                    onPageEnd: function(pageName) {
                        var pageName = pageName;
                        TD.exec_talkingData("trackPageEnd", [pageName]);
                    },
                    setLocation: function(latitude, longitude) {
                        TD.exec_talkingData("setLocation", [latitude, longitude]);
                    }
                }
            };

            // TD.setEventId('水电煤新版');
            TD.setWebViewFlag();
            return TD;
        }
    ]);
})();
