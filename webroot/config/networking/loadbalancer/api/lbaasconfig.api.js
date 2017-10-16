/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

/**
 * @lbaasconfig.api.js - Handlers to manage lBaaS resources - Interfaces with
 *                     config api server
 */

var rest = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/common/rest.api');
var async = require('async');
var vnconfigapi = module.exports;
var logutils = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/utils/log.utils');
var commonUtils = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/utils/common.utils');
var messages = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/common/messages');
var global = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/common/global');
var appErrors = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/errors/app.errors');
var util = require('util');
var url = require('url');
var configApiServer = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/common/configServer.api');
var jsonDiff = require(process.mainModule.exports["corePath"]
        + '/src/serverroot/common/jsondiff');
var _ = require('underscore');
var jsonPath = require('JSONPath').eval;

/**
 * Bail out if called directly as "nodejs lbaasconfig.api.js"
 */
if (!module.parent) {
    logutils.logger.warn(util.format(messages.warn.invalid_mod_call,
            module.filename));
    process.exit(1);
}

/**
 * @listLoadBalancers public function 1. URL
 *                    /api/tenants/config/lbaas/load-balancers 2. Gets list of
 *                    load balancer from config api server 3. Needs tenant id
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function listLoadBalancers(request, response, appData) {
    var tenantId = null;
    var requestParams = url.parse(request.url, true);
    var lbListURL = '/loadbalancers';

    if (requestParams.query && requestParams.query.tenant_id) {
        tenantId = requestParams.query.tenant_id;
        lbListURL += '?parent_type=project&parent_fq_name_str='
                + tenantId.toString();
    }

    configApiServer.apiGet(lbListURL, appData, function(error, lbListData) {
        if (error) {
            commonUtils.handleJSONResponse(error, response, null);
            return;
        }
        commonUtils.handleJSONResponse(error, response, lbListData);
    });
}

/**
 * @getLoadBalancersDetails public function 1. URL
 *                          /api/tenants/config/lbaas/load-balancers-details 2.
 *                          Gets list of load balancer details from config api
 *                          server 3. Needs tenant id
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancersDetails(request, response, appData) {
    var tenantId = null;
    var requestParams = url.parse(request.url, true);
    var lbListURL = '/loadbalancers';
    if (requestParams.query && requestParams.query.tenant_id) {
        tenantId = requestParams.query.tenant_id;
        lbListURL += '?parent_type=project&parent_id=' + tenantId.toString();
    }

    configApiServer.apiGet(lbListURL, appData, function(error, data) {
        getLoadBalancersDetailsInfo(error, data, response, appData);
    });
}

/**
 * @getLoadBalancersDetailsInfo private function Return back the response of
 *                              load balancers details.
 * @param error
 * @param lbs
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancersDetailsInfo(error, lbs, response, appData) {
    var reqUrl = null;
    var dataObjArr = [];
    var i = 0, lbLength = 0;
    var loadbalancers = {};

    if (error) {
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
    if (lbs['loadbalancers'] != null) {
        lbLength = lbs['loadbalancers'].length;
        for (i = 0; i < lbLength; i++) {
            reqUrl = '/loadbalancer/' + lbs['loadbalancers'][i]['uuid']
                    + '?exclude_hrefs=true&exclude_children=true';
            commonUtils.createReqObj(dataObjArr, reqUrl,
                    global.HTTP_REQUEST_GET, null, null, null, appData);
        }
        if (dataObjArr.length > 0) {
            async
                    .map(
                            dataObjArr,
                            commonUtils.getAPIServerResponse(
                                    configApiServer.apiGet, true),
                            function(error, loadbalancer) {
                                if (error) {
                                    commonUtils.handleJSONResponse(error,
                                            response, null);
                                    return;
                                }
                                if (lbs['loadbalancers'].length > 0
                                        && loadbalancer != null) {
                                    for (var j = 0; j < lbs['loadbalancers'].length; j++) {
                                        lbs['loadbalancers'][j]['loadbalancer'] = {};
                                        for (var l = 0; l < loadbalancer.length; l++) {
                                            if (lbs['loadbalancers'][j]['uuid'] == loadbalancer[l]['loadbalancer']['uuid']) {
                                                lbs['loadbalancers'][j]['loadbalancer'] = loadbalancer[l]['loadbalancer'];
                                            }
                                        }
                                    }
                                }
                                var jsonstr = JSON.stringify(lbs);
                                var new_jsonstr = jsonstr.replace(
                                        /loadbalancer_listener_back_refs/g,
                                        "loadbalancer-listener");
                                lbs = JSON.parse(new_jsonstr);
                                var dataObj = {
                                    lbs : lbs,
                                    appData : appData
                                };
                                async.waterfall([
                                        async.apply(getListenersDetailInfo,
                                                appData, lbs),
                                        async.apply(getFloatingIPfromVMI,
                                                appData), ], function(error,
                                        lbs) {
                                    commonUtils.handleJSONResponse(error,
                                            response, lbs);
                                });
                            });
        } else {
            commonUtils.handleJSONResponse(error, response, lbs);
        }
    } else {
        commonUtils.handleJSONResponse(error, response, lbs);
    }
}

/**
 * @getLoadBalancersTree public function 1. URL
 *                       /api/tenants/config/lbaas/load-balancers-tree 2. Gets
 *                       list of load balancerss from config api server 3. Needs
 *                       tenant id 4. Calls getLoadBalancersTreeInfo that
 *                       process data from config api server and sends back the
 *                       http response.
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancersTree(request, response, appData) {
    var tenantId = null;
    var requestParams = url.parse(request.url, true);
    var lbListURL = '/loadbalancers';

    if (requestParams.query && requestParams.query.tenant_id) {
        tenantId = requestParams.query.tenant_id;
        lbListURL += '?parent_type=project&parent_id=' + tenantId.toString();
    }

    configApiServer.apiGet(lbListURL, appData, function(error, data) {
        getLoadBalancersTreeInfo(error, data, response, appData);
    });
}

/**
 * @getLoadBalancerbyId public function 1. URL
 *                      /api/tenants/config/lbaas/load-balancer/:uuid 2. Gets of
 *                      load-balancer details from config api server 3. Needs
 *                      loadbalancer uuid 4. async waterfall functions that
 *                      process data from config api server and sends back the
 *                      http response.
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancerbyId(request, response, appData) {
    if (!(lb_uuid = request.param('uuid').toString())) {
        error = new appErrors.RESTServerError('Loadbalancer uuid is missing');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
    var lb_uuid = request.param('uuid');
    var lbListURL = '/loadbalancer/' + lb_uuid;
    configApiServer.apiGet(lbListURL, appData, function(error, lb) {
        if (error) {
            commonUtils.handleJSONResponse(error, response, null);
            return;
        }
        var jsonstr = JSON.stringify(lb);
        var new_jsonstr = jsonstr.replace(/loadbalancer_listener_back_refs/g,
                "loadbalancer-listener");
        lb = JSON.parse(new_jsonstr);
        var lbs = {
            'loadbalancers' : [ lb ]
        };
        var dataObj = {
            lbs : lbs,
            appData : appData
        };
        async.waterfall([ async.apply(getListenersDetailInfo, appData, lbs),
                async.apply(getFloatingIPfromVMI, appData),
                async.apply(getPoolDetailInfo, appData),
                async.apply(getMemberHealthMonitorInfo, appData) ], function(
                error, lbs) {
            if (error) {
                commonUtils.handleJSONResponse(err, response, null);
            } else {
                var lb = lbs['loadbalancers'][0];
                commonUtils.handleJSONResponse(error, response, lb);
            }
        });
    });
}

/**
 * @getLoadBalancersTreeInfo private function Return back the response of load
 *                           balancers tree.
 * @param error
 * @param lbs
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancersTreeInfo(error, lbs, response, appData) {
    var reqUrl = null;
    var dataObjArr = [];
    var i = 0, lbLength = 0;
    var loadbalancers = {};

    if (error) {
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
    if (lbs['loadbalancers'] != null) {
        lbLength = lbs['loadbalancers'].length;
        for (i = 0; i < lbLength; i++) {
            reqUrl = '/loadbalancer/' + lbs['loadbalancers'][i]['uuid']
                    + '?exclude_hrefs=true&exclude_children=true';
            commonUtils.createReqObj(dataObjArr, reqUrl,
                    global.HTTP_REQUEST_GET, null, null, null, appData);
        }
        if (dataObjArr.length > 0) {
            async
                    .map(
                            dataObjArr,
                            commonUtils.getAPIServerResponse(
                                    configApiServer.apiGet, true),
                            function(error, loadbalancer) {
                                if (error) {
                                    commonUtils.handleJSONResponse(error,
                                            response, null);
                                    return;
                                }
                                if (lbs['loadbalancers'].length > 0
                                        && loadbalancer != null) {
                                    for (var j = 0; j < lbs['loadbalancers'].length; j++) {
                                        lbs['loadbalancers'][j]['loadbalancer'] = {};
                                        for (var l = 0; l < loadbalancer.length; l++) {
                                            if (lbs['loadbalancers'][j]['uuid'] == loadbalancer[l]['loadbalancer']['uuid']) {
                                                lbs['loadbalancers'][j]['loadbalancer'] = loadbalancer[l]['loadbalancer'];
                                            }
                                        }
                                    }
                                }
                                var jsonstr = JSON.stringify(lbs);
                                var new_jsonstr = jsonstr.replace(
                                        /loadbalancer_listener_back_refs/g,
                                        "loadbalancer-listener");
                                lbs = JSON.parse(new_jsonstr);
                                var dataObj = {
                                    lbs : lbs,
                                    appData : appData
                                };
                                async
                                        .waterfall(
                                                [
                                                        async
                                                                .apply(
                                                                        getListenersDetailInfo,
                                                                        appData,
                                                                        lbs),
                                                        async
                                                                .apply(
                                                                        getFloatingIPfromVMI,
                                                                        appData),
                                                        async
                                                                .apply(
                                                                        getPoolDetailInfo,
                                                                        appData),
                                                        async
                                                                .apply(
                                                                        getMemberHealthMonitorInfo,
                                                                        appData) ],
                                                function(error, lbs) {
                                                    commonUtils
                                                            .handleJSONResponse(
                                                                    error,
                                                                    response,
                                                                    lbs);
                                                });
                            });
        } else {
            commonUtils.handleJSONResponse(error, response, lbs);
        }
    } else {
        commonUtils.handleJSONResponse(error, response, lbs);
    }
}

/**
 * @getFloatingIPfromVMI
 * @private function
 * @param appData
 * @param lbs
 * @param callback
 * @returns call back the process FloatingIPs from virtual-machine-interfaces
 */
function getFloatingIPfromVMI(appData, lbs, callback) {
    var reqUrl = null;
    var dataObjArr = [];
    var i = 0, lisLength = 0;
    console.log("getFloatingIPfromVMI");
    var vimUUID = [];
    for (var j = 0; j < lbs['loadbalancers'].length; j++) {
        if (lbs['loadbalancers'][j]['loadbalancer'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'].length > 0) {
            for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'].length; i++) {
                vimUUID
                        .push(lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['uuid'])
            }
        }
    }
    var lisLength = vimUUID.length;
    for (i = 0; i < lisLength; i++) {
        reqUrl = '/virtual-machine-interface/' + vimUUID[i]
                + '?exclude_hrefs=true&exclude_children=true';
        commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
                null, null, null, appData);
    }
    if (!dataObjArr.length) {
        var error = new appErrors.RESTServerError(
                'Invalid virtual machine interface Data');
        callback(error, null);
        return;
    }
    async.map(dataObjArr, commonUtils.getAPIServerResponse(
            configApiServer.apiGet, true), function(error, vmiData) {
        if (error) {
            callback(error, lbs);
            return;
        }
        parseFloatingIps(lbs, vmiData, appData, function(lbs) {
            callback(null, lbs);
        });
    });

}

/**
 * @parseFloatingIps
 * @private function Return call back it parse the floating-ips.
 * @param lbs
 * @param vmiData
 * @param appData
 * @param callback
 * @returns
 */
function parseFloatingIps(lbs, vmiData, appData, callback) {
    console.log("parseFloatingIps");
    var reqUrlfp = null;
    var dataObjArr = [];
    var i = 0, lisLength = 0;
    vmi = vmiData[0];
    var floatingipPoolRef = [], floatingipPoolRefsLen = 0;
    if ('floating_ip_back_refs' in vmi['virtual-machine-interface']) {
        floatingipPoolRef = vmi['virtual-machine-interface']['floating_ip_back_refs'];
        floatingipPoolRefsLen = floatingipPoolRef.length;
    }
    for (i = 0; i < floatingipPoolRefsLen; i++) {
        floatingipObj = floatingipPoolRef[i];
        reqUrl = '/floating-ip/' + floatingipObj['uuid']
                + '?exclude_hrefs=true';
        commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
                null, null, null, appData);
    }

    if (!dataObjArr.length) {
        callback(lbs);
        return;
    }
    async
            .map(
                    dataObjArr,
                    commonUtils.getAPIServerResponse(configApiServer.apiGet,
                            true),
                    function(error, results) {
                        if (error) {
                            callback(error, lbs);
                            return;
                        }
                        if (results != null && results.length > 0) {
                            if (lbs['loadbalancers'].length > 0
                                    && results != null && results.length > 0) {
                                console.log(JSON.stringify(results));
                                for (var j = 0; j < lbs['loadbalancers'].length; j++) {
                                    if (lbs['loadbalancers'][j]['loadbalancer'] != null
                                            && lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'] != null
                                            && lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'].length > 0) {
                                        for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'].length; i++) {
                                            console
                                                    .log(lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['uuid']);
                                            for (var l = 0; l < results.length; l++) {
                                                if (results[l]['floating-ip'] != null) {
                                                    var vmi_ref_fip = results[l]['floating-ip']['virtual_machine_interface_refs']
                                                    var vmi_ref_fip_len = vmi_ref_fip.length;
                                                    for (q = 0; q < vmi_ref_fip_len; q++) {
                                                        if (lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['uuid'] == vmi_ref_fip[q]['uuid']) {
                                                            lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['floating-ip'] = {};
                                                            lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['floating-ip'].ip = results[l]['floating-ip']['floating_ip_address'];
                                                            lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['floating-ip'].uuid = results[l]['floating-ip']['uuid'];
                                                            lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['floating-ip'].floating_ip_fixed_ip_address = results[l]['floating-ip']['floating_ip_fixed_ip_address'];
                                                        }
                                                    }

                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        parseVNSubnets(lbs, vmiData, appData, function(lbs) {
                            callback(lbs);
                        });
                    });
}

/**
 * @parseFloatingIps
 * @private function Return call back it parse the floating-ips.
 * @param lbs
 * @param vmiData
 * @param appData
 * @param callback
 * @returns
 */
function parseVNSubnets(lbs, vmiData, appData, callback) {
    console.log("parseFloatingIps");
    var reqUrlfp = null;
    var dataObjArr = [];
    var i = 0, lisLength = 0;
    vmi = vmiData[0];
    var vrPoolRef = [], vrPoolRefsLen = 0;
    if ('virtual_network_refs' in vmi['virtual-machine-interface']) {
        vrPoolRef = vmi['virtual-machine-interface']['virtual_network_refs'];
        vrPoolRefsLen = vrPoolRef.length;
    }
    for (i = 0; i < vrPoolRefsLen; i++) {
        vrObj = vrPoolRef[i];
        reqUrl = '/virtual-network/' + vrObj['uuid'] + '?exclude_hrefs=true';
        commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
                null, null, null, appData);
    }

    if (!dataObjArr.length) {
        // var error = new appErrors.RESTServerError('Invalid virtual-network
        // Data');
        // callback(error, null);
        callback(lbs);
        return;
    }
    async
            .map(
                    dataObjArr,
                    commonUtils.getAPIServerResponse(configApiServer.apiGet,
                            true),
                    function(error, results) {
                        if (error) {
                            callback(error, lbs);
                            return;
                        }
                        if (results != null && results.length > 0) {
                            if (lbs['loadbalancers'].length > 0
                                    && results != null && results.length > 0) {
                                console.log(JSON.stringify(results));
                                for (var j = 0; j < lbs['loadbalancers'].length; j++) {
                                    if (lbs['loadbalancers'][j]['loadbalancer'] != null
                                            && lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'] != null
                                            && lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'].length > 0) {
                                        for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'].length; i++) {
                                            console
                                                    .log(lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['uuid']);
                                            for (var l = 0; l < results.length; l++) {
                                                if (results[l]['virtual-network'] != null) {
                                                    lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['virtual-network'] = {};
                                                    lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['virtual-network'].uuid = results[l]['virtual-network']['uuid'];
                                                    lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['virtual-network'].display_name = results[l]['virtual-network']['display_name'];
                                                    lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['virtual-network'].name = results[l]['virtual-network']['name'];
                                                    lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'][i]['virtual-network'].network_ipam_refs = results[l]['virtual-network']['network_ipam_refs'];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        callback(lbs);
                    });
}
/**
 * @getListenersDetailInfo
 * @private function Return call back it process listeners Detail from
 *          loadbalancer-listener_back_refs.
 */
/**
 * @param appData
 * @param lbs
 * @param callback
 * @returns
 */
function getListenersDetailInfo(appData, lbs, callback) {
    var reqUrl = null;
    var dataObjArr = [];
    var i = 0, lisLength = 0;
    var lisUUID = [];
    for (var j = 0; j < lbs['loadbalancers'].length; j++) {
        if (lbs['loadbalancers'][j]['loadbalancer'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length > 0) {
            for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length; i++) {
                lisUUID
                        .push(lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['uuid'])
            }
        }
    }
    var lisLength = lisUUID.length;
    for (i = 0; i < lisLength; i++) {
        reqUrl = '/loadbalancer-listener/' + lisUUID[i]
                + '?exclude_hrefs=true&exclude_children=true';
        commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
                null, null, null, appData);
    }
    if (!dataObjArr.length) {
        var error = new appErrors.RESTServerError(
                'Invalid loadbalancer listener Data');
        callback(error, null);
        return;
    }
    async.map(dataObjArr, commonUtils.getAPIServerResponse(
            configApiServer.apiGet, true), function(error, listeners) {
        if (error) {
            callback(error, null);
            return;
        }
        mergeListenerToLB(lbs, listeners, function(lbs) {
            callback(null, lbs);
        });
    });
}

/**
 * @mergeListenerToLB
 * @private function Return call back it process listeners info and merge it to
 *          load-balancer.
 * @param lbs
 * @param listeners
 * @param callback
 * @returns
 */
function mergeListenerToLB(lbs, listeners, callback) {
    // var lbs = dataObj.lbs;
    console.log("mergeListenerToLB");
    if (lbs['loadbalancers'].length > 0 && listeners != null
            && listeners.length > 0) {
        for (var j = 0; j < lbs['loadbalancers'].length; j++) {
            if (lbs['loadbalancers'][j]['loadbalancer'] != null
                    && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'] != null
                    && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length > 0) {
                for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length; i++) {
                    for (var l = 0; l < listeners.length; l++) {
                        if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['uuid'] == listeners[l]['loadbalancer-listener']['uuid']) {
                            lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i] = listeners[l]['loadbalancer-listener'];
                        }
                    }
                }
            }
        }
    }
    var jsonstr = JSON.stringify(lbs);
    var new_jsonstr = jsonstr.replace(/loadbalancer_pool_back_refs/g,
            "loadbalancer-pool");
    lbs = JSON.parse(new_jsonstr);
    callback(lbs);
}

/**
 * @getPoolDetailInfo
 * @private function Return call back it process loadbalancer-pool details from
 *          loadbalancer-listener.
 * @param appData
 * @param lbs
 * @param callback
 * @returns
 */
function getPoolDetailInfo(appData, lbs, callback) {

    console.log("getPoolDetailInfo");
    console.log(JSON.stringify(lbs));
    var reqUrl = null;
    var dataObjArr = [];
    var i = 0, lisLength = 0;
    var poolUUID = [];
    for (var j = 0; j < lbs['loadbalancers'].length; j++) {
        if (lbs['loadbalancers'][j]['loadbalancer'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length > 0) {
            for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length; i++) {
                if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'] != null
                        && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length > 0) {
                    for (k = 0; k < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length; k++) {
                        var uuid = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['uuid']
                        poolUUID.push(uuid);
                    }
                }
            }
        }
    }
    var poolLength = poolUUID.length;
    for (i = 0; i < poolLength; i++) {
        reqUrl = '/loadbalancer-pool/' + poolUUID[i] + '?exclude_hrefs=true';
        commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
                null, null, null, appData);
    }
    if (!dataObjArr.length) {
        var error = new appErrors.RESTServerError(
                'Invalid loadbalancer pool Data');
        callback(error, null);
        return;
    }
    async.map(dataObjArr, commonUtils.getAPIServerResponse(
            configApiServer.apiGet, true), function(error, pools) {
        if (error) {
            callback(error, null);
            return;
        }
        mergePoolToLB(lbs, pools, function(lbs) {
            callback(null, lbs);
        });
    });
}

/**
 * @mergePoolToLB
 * @private function Return call back it process loadbalancer-pool details merge
 *          it to loadbalancer-listener.
 * @param lbs
 * @param pools
 * @param callback
 * @returns
 */
function mergePoolToLB(lbs, pools, callback) {
    console.log("mergePoolToLB");
    if (lbs['loadbalancers'].length > 0 && pools.length > 0) {
        for (var j = 0; j < lbs['loadbalancers'].length; j++) {
            if (lbs['loadbalancers'][j]['loadbalancer'] != null
                    && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'] != null
                    && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length > 0) {
                for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length; i++) {
                    if (lbs['loadbalancers'][j]['loadbalancer'] != null
                            && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'] != null
                            && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length > 0) {
                        for (k = 0; k < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length; k++) {
                            for (var l = 0; l < pools.length; l++) {
                                if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['uuid'] == pools[l]['loadbalancer-pool']['uuid']) {
                                    lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k] = pools[l]['loadbalancer-pool'];
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    var jsonstr = JSON.stringify(lbs);
    var new_jsonstr = jsonstr.replace(/loadbalancer_healthmonitor_refs/g,
            "loadbalancer-healthmonitor");
    var new_jsonstr1 = new_jsonstr.replace(/loadbalancer_members/g,
            "loadbalancer-members");
    lbs = JSON.parse(new_jsonstr1);
    callback(lbs);
}

/**
 * @getMemberHealthMonitorInfo
 * @private function Return call back it process loadbalancer-member details and
 *          loadbalancer-healthmonitor from loadbalancer-pool.
 * @param appData
 * @param lbs
 * @param callback
 * @returns
 */
function getMemberHealthMonitorInfo(appData, lbs, callback) {
    var reqUrl = null;
    var dataObjArr = [];
    var i = 0, lisLength = 0;
    console.log("getMemberHealthMonitorInfo");
    var memUUID = [];
    for (var j = 0; j < lbs['loadbalancers'].length; j++) {
        if (lbs['loadbalancers'][j]['loadbalancer'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length > 0) {
            for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length; i++) {
                if (lbs['loadbalancers'][j]['loadbalancer'] != null
                        && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'] != null
                        && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length > 0) {
                    for (k = 0; k < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length; k++) {
                        if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'].length > 0) {
                            for (q = 0; q < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'].length; q++) {
                                memUUID
                                        .push(lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'][q]['uuid']);
                            }
                        }
                    }
                }
            }
        }
    }
    var memLength = memUUID.length;
    for (i = 0; i < memLength; i++) {
        reqUrl = '/loadbalancer-member/' + memUUID[i] + '?exclude_hrefs=true';
        commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
                null, null, null, appData);
    }
    var helUUID = [];
    for (var j = 0; j < lbs['loadbalancers'].length; j++) {
        if (lbs['loadbalancers'][j]['loadbalancer'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'] != null
                && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length > 0) {
            for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length; i++) {
                if (lbs['loadbalancers'][j]['loadbalancer'] != null
                        && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'] != null
                        && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length > 0) {
                    for (k = 0; k < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length; k++) {
                        if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-healthmonitor'].length > 0) {
                            for (q = 0; q < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-healthmonitor'].length; q++) {
                                helUUID
                                        .push(lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-healthmonitor'][q]['uuid']);
                            }
                        }
                    }
                }
            }
        }
    }
    var helLength = memUUID.length;
    for (i = 0; i < helLength; i++) {
        reqUrl = '/loadbalancer-healthmonitor/' + helUUID[i]
                + '?exclude_hrefs=true';
        commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
                null, null, null, appData);
    }
    if (!dataObjArr.length) {
        var error = new appErrors.RESTServerError(
                'Invalid loadbalancer pool member or health monitor Data');
        callback(error, null);
        return;
    }
    async.map(dataObjArr, commonUtils.getAPIServerResponse(
            configApiServer.apiGet, true), function(error, results) {
        if (error) {
            var error = new appErrors.RESTServerError(
                    'Invalid loadbalancer pool member Data');
            callback(error, null);
            return;
        }
        mergeMemberHealthDetailToLB(lbs, results, function(lbs) {
            callback(null, lbs);
        });
    });
}

/**
 * @mergeMemberHealthDetailToLB
 * @private function
 * @Return call back it process loadbalancer-member details and
 *         loadbalancer-healthmonitor details merge it to loadbalancer-pool.
 * @param lbs
 * @param results
 * @param callback
 * @returns
 */
function mergeMemberHealthDetailToLB(lbs, results, callback) {
    console.log("mergeMemberDetail");
    if (lbs['loadbalancers'].length > 0 && results.length > 0) {
        for (var j = 0; j < lbs['loadbalancers'].length; j++) {
            if (lbs['loadbalancers'][j]['loadbalancer'] != null
                    && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'] != null
                    && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length > 0) {
                for (i = 0; i < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'].length; i++) {
                    if (lbs['loadbalancers'][j]['loadbalancer'] != null
                            && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'] != null
                            && lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length > 0) {
                        for (k = 0; k < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'].length; k++) {
                            if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'].length > 0) {
                                for (q = 0; q < lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'].length; q++) {
                                    for (var l = 0; l < results.length; l++) {
                                        if (results[l]['loadbalancer-member'] != null) {
                                            if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'][q]['uuid'] == results[l]['loadbalancer-member']['uuid']) {
                                                lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'][q] = results[l]['loadbalancer-member'];
                                            }
                                        } else {
                                            if (lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-healthmonitor'][q]['uuid'] == results[l]['loadbalancer-healthmonitor']['uuid']) {
                                                lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-healthmonitor'][q] = results[l]['loadbalancer-healthmonitor'];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    callback(lbs);
}

/**
 * @createLoadBalancer public function 1. URL
 *                     /api/tenants/config/lbaas/load-balancer - Post 2. Sets
 *                     Post Data and sends back the load-balancer config to
 *                     client
 */
/**
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createLoadBalancer(request, response, appData) {
    error = new appErrors.RESTServerError('Work in progress....');
    commonUtils.handleJSONResponse(error, response, null);
    return;
}

/**
 * @createLoadBalancer public function 1. URL
 *                     /api/tenants/config/lbaas/load-balancer - POST 2. Sets
 *                     Post Data and sends back the load-balancer config to
 *                     client
 */
/**
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createLoadBalancer(request, response, appData) {
    error = new appErrors.RESTServerError(
            'createLoadBalancer: Work in progress....');
    commonUtils.handleJSONResponse(error, response, null);
    return;
}

/**
 * @updateLoadBalancer public function 1. URL
 *                     /api/tenants/config/lbaas/load-balancer - PUT 2. Sets
 *                     Post Data and sends back the load-balancer config to
 *                     client
 */
/**
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updateLoadBalancer(request, response, appData) {
    error = new appErrors.RESTServerError(
            ' updateLoadBalancer: Work in progress....');
    commonUtils.handleJSONResponse(error, response, null);
    return;
}

/**
 * @deleteLoadBalancer public function 1. URL
 *                     /api/tenants/config/lbaas/load-balancer - DELETE 2. Sets
 *                     Post Data and sends back the load-balancer config to
 *                     client
 */
/**
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function deleteLoadBalancer(request, response, appData) {
    error = new appErrors.RESTServerError(
            ' deleteLoadBalancer: Work in progress....');
    commonUtils.handleJSONResponse(error, response, null);
    return;
}

exports.listLoadBalancers = listLoadBalancers;
exports.getLoadBalancersTree = getLoadBalancersTree;
exports.getLoadBalancersDetails = getLoadBalancersDetails;
exports.getLoadBalancerbyId = getLoadBalancerbyId;
exports.createLoadBalancer = createLoadBalancer;
exports.updateLoadBalancer = updateLoadBalancer;
exports.deleteLoadBalancer = deleteLoadBalancer;