/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */
var configBrowserLoader = new ConfigBrowserLoader();

function ConfigBrowserLoader() {
    this.load = function(paramObject) {
        var self = this,
            currMenuObj = globalObj.currMenuObj,
            hashParams = paramObject['hashParams'],
            rootDir = currMenuObj['resources']['resource'][0]['rootDir'],
            pathConfigBrowserView = ctBaseDir + '/config/configBrowser/ui/js/views/configBrowserView.js',
            renderFn = paramObject['function'],
            loadingStartedDefObj = paramObject['loadingStartedDefObj'];

        if(self.configBrowserView == null) {
            require([pathConfigBrowserView], function(ConfigBrowserView){
                self.configBrowserView = new ConfigBrowserView();
                self.renderView(renderFn, hashParams);
                
            });
        } else {
            self.renderView(renderFn, hashParams);
        }
    };

    this.renderView = function(renderFn, hashParams) {
        $(contentContainer).html("");
        this.configBrowserView.renderConfig({
                hashParams: hashParams
            });
    };

    this.updateViewByHash = function(hashObj, lastHashObj) {
        var renderFn;
        this.load({
            hashParams: hashObj,
            'function': renderFn
        });
    };

    this.destroy = function() {};
}
