/*
 *  Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

var configlBaaSLoader = new configlBaaSLoader();

function configlBaaSLoader() {
    this.load = function (paramObject) {
        var self = this, currMenuObj = globalObj.currMenuObj,
            hashParams = paramObject['hashParams'],
            rootDir = currMenuObj['resources']['resource'][1]['rootDir'],
            pathView = rootDir + '/js/views/lbCfgView.js',
            renderFn = paramObject['function'];

        if (self.lbCfgView == null) {
            requirejs([pathView], function (lbCfgView) {
                 self.lbCfgView = new lbCfgView();
                 self.renderView(renderFn, hashParams);
             });
        } else {
            self.renderView(renderFn, hashParams);
        }
    }
    this.renderView = function (renderFn, hashParams) {
        $(contentContainer).html("");
        this.lbCfgView[renderFn]({hashParams: hashParams});
    };

    this.updateViewByHash = function (hashObj, lastHashObj) {
        var renderFn;
        this.load({hashParams: hashObj, 'function': renderFn});
    };

    this.destroy = function () {
        ctwu.destroyDOMResources(ctwl.CFG_LB_PREFIX_ID);
    };
}
