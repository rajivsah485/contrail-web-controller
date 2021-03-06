/*
 *  Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */

var packetCapturePageLoader = new PacketCapturePageLoader();

function PacketCapturePageLoader() {
    this.load = function (paramObject) {
        var self = this, currMenuObj = globalObj.currMenuObj,
            hashParams = paramObject['hashParams'],
            rootDir = currMenuObj['resources']['resource'][0]['rootDir'],
            pathMNView = ctBaseDir + '/monitor/debug/packetcapture/ui/js/views/packetCaptureView.js',
            renderFn = paramObject['function'],
            loadingStartedDefObj = paramObject['loadingStartedDefObj'];

        require([pathMNView], function (PacketCaptureView) {
            self.packetCaptureView = new PacketCaptureView();
            self.renderView(renderFn, hashParams);
            if(contrail.checkIfExist(loadingStartedDefObj)) {
                loadingStartedDefObj.resolve();
            }
        });
    }
    this.renderView = function (renderFn, hashParams) {
        $(contentContainer).html("");
        switch (renderFn) {
            case 'renderPacketCapture':
                this.packetCaptureView[renderFn]({hashParams: hashParams});
                break;
        }
    };

    this.updateViewByHash = function (hashObj, lastHashObj) {
        var renderFn;
        this.load({hashParams: hashObj, 'function': renderFn});
    };

    this.destroy = function () {
    };
}
