/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
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
var UUID = require('uuid-js');
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
 * @listLoadBalancers public function 
 * 1. URL /api/tenants/config/lbaas/load-balancers 
 * 2. Gets list of load balancer from config api server 
 * 3. Needs tenant id
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function listLoadBalancers(request, response, appData) {
	console.log("listLoadBalancers");
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
 * @getLoadBalancersDetails public function 
 * 1. URL /api/tenants/config/lbaas/load-balancers-details 
 * 2.Gets list of load balancer details from config api server 
 * 3. Needs tenant id
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancersDetails(request, response, appData) {
	console.log("getLoadBalancersDetails");
	var tenantId = null;
	var requestParams = url.parse(request.url, true);
	var lbListURL = '/loadbalancers';
	if (requestParams.query && requestParams.query.tenant_id) {
		tenantId = requestParams.query.tenant_id;
		lbListURL += '?parent_type=project&parent_id=' + tenantId.toString();
	}

	configApiServer.apiGet(lbListURL, appData, function(error, data) {
		getLoadBalancersDetailsCB(error, data, response, appData);
	});
}

/**
 * @getLoadBalancersDetailsCB private function Return back the response of
 *                              load balancers details.
 * @param error
 * @param lbs
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancersDetailsCB(error, lbs, response, appData) {
	console.log("getLoadBalancersDetailsCB");
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
					+ '?exclude_hrefs=true&exclude_Refs=true';
			commonUtils.createReqObj(dataObjArr, reqUrl,
					global.HTTP_REQUEST_GET, null, null, null, appData);
		}
		if (dataObjArr.length > 0) {
			async.map(
				dataObjArr,
				commonUtils.getAPIServerResponse(
						configApiServer.apiGet, true),
				function(error, loadbalancer) {
					if (error) {
						commonUtils.handleJSONResponse(error,
								response, null);
						return;
					}
					if (lbs['loadbalancers'].length > 0 && loadbalancer != null) {
						for (var j = 0; j < lbs['loadbalancers'].length; j++) {
							lbs['loadbalancers'][j]['loadbalancer'] = {};
							for (var l = 0; l < loadbalancer.length; l++) {
								if (lbs['loadbalancers'][j]['uuid'] == loadbalancer[l]['loadbalancer']['uuid']) {
									lbs['loadbalancers'][j]['loadbalancer'] = loadbalancer[l]['loadbalancer'];
								}
							}
						}
					}
					parseLoadBalancerDetails(lbs, appData, function(error, lbs){
						commonUtils.handleJSONResponse(error,response, lbs);
					});
					
				});
		} else {
			commonUtils.handleJSONResponse(error, response, lbs);
		}
	} else {
		commonUtils.handleJSONResponse(error, response, lbs);
	}
}

function parseLoadBalancerDetails(lbs, appData, callback){
	console.log("parseLoadBalancerDetails");
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
			async.apply(getListenersDetailInfo,appData, lbs),
			async.apply(getLoadBalancerRefDetails, appData) ], 
			function(error, lbs) {
					callback(error,lbs);
			});
	
}

/**
 * @getLoadBalancersTree public function 
 * 1. URL /api/tenants/config/lbaas/load-balancers-tree 
 * 2. Gets list of load balancerss from config api server 
 * 3. Needs tenant id 
 * 4. Calls getLoadBalancersTreeInfo that process data from config api server and sends back the
 *                       http response.
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancersTree(request, response, appData) {
	console.log("getLoadBalancersTree");
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
 * @getLoadBalancerbyId public function 
 * 1. URL /api/tenants/config/lbaas/load-balancer/:uuid 
 * 2. Gets of load-balancer details from config api server 
 * 3. Needs loadbalancer uuid 
 * 4. async waterfall functions that process data from config api 
 * server and sends back the http response.
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function getLoadBalancerbyId(request, response, appData) {
	console.log("getLoadBalancerbyId");
	if (!(lb_uuid = request.param('uuid').toString())) {
		error = new appErrors.RESTServerError('Loadbalancer uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}
	var lb_uuid = request.param('uuid');
	readLBwithUUID(lb_uuid, appData, function(err, lbData) {
		if (err) {
			callback(err, lbData);
			return;
		}
		var lbs = {
				'loadbalancers' : [ lbData ]
			};
		parseLoadBalancerDetails(lbs, appData, function(error, lbs) {
			if (error) {
				commonUtils.handleJSONResponse(error, response, null);
			} else {
				var lb = lbs['loadbalancers'][0];
				commonUtils.handleJSONResponse(error, response, lb);
			}
		});
	});
}

function getLBaaSDetailsbyIdCB(lb, appData, callback) {
	console.log("getLBaaSDetailsbyIdCB");
	var jsonstr = JSON.stringify(lb);
	var new_jsonstr = jsonstr.replace(/loadbalancer_listener_back_refs/g,
			"loadbalancer-listener");
	lb = JSON.parse(new_jsonstr);
	var lbs = {
		'loadbalancers' : [ lb ]
	};

	async.waterfall([ async.apply(getListenersDetailInfo, appData, lbs),
			async.apply(getPoolDetailInfo, appData),
			async.apply(getMemberHealthMonitorInfo, appData) ], function(error,
			lbs) {
		callback(error, lbs);
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
	console.log("getLoadBalancersTreeInfo");
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
					+ '?exclude_hrefs=true&exclude_Refs=true';
			commonUtils.createReqObj(dataObjArr, reqUrl,
					global.HTTP_REQUEST_GET, null, null, null, appData);
		}
		if (dataObjArr.length > 0) {
			async.map(
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
										async.apply(getListenersDetailInfo, appData, lbs),			
										async.apply(getLoadBalancerRefDetails, appData),	
										async.apply(	getPoolDetailInfo, appData),
										async.apply(getMemberHealthMonitorInfo, appData) ],
										function(error, lbs) {
											commonUtils.handleJSONResponse(error, response, lbs);
										});
					});
		} else {
			commonUtils.handleJSONResponse(error, response, lbs);
		}
	} else {
		commonUtils.handleJSONResponse(error, response, lbs);
	}
}

function getLoadBalancerRefDetails(appData, lbs, callback){
	async.parallel([
			async.apply(getServiceInstanceDetailsfromLB, appData,lbs),
			async.apply(getFloatingIPfromVMI, appData,lbs)],
	 function(err, results) {
		var sviData = results[0];
		var vmiData= results[1];
		console.log("getLoadBalancerRefDetails");
		parseServiceInstanceDetailsfromLB(sviData, lbs, function(error,lbs){
				parseFloatingIps(lbs, vmiData, appData, function(lbs) {
						callback(null, lbs);
				});
		});
	});
}

function getServiceInstanceDetailsfromLB(appData, lbs, callback) {
	var reqUrl = null;
	var dataObjArr = [];
	var i = 0, lisLength = 0;
	console.log("getServiceInstanceDetailsfromLB");
	var sviUUID = [];
	for (var j = 0; j < lbs['loadbalancers'].length; j++) {
		var svi_refs = lbs['loadbalancers'][j]['loadbalancer']['service_instance_refs'];
		if (lbs['loadbalancers'][j]['loadbalancer'] != null && svi_refs != null
				&& svi_refs.length > 0) {
			for (i = 0; i < svi_refs.length; i++) {
				sviUUID.push(svi_refs[i]['uuid'])
			}
		}
	}
	var lisLength = sviUUID.length;
	if(sviUUID.length < 1){
		callback(null, {});
		return;
	}
	for (i = 0; i < lisLength; i++) {
		reqUrl = '/service-instance/' + sviUUID[i]
				+ '?exclude_hrefs=true&exclude_Refs=true';
		commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
				null, null, null, appData);
	}
	if (!dataObjArr.length) {
		var error = new appErrors.RESTServerError(
				'Invalid Service Instance Data');
		callback(error, null);
		return;
	}
	async.map(
		dataObjArr,
		commonUtils.getAPIServerResponse(configApiServer.apiGet,true),
		function(error, sviData) {
			if (error) {
				callback(error, sviData);
				return;
			}
			callback(null, sviData);
		});
}

function parseServiceInstanceDetailsfromLB(sviData, lbs, callback) {
	console.log("parseServiceInstanceDetailsfromLB");
	if (sviData != null && sviData.length > 0) {
		if (lbs['loadbalancers'].length > 0 && sviData != null
				&& sviData.length > 0) {
			for (var j = 0; j < lbs['loadbalancers'].length; j++) {
				var svi_refs = lbs['loadbalancers'][j]['loadbalancer']['service_instance_refs'];
				if (lbs['loadbalancers'][j]['loadbalancer'] != null
						&& svi_refs != null && svi_refs.length > 0) {
					for (i = 0; i < svi_refs.length; i++) {
						for (var l = 0; l < sviData.length; l++) {
							if (svi_refs[i]['uuid'] == sviData[l]['service-instance']['uuid']) {
								svi_refs[i]['name'] = sviData[l]['service-instance']['name'];
								svi_refs[i]['display_name'] = sviData[l]['service-instance']['display_name'];
								svi_refs[i]['service_instance_properties'] = sviData[l]['service-instance']['service_instance_properties'];

							}
						}

					}
				}
			}
		}
	}
	callback(null, lbs);
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
		var vmi_refs = lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'];
		if (lbs['loadbalancers'][j]['loadbalancer'] != null && vmi_refs != null
				&& vmi_refs.length > 0) {
			for (i = 0; i < vmi_refs.length; i++) {
				vimUUID.push(vmi_refs[i]['uuid'])
			}
		}
	}
	var lisLength = vimUUID.length;
	console.log("getFloatingIPfromVMI-lisLength-"+lisLength);
	if(vimUUID.length < 1){
		callback(null,{});
		return;
	}
	for (i = 0; i < lisLength; i++) {
		reqUrl = '/virtual-machine-interface/' + vimUUID[i]
				+ '?exclude_hrefs=true&exclude_Refs=true';
		commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
				null, null, null, appData);
	}
	if (!dataObjArr.length) {
		var error = new appErrors.RESTServerError(
				'Invalid virtual machine interface Data');
		callback(error, null);
		return;
	}
	async.map(dataObjArr,
			commonUtils.getAPIServerResponse(configApiServer.apiGet, true),
				function(error, vmiData) {
					if (error) {
						callback(error, null);
						return;
					}
					
				  callback(null, vmiData);
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
		if (lbs['loadbalancers'].length > 0
				&& vmiData != null && vmiData.length > 0) {
			for (var j = 0; j < lbs['loadbalancers'].length; j++) {
				var vmi_refs = lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'];
				if (lbs['loadbalancers'][j]['loadbalancer'] != null
						&& vmi_refs != null
						&& vmi_refs.length > 0) {
					for (i = 0; i < vmi_refs.length; i++) {
						for (var l = 0; l < vmiData.length; l++) {
							if (vmi_refs[i]['uuid'] == vmiData[l]['virtual-machine-interface']['uuid']) {
								vmi_refs[i]['name'] = vmiData[l]['virtual-machine-interface']['name'];
								vmi_refs[i]['display_name'] = vmiData[l]['virtual-machine-interface']['display_name'];
								vmi_refs[i]['floating-ip'] ={};
							}
						}

					}
				}
			}
		}
		var reqUrlfp = null;
		var dataObjArr = [];
		var i = 0, lisLength = 0;
		vmi = vmiData[0];
		var floatingipPoolRef = [], floatingipPoolRefsLen = 0;
		if(vmiData != null && vmiData.length > 0){
			if ('floating_ip_back_refs' in vmi['virtual-machine-interface']) {
				floatingipPoolRef = vmi['virtual-machine-interface']['floating_ip_back_refs'];
				floatingipPoolRefsLen = floatingipPoolRef.length;
			}
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
									for (var j = 0; j < lbs['loadbalancers'].length; j++) {
										var vmi_refs = lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'];
										if (vmi_refs != null && vmi_refs.length > 0) {
											for (i = 0; i < vmi_refs.length; i++) {
												for (var l = 0; l < results.length; l++) {
													if (results[l]['floating-ip'] != null) {
														var vmi_ref_fip = results[l]['floating-ip']['virtual_machine_interface_refs']
														var vmi_ref_fip_len = vmi_ref_fip.length;
														for (q = 0; q < vmi_ref_fip_len; q++) {
															if (vmi_refs[i]['uuid'] == vmi_ref_fip[q]['uuid']) {
																vmi_refs[i]['floating-ip'].ip = results[l]['floating-ip']['floating_ip_address'];
																vmi_refs[i]['floating-ip'].uuid = results[l]['floating-ip']['uuid'];
																vmi_refs[i]['floating-ip'].floating_ip_fixed_ip_address = results[l]['floating-ip']['floating_ip_fixed_ip_address'];
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
	console.log("parseVNSubnets");
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
	async.map(
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
					// console.log(JSON.stringify(results));
					for (var j = 0; j < lbs['loadbalancers'].length; j++) {
						var vmi_refs = lbs['loadbalancers'][j]['loadbalancer']['virtual_machine_interface_refs'];
						if (lbs['loadbalancers'][j]['loadbalancer'] != null
								&& vmi_refs != null
								&& vmi_refs.length > 0) {
							for (i = 0; i < vmi_refs.length; i++) {
								for (var l = 0; l < results.length; l++) {
									if (results[l]['virtual-network'] != null) {
										vmi_refs[i]['virtual-network'] = {};
										vmi_refs[i]['virtual-network'].uuid = results[l]['virtual-network']['uuid'];
										vmi_refs[i]['virtual-network'].display_name = results[l]['virtual-network']['display_name'];
										vmi_refs[i]['virtual-network'].name = results[l]['virtual-network']['name'];
										vmi_refs[i]['virtual-network'].network_ipam_refs = results[l]['virtual-network']['network_ipam_refs'];
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
 * @private function Return call back it process listeners Detail from loadbalancer-listener_back_refs.
 * @param appData
 * @param lbs
 * @param callback
 * @returns
 */
function getListenersDetailInfo(appData, lbs, callback) {
	console.log("getListenersDetailInfo");
	var reqUrl = null;
	var dataObjArr = [];
	var i = 0, lisLength = 0;
	var lisUUID = [];
	for (var j = 0; j < lbs['loadbalancers'].length; j++) {
		var llistener_ref = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'];
		if (lbs['loadbalancers'][j]['loadbalancer'] != null
				&& llistener_ref != null && llistener_ref.length > 0) {
			for (i = 0; i < llistener_ref.length; i++) {
				lisUUID.push(llistener_ref[i]['uuid'])
			}
		}
	}
	var lisLength = lisUUID.length;
	for (i = 0; i < lisLength; i++) {
		reqUrl = '/loadbalancer-listener/' + lisUUID[i]
				+ '?exclude_hrefs=true&exclude_Refs=true';
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
			var llistener_ref = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'];
			if (lbs['loadbalancers'][j]['loadbalancer'] != null
					&& llistener_ref != null && llistener_ref.length > 0) {
				for (i = 0; i < llistener_ref.length; i++) {
					for (var l = 0; l < listeners.length; l++) {
						if (llistener_ref[i]['uuid'] == listeners[l]['loadbalancer-listener']['uuid']) {
							llistener_ref[i] = listeners[l]['loadbalancer-listener'];
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
	var reqUrl = null;
	var dataObjArr = [];
	var i = 0, lisLength = 0;
	var poolUUID = [];
	for (var j = 0; j < lbs['loadbalancers'].length; j++) {
		var llistener_ref = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'];
		if (lbs['loadbalancers'][j]['loadbalancer'] != null
				&& llistener_ref != null && llistener_ref.length > 0) {
			for (i = 0; i < llistener_ref.length; i++) {
				var pools = llistener_ref[i]['loadbalancer-pool'];
				if (pools != null && pools.length > 0) {
					for (k = 0; k < pools.length; k++) {
						var uuid = pools[k]['uuid']
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
function mergePoolToLB(lbs, poolsData, callback) {
	console.log("mergePoolToLB");
	if (lbs['loadbalancers'].length > 0 && poolsData.length > 0) {
		for (var j = 0; j < lbs['loadbalancers'].length; j++) {
			var llistener_ref = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'];
			if (lbs['loadbalancers'][j]['loadbalancer'] != null
					&& llistener_ref != null && llistener_ref.length > 0) {
				for (i = 0; i < llistener_ref.length; i++) {
					var pools = llistener_ref[i]['loadbalancer-pool']
					if (lbs['loadbalancers'][j]['loadbalancer'] != null
							&& pools != null && pools.length > 0) {
						for (k = 0; k < pools.length; k++) {
							for (var l = 0; l < poolsData.length; l++) {
								if (pools[k]['uuid'] == poolsData[l]['loadbalancer-pool']['uuid']) {
									pools[k] = poolsData[l]['loadbalancer-pool'];
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
		var llistener_ref = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'];
		if (lbs['loadbalancers'][j]['loadbalancer'] != null
				&& llistener_ref != null && llistener_ref.length > 0) {
			for (i = 0; i < llistener_ref.length; i++) {
				var pool_ref = llistener_ref[i]['loadbalancer-pool'];
				if (lbs['loadbalancers'][j]['loadbalancer'] != null
						&& pool_ref != null && pool_ref.length > 0) {
					for (k = 0; k < pool_ref.length; k++) {
						var mem = pool_ref[k]['loadbalancer-members'];
						// console.log("mem:",mem);
						if (mem != undefined && mem.length > 0) {
							for (q = 0; q < mem.length; q++) {
								memUUID.push(mem[q]['uuid']);
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
		var llistener_ref = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'];
		if (lbs['loadbalancers'][j]['loadbalancer'] != null
				&& llistener_ref != null && llistener_ref.length > 0) {
			for (i = 0; i < llistener_ref.length; i++) {
				var pool_ref = llistener_ref[i]['loadbalancer-pool'];
				if (lbs['loadbalancers'][j]['loadbalancer'] != null
						&& pool_ref != null && pool_ref.length > 0) {
					for (k = 0; k < pool_ref.length; k++) {
						var health = pool_ref[k]['loadbalancer-healthmonitor'];
						if (health != undefined && health.length > 0) {
							for (q = 0; q < health.length; q++) {
								helUUID.push(health[q]['uuid']);
							}
						}
					}
				}
			}
		}
	}
	var helLength = helUUID.length;
	for (i = 0; i < helLength; i++) {
		reqUrl = '/loadbalancer-healthmonitor/' + helUUID[i]
				+ '?exclude_hrefs=true';
		commonUtils.createReqObj(dataObjArr, reqUrl, global.HTTP_REQUEST_GET,
				null, null, null, appData);
	}
	if (!dataObjArr.length) {
		callback(null, lbs);
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
	console.log("mergeMemberHealthDetailToLB");
	if (lbs['loadbalancers'].length > 0 && results.length > 0) {
		for (var j = 0; j < lbs['loadbalancers'].length; j++) {
			var llistener_ref = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'];
			if (lbs['loadbalancers'][j]['loadbalancer'] != null
					&& llistener_ref != null && llistener_ref.length > 0) {
				for (i = 0; i < llistener_ref.length; i++) {
					var pool_ref = llistener_ref[i]['loadbalancer-pool'];
					if (lbs['loadbalancers'][j]['loadbalancer'] != null
							&& pool_ref != null && pool_ref.length > 0) {
						for (k = 0; k < pool_ref.length; k++) {
							var healthM = pool_ref[k]['loadbalancer-healthmonitor'];
							if (healthM != undefined && healthM.length > 0) {
								for (z = 0; z < healthM.length; z++) {
									for (var l = 0; l < results.length; l++) {
										if (results[l]['loadbalancer-healthmonitor'] != null) {
											if (healthM[z]['uuid'] == results[l]['loadbalancer-healthmonitor']['uuid']) {
												healthM[z] = results[l]['loadbalancer-healthmonitor'];
											}
										}
									}
								}
							}

							var mem = lbs['loadbalancers'][j]['loadbalancer']['loadbalancer-listener'][i]['loadbalancer-pool'][k]['loadbalancer-members'];
							if (mem != undefined && mem.length > 0) {
								for (q = 0; q < mem.length; q++) {
									for (var l = 0; l < results.length; l++) {
										if (results[l]['loadbalancer-member'] != null) {
											if (mem[q]['uuid'] == results[l]['loadbalancer-member']['uuid']) {
												mem[q] = results[l]['loadbalancer-member'];
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

function listListenersByLBId(request, response, appData) {
	console.log("listListenersByLBId");
	var lb_uuid = request.param('lbid');
	if (!(lb_uuid = request.param('lbid').toString())) {
		error = new appErrors.RESTServerError('Loadbalancer uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}

	var lbURL = '/loadbalancer/' + lb_uuid;
	configApiServer.apiGet(lbURL, appData, function(error, lb) {
		if (error) {
			commonUtils.handleJSONResponse(error, response, null);
			return;
		}
		getLBaaSDetailsbyIdCB(lb, appData, function(error, lbs) {
			if (error) {
				commonUtils.handleJSONResponse(error, response, null);
			} else {
				var lb = lbs['loadbalancers'][0];
				listenerList = commonUtils.getValueByJsonPath(lb,
						'loadbalancer;loadbalancer-listener', [], false);
				var reLis = [];
				_.each(listenerList, function(listener) {
					reLis.push(listener);
				});
				commonUtils.handleJSONResponse(error, response, reLis);
			}
		});

	});
}

function getListenerById(request, response, appData) {
	console.log("getListenerById");
	var lb_uuid = request.param('lbid');
	var l_uuid = request.param('lid');
	if (!(lb_uuid = request.param('lbid').toString())) {
		error = new appErrors.RESTServerError('Loadbalancer uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}
	if (!(l_uuid = request.param('lid').toString())) {
		error = new appErrors.RESTServerError('Listener uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}

	var lbListURL = '/loadbalancer/' + lb_uuid;
	configApiServer.apiGet(lbListURL, appData, function(error, lb) {
		if (error) {
			commonUtils.handleJSONResponse(error, response, null);
			return;
		}
		getLBaaSDetailsbyIdCB(lb, appData, function(error, lbs) {
			if (error) {
				commonUtils.handleJSONResponse(error, response, null);
			} else {
				var lb = lbs['loadbalancers'][0];
				parseListenerbyId(l_uuid, lb, function(error, listener) {
					commonUtils
							.handleJSONResponse(error, response, listener[0]);
				});
			}
		});

	});
}

function parseListenerbyId(l_uuid, lb, callback) {
	console.log("parseListenerbyId");
	listenerList = commonUtils.getValueByJsonPath(lb,
			'loadbalancer;loadbalancer-listener', [], false);
	var reLis = [];
	_.each(listenerList, function(listener) {
		if (listener.uuid == l_uuid) {
			reLis.push(listener);
		}
	});
	callback(null, reLis);
}

function listPoolsByListernerId(request, response, appData) {
	console.log("listPoolsByListernerId");
	var lb_uuid = request.param('lbid');
	var l_uuid = request.param('lid');
	if (!(lb_uuid = request.param('lbid').toString())) {
		error = new appErrors.RESTServerError('Loadbalancer uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}
	if (!(l_uuid = request.param('lid').toString())) {
		error = new appErrors.RESTServerError('Listener uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}

	var lbListURL = '/loadbalancer/' + lb_uuid;
	configApiServer.apiGet(lbListURL, appData, function(error, lb) {
		if (error) {
			commonUtils.handleJSONResponse(error, response, null);
			return;
		}
		getLBaaSDetailsbyIdCB(lb, appData, function(error, lbs) {
			if (error) {
				commonUtils.handleJSONResponse(error, response, null);
			} else {
				var lb = lbs['loadbalancers'][0];
				parseListenerbyId(l_uuid, lb, function(error, listener) {
					poolList = commonUtils.getValueByJsonPath(listener[0],
							'loadbalancer-pool', [], false);
					commonUtils.handleJSONResponse(error, response, poolList);
				});

			}
		});

	});
}

function parsePoolsbyListenerId(l_uuid, lb, callback) {
	console.log("parsePoolsbyListenerId");
	listenerList = commonUtils.getValueByJsonPath(lb,
			'loadbalancer;loadbalancer-listener', [], false);
	var reLis = [];
	_.each(listenerList, function(listener) {
		if (listener.uuid == l_uuid) {
			reLis.push(listener);
		}
	});

	poolList = commonUtils.getValueByJsonPath(reLis,
			'loadbalancer-listener;loadbalancer-pool', [], false);

	callback(null, poolList);
}

function getPoolById(request, response, appData) {
	console.log("getPoolById");
	var lb_uuid = request.param('lbid');
	var l_uuid = request.param('lid');
	var p_uuid = request.param('pid');
	if (!(lb_uuid = request.param('lbid').toString())) {
		error = new appErrors.RESTServerError('Loadbalancer uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}
	if (!(l_uuid = request.param('lid').toString())) {
		error = new appErrors.RESTServerError('Listener uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}

	if (!(p_uuid = request.param('pid').toString())) {
		error = new appErrors.RESTServerError('Pool uuid is missing');
		commonUtils.handleJSONResponse(error, response, null);
		return;
	}

	var lbListURL = '/loadbalancer/' + lb_uuid;
	configApiServer.apiGet(lbListURL, appData, function(error, lb) {
		if (error) {
			commonUtils.handleJSONResponse(error, response, null);
			return;
		}
		getLBaaSDetailsbyIdCB(lb, appData, function(error, lbs) {
			if (error) {
				commonUtils.handleJSONResponse(error, response, null);
			} else {
				var lb = lbs['loadbalancers'][0];
				parseListenerbyId(l_uuid, lb, function(error, listener) {
					poolList = commonUtils.getValueByJsonPath(listener[0],
							'loadbalancer-pool', [], false);

					var reLis = [];
					_.each(poolList, function(pool) {
						if (pool.uuid == p_uuid) {
							reLis.push(pool);
						}
					});
					commonUtils.handleJSONResponse(error, response, reLis);
				});

			}
		});

	});
}

/**
 * @createLoadBalancer public function 
 * 1. URL /api/tenants/config/lbaas/load-balancer - POST 
 * 2. Sets Post Data and sends back the load-balancer config to client
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createLoadBalancer(request, response, appData) {
	console.log("createLoadBalancer");
	var postData = request.body;
	if (typeof(postData) != 'object') {
        error = new appErrors.RESTServerError('Invalid Post Data');
        callback(error, null);
        return;
    }
	async.waterfall([
		async.apply(createLoadBalancerValidate, appData, postData),
		async.apply(createListenerValidate, appData),
		async.apply(createPoolMembers, appData) 
		
		], 
		function(error, postData) {
		 	var lbId = postData["loadbalancer"]["uuid"];
			readLBwithUUID(lbId, appData, function(error, results){
				commonUtils.handleJSONResponse(error, response, postData);
			});
		});
}


/**
* @createLoadBalancer
* private function
* 1. Basic validation before creating the Load Balancer
*/
function createLoadBalancerValidate (appData, postData, callback){
	console.log("createLoadBalancerValidate");
	if (!('loadbalancer' in postData)) {
        error = new appErrors.RESTServerError('Load Balancer object missing ');
        callback(error, postData);
        return;
    }
	var lbCreateURL = '/loadbalancers';
	var lbPostData={};
	lbPostData.loadbalancer = postData['loadbalancer'];
	if ((!('loadbalancer' in lbPostData)) ||
        (!('fq_name' in lbPostData['loadbalancer']))) {
        error = new appErrors.RESTServerError('Enter Load Balancer Name ');
        callback(error, null);
        return;
    }
	if ((!('loadbalancer' in lbPostData)) ||
        (!('parent_type' in lbPostData['loadbalancer']))) {
        error = new appErrors.RESTServerError('Parent Type is required ');
        callback(error, null);
        return;
    }
	if (lbPostData['loadbalancer']['fq_name'].length > 2) {
        var uuid = UUID.create();
        lbPostData["loadbalancer"]["uuid"] = uuid['hex'];
        lbPostData["loadbalancer"]["fq_name"][2] = lbPostData["loadbalancer"]["name"] +"-"+uuid['hex'];
    }
	if ((!('loadbalancer' in lbPostData)) ||
        (!('vip_address' in lbPostData['loadbalancer']['loadbalancer_properties']))) {
        error = new appErrors.RESTServerError('Enter IP Address for Load Balancer ');
        callback(error, null);
        return;
    }
	if ((!('loadbalancer' in lbPostData)) ||
	    (!('vip_subnet_id' in lbPostData['loadbalancer']['loadbalancer_properties']))) {
	    error = new appErrors.RESTServerError('Select a subnet for Load Balancer ');
	    callback(error, null);
	    return;
	}
	if ((!('loadbalancer' in lbPostData)) ||
	    (!('loadbalancer_provider' in lbPostData['loadbalancer']))) {
	    error = new appErrors.RESTServerError('Select a provider for Load Balancer ');
	    callback(error, null);
	    return;
	}
	lbPostData["loadbalancer"]["display_name"] = lbPostData["loadbalancer"]["name"];
	
    configApiServer.apiPost(lbCreateURL, lbPostData, appData, 
    		function(error, lbData) {
			if (error) {
				callback(error, null);
				return;
			}
			//console.log("lbData:"+ JSON.stringify(lbData));
			var lbId = lbData['loadbalancer']['uuid'];
			readLBwithUUID(lbId, appData, function(err, lbData) {
				if (err) {
					callback(err, lbData);
					return;
				}
				postData['loadbalancer'] = lbData['loadbalancer'];
				callback(null, postData);
			});
    });

}

function readLBwithUUID(lbId, appData, callback){
	console.log("readLBwithUUID");
	var lbListURL = '/loadbalancer/' + lbId;
	configApiServer.apiGet(lbListURL, appData, function(error, lb) {
		if (error) {
			callback(error, null);
			return;
		}
		callback(null, lb);
	});
}

/**
 * @updateLoadBalancer public function 
 * 1. URL /api/tenants/config/lbaas/load-balancer/:uuid - PUT 
 * 2. Sets Post Data and sends back the load-balancer config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updateLoadBalancer(request, response, appData) {
	console.log("updateLoadBalancer");
	error = new appErrors.RESTServerError(
			' updateLoadBalancer: Work in progress....');
	commonUtils.handleJSONResponse(error, response, null);
	return;
}

/**
 * @deleteLoadBalancer public function 
 * 1. URL /api/tenants/config/lbaas/load-balancer/:uuid - DELETE 
 * 2. Sets Post Data and sends back the load-balancer config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function deleteLoadBalancer(request, response, appData) {	 
	console.log("deleteLoadBalancer");
	if (!(uuid = request.param('uuid').toString())) {
	        error = new appErrors.RESTServerError('Load Balancer id missing');
	        commonUtils.handleJSONResponse(error, response, null);
	        return;
	    }
		deleteLoadBalancerCB(uuid, appData, function(error, results){
			if(error){
	            commonUtils.handleJSONResponse(error, response, null);
	            return;
	        }
	        commonUtils.handleJSONResponse(error, response, results);
		});
	
}



function deleteLoadBalancerCB(uuid, appData,callback){
	console.log("deleteLoadBalancerCB");
	deleteLoadBalancerRefs(uuid, appData, function(err, results) {
		configApiServer.apiDelete('/loadbalancer/' + uuid, appData, function(
				error, results) {
			if (error) {
				callback(error, null);
				return;
			}
			callback(null, "Load Balancer deleted");
		});
	});

}


function deleteLoadBalancerRefs(uuid, appData, callback){
	console.log("deleteLoadBalancerRefs");
	readLBwithUUID(uuid, appData, function(err, lbData) {
		if (err) {
			callback(err, lbData);
			return;
		}
		var l_back_refs = commonUtils.getValueByJsonPath(lbData,
				'loadbalancer;loadbalancer_listener_back_refs', false);
		deleteListenerByUUIDList(l_back_refs, appData, function(error, results) {
			//console.log(JSON.stringify("results:"+results));
			callback(null,results);
		});
	});
	
}


/**
 * @createListener public function 1. URL /api/tenants/config/lbaas/listener -
 *                 POST 2. Sets Post Data and sends back the listener config to
 *                 client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createListener(request, response, appData) {
	console.log("createListener");
	var postData = request.body;
	if (typeof(postData) != 'object') {
        error = new appErrors.RESTServerError('Invalid Post Data');
        callback(error, null);
        return;
    }
	async.waterfall([
		async.apply(createListenerValidate, appData, postData),
		async.apply(createPoolMembers, appData) 
		], 
		function(error, postData) {
			commonUtils.handleJSONResponse(error, response, postData);
		});
}


/**
* @createLoadBalancer
* private function
* 1. Basic validation before creating the Load Balancer
*/
function createListenerValidate (appData, postData, callback){
	console.log("createListenerValidate");
	if (!('loadbalancer-listener' in postData)) {
        error = new appErrors.RESTServerError('Load Balancer Listener object missing ');
        callback(error, postData);
        return;
    }
	var llCreateURL = '/loadbalancer-listeners';
	var llPostData={};
	llPostData['loadbalancer-listener'] = postData['loadbalancer-listener'];
	if ((!('loadbalancer-listener' in llPostData)) ||
        (!('fq_name' in llPostData['loadbalancer-listener']))) {
        error = new appErrors.RESTServerError('Enter Load Balancer Name ');
        callback(error, null);
        return;
    }
	if ((!('loadbalancer-listener' in llPostData)) ||
        (!('parent_type' in llPostData['loadbalancer-listener']))) {
        error = new appErrors.RESTServerError('Parent Type is required ');
        callback(error, null);
        return;
    }
	if (llPostData['loadbalancer-listener']['fq_name'].length > 2) {
        var uuid = UUID.create();
        llPostData["loadbalancer-listener"]["uuid"] = uuid['hex'];
        llPostData["loadbalancer-listener"]["fq_name"][2] = llPostData["loadbalancer-listener"]["name"] +"-"+uuid['hex'];
    }
	
	if ((!('loadbalancer-listener' in llPostData)) ||
	    (!('protocol' in llPostData['loadbalancer-listener']['loadbalancer_listener_properties']))) {
	    error = new appErrors.RESTServerError('Listener Protocol is missing ');
	    callback(error, null);
	    return;
	}
	if ((!('loadbalancer-listener' in llPostData)) ||
	    (!('protocol_port' in llPostData['loadbalancer-listener']['loadbalancer_listener_properties']))) {
	    error = new appErrors.RESTServerError('Listener Port is missing ');
	    callback(error, null);
	    return;
	}
	
	llPostData["loadbalancer-listener"]["display_name"] = llPostData["loadbalancer-listener"]["name"];
	llPostData['loadbalancer-listener']['loadbalancer_refs'] = [{"to" : postData['loadbalancer']['fq_name']}];
	
    
	configApiServer.apiPost(llCreateURL, llPostData, appData, 
    		function(error, llData) {
			if (error) {
				callback(error, null);
				return;
			}
			var llId = llData['loadbalancer-listener']['uuid'];
			readLLwithUUID(llId, appData, function(err, llData) {
				if (err) {
					callback(err, llData);
					return;
				}
				postData['loadbalancer-listener'] = llData['loadbalancer-listener'];
				callback(null, postData);
			});
    });
}


function readLLwithUUID(llId, appData, callback){
	console.log("readLLwithUUID");
	var llURL = '/loadbalancer-listener/' + llId;
	configApiServer.apiGet(llURL, appData, function(error, listener) {
		if (error) {
			callback(error, null);
			return;
		}
		callback(null, listener);
	});
}



/**
 * updateListener public function 
 * 1. URL /api/tenants/config/lbaas/listener/:uuid - PUT 
 * 2. Sets Post Data and sends back the listener config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updateListener(request, response, appData) {
	console.log("updateListener");
	error = new appErrors.RESTServerError(
			' updateListener: Work in progress....');
	commonUtils.handleJSONResponse(error, response, null);
	return;
}

/**
 * deleteListener public function 
 * 1. URL /api/tenants/config/lbaas/listener/:uuid - DELETE 
 * 2. Sets Post Data and sends back the listener config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function deleteListener(request, response, appData) {
	console.log("deleteListener");
	if (!(uuid = request.param('uuid').toString())) {
        error = new appErrors.RESTServerError('Listener id missing');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
	deleteListenerCB(uuid, appData, function(error, results){
		if(error){
            commonUtils.handleJSONResponse(error, response, null);
            return;
        }
        commonUtils.handleJSONResponse(error, response, results);
	});
	
}

function deleteListenerCB(uuid, appData, callback){
	console.log("deleteListenerCB:" + uuid);
	readLLwithUUID(uuid, appData, function(err, llData) {
		if (err) {
			callback(err, llData);
			return;
		}
		var l_back_refs=[];
		l_back_refs.push(llData['loadbalancer-listener']);
		deleteListenerByUUIDList(l_back_refs, appData, function(error, results) {
			//console.log(JSON.stringify("results:"+results));
			callback(null,results);
		});
	});
}

function deleteListenerByUUIDList(llIds, appData, callback) {
	var dataObjArr = [];
	var rowsCnt = llIds.length;
	deleteListenerRefs(llIds, appData, function(err, results) {
		for (var i = 0; i < rowsCnt; i++) {
			reqUrl = '/loadbalancer-listener/' + llIds[i]['uuid']
			commonUtils.createReqObj(dataObjArr, reqUrl,
					global.HTTP_REQUEST_DELETE, null, null, null, appData);
		}
		async.map(dataObjArr, commonUtils.getAPIServerResponse(
				configApiServer.apiDelete, true), function(error, results) {
			if (error) {
				callback(error, null);
				return;
			}
			callback(null, "Listeners are Deleted...." + results);
		});
	});
}

function deleteListenerRefs(llIds, appData, callback){
	console.log("deleteListenerRefs");	
	var dataObjArr = [];
	var rowsCnt = llIds.length;
	for (var i = 0; i < rowsCnt; i++) {
		reqUrl = '/loadbalancer-listener/' + llIds[i]['uuid'];
		commonUtils.createReqObj(dataObjArr, reqUrl,
				global.HTTP_REQUEST_GET, null, null, null, appData);
	}
	async.map(dataObjArr, commonUtils.getAPIServerResponse(
		configApiServer.apiGet, true), function(error, results) {
		if (error) {
			callback(error, null);
			return;
		}
		var p_back_refs;
		for(i=0; i< results.length; i++){
			p_back_refs=commonUtils.getValueByJsonPath(results[i],
					'loadbalancer-listener;loadbalancer_pool_back_refs', false);
		}
		if(p_back_refs== undefined){
			callback(null,"");
			return;
		}
		deletePoolMembers(p_back_refs, appData, function(error, results) {
			//console.log(JSON.stringify("results:"+results));
			callback(null,results);
		});
	});	
}




/**
 * @createPool public function 1. URL /api/tenants/config/lbaas/pool - POST 2.
 *             Sets Post Data and sends back the Pool config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createPool(request, response, appData) {
	console.log("createPool");
	createPoolValidate(request, request.body, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}

/**
* createPoolMembers
* private function
* 1. Basic validation before creating the Load Balancer - Pool
*/
function createPoolMembers (appData, postData, callback){
	console.log("createPoolMembers");
	async.parallel([
		async.apply(createHealthMonitorValidate, appData, postData),
		//async.apply(getFloatingIPfromVMI, appData,lbs)
		
		],
	 function(err, results) {
		if(err){
			callback(err, null);
		}
		var healthMonitor= results[0];
		postData['loadbalancer-healthmonitor'] = healthMonitor['loadbalancer-healthmonitor'];
		createPoolValidate (appData, postData, function (err,postData){
			callback(err, postData);	
		});
		
	});

}


/**
* createPoolValidate
* private function
* 1. Basic validation before creating the Load Balancer - Pool
*/
function createPoolValidate (appData, postData, callback){
	console.log("createPoolValidate");
	if (!('loadbalancer-pool' in postData)) {
        error = new appErrors.RESTServerError('Load Balancer Pool object missing ');
        callback(error, postData);
        return;
    }
	var pCreateURL = '/loadbalancer-pools';
	var pPostData={};
	pPostData['loadbalancer-pool'] = postData['loadbalancer-pool'];
	if ((!('loadbalancer-pool' in pPostData)) ||
        (!('fq_name' in pPostData['loadbalancer-pool']))) {
        error = new appErrors.RESTServerError('Enter Pool Name ');
        callback(error, null);
        return;
    }
	if ((!('loadbalancer-pool' in pPostData)) ||
        (!('parent_type' in pPostData['loadbalancer-pool']))) {
        error = new appErrors.RESTServerError('Parent Type is required ');
        callback(error, null);
        return;
    }
	if (pPostData['loadbalancer-pool']['fq_name'].length > 2) {
        var uuid = UUID.create();
        pPostData["loadbalancer-pool"]["uuid"] = uuid['hex'];
        pPostData["loadbalancer-pool"]["fq_name"][2] = pPostData["loadbalancer-pool"]["name"] +"-"+uuid['hex'];
    }
	
	if ((!('loadbalancer-pool' in pPostData)) ||
	    (!('loadbalancer_pool_properties' in pPostData['loadbalancer-pool']))) {
	    error = new appErrors.RESTServerError('Pool Properties are missing ');
	    callback(error, null);
	    return;
	}
	if ((!('loadbalancer-pool' in pPostData)) ||
	    (!('loadbalancer_method' in pPostData['loadbalancer-pool']['loadbalancer_pool_properties']))) {
	    error = new appErrors.RESTServerError('Pool Method is missing ');
	    callback(error, null);
	    return;
	}
	pPostData["loadbalancer-pool"]["display_name"] = pPostData["loadbalancer-pool"]["name"];
	pPostData['loadbalancer-pool']['loadbalancer_listener_refs'] = [{"to" : postData['loadbalancer-listener']['fq_name']}];
	
	if ((!('loadbalancer_healthmonitor' in pPostData)) ||
		    (!('uuid' in pPostData['loadbalancer_healthmonitor']))) {
		pPostData['loadbalancer-pool']['loadbalancer_healthmonitor_refs'] = [{"to" : postData['loadbalancer-healthmonitor']['fq_name']}];
	}
//	console.log("pPostData:"+ JSON.stringify(pPostData));
    configApiServer.apiPost(pCreateURL, pPostData, appData, 
    		function(error, pData) {
			if (error) {
				callback(error, null);
				return;
			}
			console.log("llData:"+ JSON.stringify(pData));
			var pId = pData['loadbalancer-pool']['uuid'];
			readPoolwithUUID(pId, appData, function(err, pData) {
				if (err) {
					callback(err, pData);
					return;
				}
				postData['loadbalancer-pool'] = pData['loadbalancer-pool'];
				callback(err, postData);
			});
    });
}


function readPoolwithUUID(pId, appData, callback){
	console.log("readPoolwithUUID");
	var pURL = '/loadbalancer-pool/' + pId;
	configApiServer.apiGet(pURL, appData, function(error, pool) {
		if (error) {
			callback(error, null);
			return;
		}
		callback(null, pool);
	});
}


/**
 * updatePool public function 
 * 1. URL /api/tenants/config/lbaas/pool/:uuid - PUT 
 * 2. Sets Post Data and sends back the Pool config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updatePool(request, response, appData) {
	
	error = new appErrors.RESTServerError(
			' updatePool: Work in progress....');
	commonUtils.handleJSONResponse(error, response, null);
	return;
}

/**
 * deletePool public function 
 * 1. URL /api/tenants/config/lbaas/pool/:uuid - DELETE 
 * 2. Sets Post Data and sends back the Pool config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function deletePool(request, response, appData) {
	if (!(uuid = request.param('uuid').toString())) {
        error = new appErrors.RESTServerError('Pool id missing');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
	deletePoolCB(uuid, function(error, results){
		if(error){
            commonUtils.handleJSONResponse(error, response, null);
            return;
        }
        commonUtils.handleJSONResponse(error, response, results);
		
	});
}



function deletePoolCB(uuid, callback){
	configApiServer.apiDelete('/loadbalancer-pool/' + uuid, appData,
	     function(error, results) {
	         if(error){
	             callback(error,null)
	             return;
	         }
	         callback(null,results)
	     });
}


function deletePoolMembers(pIds, appData, callback){
	console.log("deletePoolMembers");
	async.parallel([
		async.apply(deletePoolsByUUIDList, pIds, appData),
		async.apply(deleteHealthMonitorsbypList, pIds, appData)
		],
	 function(err, results) {
		if(err){
			callback(err, null);
		}
		callback(null, results);	
	});
}

function deletePoolsByUUIDList(pIds, appData, callback) {
	console.log("deletePoolsByUUIDList");	
	var llCreateURL = '/loadbalancer-pool/';
	var dataObjArr = [];
	var rowsCnt = pIds.length;
	for (var i = 0; i < rowsCnt; i++) {
		console.log("pIds[i]['uuid']"+pIds[i]['uuid']);
		reqUrl = '/loadbalancer-pool/' + pIds[i]['uuid']
		commonUtils.createReqObj(dataObjArr, reqUrl,
				global.HTTP_REQUEST_DELETE, null, null, null, appData);
	}
	async.map(dataObjArr, commonUtils.getAPIServerResponse(
			configApiServer.apiDelete, true), function(error, results) {
		if (error) {
			callback(error, null);
			return;
		}
		callback(null, "Pools are deleted....");
	});
}

/**
 * @createMember public function 
 * 1. URL /api/tenants/config/lbaas/:pid/member - POST 
 * 2. Sets Post Data and sends back the Member config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createMember(request, response, appData) {
	createMemberValidate(request.body, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}

/**
* createMemberValidate
* private function
* 1. Basic validation before creating the Load Balancer - Pool
*/
function createMemberValidate (appData, postData, callback){
	console.log("createMemberValidate");
	if (!('loadbalancer-member' in postData)) {
        error = new appErrors.RESTServerError('Load Balancer Pool Member object missing ');
        callback(error, postData);
        return;
    }
	var pCreateURL = '/loadbalancer-members';

	var pPostData={};
	pPostData['loadbalancer-member'] = postData['loadbalancer-member'];
	console.log(pPostData);
	
	if ((!('loadbalancer-pool' in pPostData)) ||
        (!('fq_name' in pPostData['loadbalancer-pool']))) {
        error = new appErrors.RESTServerError('Enter Pool Name ');
        callback(error, null);
        return;
    }
	if ((!('loadbalancer-pool' in pPostData)) ||
        (!('parent_type' in pPostData['loadbalancer-pool']))) {
        error = new appErrors.RESTServerError('Parent Type is required ');
        callback(error, null);
        return;
    }
	if (pPostData['loadbalancer-pool']['fq_name'].length > 2) {
        var uuid = UUID.create();
        pPostData["loadbalancer-pool"]["uuid"] = uuid['hex'];
        pPostData["loadbalancer-pool"]["fq_name"][2] = pPostData["loadbalancer-pool"]["name"] +"-"+uuid['hex'];
    }
	
	if ((!('loadbalancer-pool' in pPostData)) ||
	    (!('loadbalancer_pool_properties' in pPostData['loadbalancer-pool']))) {
	    error = new appErrors.RESTServerError('Pool Properties are missing ');
	    callback(error, null);
	    return;
	}
	if ((!('loadbalancer-pool' in pPostData)) ||
	    (!('loadbalancer_method' in pPostData['loadbalancer-pool']['loadbalancer_pool_properties']))) {
	    error = new appErrors.RESTServerError('Pool Method is missing ');
	    callback(error, null);
	    return;
	}
	pPostData["loadbalancer-pool"]["display_name"] = pPostData["loadbalancer-pool"]["name"];
	pPostData['loadbalancer-pool']['loadbalancer_listener_refs'] = [{"to" : postData['loadbalancer-listener']['fq_name']}];
	console.log("pPostData:"+ JSON.stringify(pPostData));
    configApiServer.apiPost(pCreateURL, pPostData, appData, 
    		function(error, pData) {
			if (error) {
				callback(error, null);
				return;
			}
			console.log("llData:"+ JSON.stringify(pData));
			var pId = pData['loadbalancer-pool']['uuid'];
			readPoolwithUUID(pId, appData, function(err, pData) {
				if (err) {
					callback(err, pData);
					return;
				}
				postData['loadbalancer-pool'] = pData['loadbalancer-pool'];
				callback(null, postData);
			});
    });
}

/**
 * updateMember public function 
 * 1. URL /api/tenants/config/lbaas/member/:uuid - PUT 
 * 2. Sets Post Data and sends back the Member config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updateMember(request, response, appData) {
	error = new appErrors.RESTServerError(
			' updateMember: Work in progress....');
	commonUtils.handleJSONResponse(error, response, null);
	return;
}

/**
 * deleteMember public function 
 * 1. URL /api/tenants/config/lbaas/member/:uuid - DELETE 
 * 2. Sets Post Data and sends back the Member config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function deleteMember(request, response, appData) {
	if (!(lbId = request.param('uuid').toString())) {
        error = new appErrors.RESTServerError('Member id missing');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
	configApiServer.apiDelete('/loadbalancer-member/' + lbId, appData,
     function(error, results) {
         if(error){
             commonUtils.handleJSONResponse(error, response, null);
             return;
         }
         commonUtils.handleJSONResponse(error, response, results);
     });
}


/**
 * @createHealthMonitor public function 
 * 1. URL /api/tenants/config/lbaas/:pid/health-monitor - POST 
 * 2. Sets Post Data and sends back the Health Monitor config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createHealthMonitor(request, response, appData) {
	createHealthMonitorValidate(request.body, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}

/**
* createHealthMonitorValidate
* private function
* 1. Basic validation before creating the Load Balancer - Pool
*/
function createHealthMonitorValidate (appData, postData, callback){
	console.log("createHealthMonitorValidate");
	if (!('loadbalancer-healthmonitor' in postData)) {
        error = new appErrors.RESTServerError('Load Balancer Pool Health Monitor object missing ');
        callback(error, postData);
        return;
    }
	var hmCreateURL = '/loadbalancer-healthmonitors';

	var hmPostData={};
	hmPostData['loadbalancer-healthmonitor'] = postData['loadbalancer-healthmonitor'];
	console.log(hmPostData);
	
	if ((!('loadbalancer-healthmonitor' in hmPostData)) ||
        (!('fq_name' in hmPostData['loadbalancer-healthmonitor']))) {
        error = new appErrors.RESTServerError('Enter Health Monitor Name ');
        callback(error, null);
        return;
    }
	if ((!('loadbalancer-healthmonitor' in hmPostData)) ||
        (!('parent_type' in hmPostData['loadbalancer-healthmonitor']))) {
        error = new appErrors.RESTServerError('Parent Type is required ');
        callback(error, null);
        return;
    }
	if (hmPostData['loadbalancer-healthmonitor']['fq_name'].length > 2) {
        var uuid = UUID.create();
        hmPostData["loadbalancer-healthmonitor"]["uuid"] = uuid['hex'];
        hmPostData["loadbalancer-healthmonitor"]["fq_name"][2] = uuid['hex'];
        hmPostData["loadbalancer-healthmonitor"]["display_name"] = uuid['hex'];
    }
	
	if ((!('loadbalancer-healthmonitor' in hmPostData)) ||
	    (!('loadbalancer_healthmonitor_properties' in hmPostData['loadbalancer-healthmonitor']))) {
	    error = new appErrors.RESTServerError('Health Monitor Properties are missing ');
	    callback(error, null);
	    return;
	}
	if ((!('loadbalancer-healthmonitor' in hmPostData)) ||
	    (!('delay' in hmPostData['loadbalancer-healthmonitor']['loadbalancer_healthmonitor_properties']))) {
	    error = new appErrors.RESTServerError('Health Monitor delay is missing ');
	    callback(error, null);
	    return;
	}
	
	if ((!('loadbalancer-healthmonitor' in hmPostData)) ||
	    (!('monitor_type' in hmPostData['loadbalancer-healthmonitor']['loadbalancer_healthmonitor_properties']))) {
	    error = new appErrors.RESTServerError('Health Monitor monitor_type is missing ');
	    callback(error, null);
	    return;
	}
	if ((!('loadbalancer-healthmonitor' in hmPostData)) ||
	    (!('max_retries' in hmPostData['loadbalancer-healthmonitor']['loadbalancer_healthmonitor_properties']))) {
	    error = new appErrors.RESTServerError('Health Monitor max_retries is missing ');
	    callback(error, null);
	    return;
	}
	if ((!('loadbalancer-healthmonitor' in hmPostData)) ||
	    (!('timeout' in hmPostData['loadbalancer-healthmonitor']['loadbalancer_healthmonitor_properties']))) {
	    error = new appErrors.RESTServerError('Health Monitor timeout is missing ');
	    callback(error, null);
	    return;
	}
	console.log("hmPostData:"+ JSON.stringify(hmPostData));
    configApiServer.apiPost(hmCreateURL, hmPostData, appData, 
    		function(error, hmData) {
			if (error) {
				callback(error, null);
				return;
			}
			console.log("hmData:"+ JSON.stringify(hmData));
			var hmId = hmData['loadbalancer-healthmonitor']['uuid'];
			readHMwithUUID(hmId, appData, function(err, hmData) {
				if (err) {
					callback(err, hmData);
					return;
				}
				postData['loadbalancer-healthmonitor'] = hmData['loadbalancer-healthmonitor'];
				callback(null, postData);
			});
    });
}

function readHMwithUUID(hmId, appData, callback){
	console.log("readHMwithUUID");
	var pURL = '/loadbalancer-healthmonitor/' + hmId;
	configApiServer.apiGet(pURL, appData, function(error, hm) {
		if (error) {
			callback(error, null);
			return;
		}
		callback(null, hm);
	});
}


/**
 * updateHealthMonitor public function 
 * 1. URL /api/tenants/config/lbaas/health-monitor/:uuid - PUT 
 * 2. Sets Post Data and sends back the HealthMonitor config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updateHealthMonitor(request, response, appData) {
	error = new appErrors.RESTServerError(
			' updateHealthMonitor: Work in progress....');
	commonUtils.handleJSONResponse(error, response, null);
	return;
}

/**
 * deleteHealthMonitor public function 
 * 1. URL /api/tenants/config/lbaas/health-monitor/:uuid - DELETE 
 * 2. Sets Post Data and sends back the HealthMonitor config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function deleteHealthMonitor(request, response, appData) {
	if (!(hmId = request.param('uuid').toString())) {
        error = new appErrors.RESTServerError('Health Monitor id missing');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
	deleteHealthMonitorCB(hmId, appData, function(error, results){
		if(error){
            commonUtils.handleJSONResponse(error, response, null);
            return;
        }
        commonUtils.handleJSONResponse(error, response, results);
		
	});
}

function deleteHealthMonitorCB(uuid, appData, callback){
	configApiServer.apiDelete('/loadbalancer-healthmonitor/' + uuid, appData,
	     function(error, results) {
	         if(error){
	             callback(error,null)
	             return;
	         }
	         callback(null,results)
	     });
}

function deleteHealthMonitorsbypList(pIds, appData, callback){
	console.log("deletePoolsByUUIDList");	
	var llCreateURL = '/loadbalancer-pool/';
	var dataObjArr = [];
	var rowsCnt = pIds.length;
	for (var i = 0; i < rowsCnt; i++) {
		console.log("pIds[i]['uuid']"+pIds[i]['uuid']);
		reqUrl = '/loadbalancer-pool/' + pIds[i]['uuid']
		commonUtils.createReqObj(dataObjArr, reqUrl,
				global.HTTP_REQUEST_GET, null, null, null, appData);
	}
	async.map(dataObjArr, commonUtils.getAPIServerResponse(
			configApiServer.apiGet, true), function(error, results) {
		if (error) {
			callback(error, null);
			return;
		}
		console.log(results);
		var hmIds=[];
		for(i=0; i<results.length; i++){
			hmIds.push(results[i]['loadbalancer-pool']['loadbalancer_healthmonitor_refs'][0])
		}
		deleteHealthMonitorsByUUIDList(hmIds,appData, function(error, results){
			callback(null, "Health Monitor are deleted....");
		});
		
	});
	
}


function deleteHealthMonitorsByUUIDList(hmIds, appData, callback) {
	console.log("deleteHealthMonitorsByUUIDList");	
	var llCreateURL = '/loadbalancer-healthmonitor/';
	var dataObjArr = [];
	var rowsCnt = hmIds.length;
	for (var i = 0; i < rowsCnt; i++) {
		console.log("hmIds[i]['uuid']"+hmIds[i]['uuid']);
		reqUrl = '/loadbalancer-healthmonitor/' + hmIds[i]['uuid']
		commonUtils.createReqObj(dataObjArr, reqUrl,
				global.HTTP_REQUEST_DELETE, null, null, null, appData);
	}
	async.map(dataObjArr, commonUtils.getAPIServerResponse(
			configApiServer.apiDelete, true), function(error, results) {
		if (error) {
			callback(error, null);
			return;
		}
		callback(null, "Health Monitor are deleted....");
	});
}

/**
 * @createPortValidate
 * private function
 * 1. Basic validation before creating the port(VMI)
 */
function createPortValidate (request, data, appData, callback)
{	
    var portsCreateURL = '/virtual-machine-interfaces';
    var portPostData = data;
    var orginalPortData = commonUtils.cloneObj(data);

    if (typeof(portPostData) != 'object') {
        error = new appErrors.RESTServerError('Invalid Post Data');
        callback(error, null);
        return;
    }

   

    if ('instance_ip_back_refs' in portPostData['virtual-machine-interface']) {
        delete portPostData['virtual-machine-interface']['instance_ip_back_refs'];
    }

    if ('virtual_machine_refs' in portPostData['virtual-machine-interface']){
        delete portPostData['virtual-machine-interface']['virtual_machine_refs'];
    }
    
/*    if ('virtual_machine_interface_refs' in portPostData['virtual-machine-interface']){
        delete portPostData['virtual-machine-interface']['virtual_machine_interface_refs'];
    }*/
    
    var lrUUID = "";
    if ('logical_router_back_refs' in portPostData['virtual-machine-interface']) {
        if (portPostData['virtual-machine-interface']['logical_router_back_refs'].length === 1) {
            lrUUID = portPostData['virtual-machine-interface']['logical_router_back_refs'][0]['uuid'];
        }
        delete portPostData['virtual-machine-interface']['logical_router_back_refs'];
    }
    if (('virtual_machine_interface_device_owner' in portPostData['virtual-machine-interface']) && 
        (portPostData['virtual-machine-interface']["virtual_machine_interface_device_owner"]).substring(0,7) == "compute"){
        //portPostData["virtual-machine-interface"]["virtual_machine_interface_device_owner"] = "";
        delete portPostData["virtual-machine-interface"]["virtual_machine_interface_device_owner"];
    }
    configApiServer.apiPost(portsCreateURL, portPostData, appData,
                            function(error, vmisData) {
        if (error) {
            callback(error, null);
            return;
        }
        var portId = vmisData['virtual-machine-interface']['uuid'];
        readVMIwithUUID(portId, appData, function(err, vmiData){
            if (err) {
                callback(err, vmiData);
                return;
            }
            portSendResponse(error, request, vmiData, orginalPortData, appData, function (err, results) {
                    callback(err, results);
                    return;
            });
        });
    });
}
    
    function createVMIDummyObject(llPostData, callback){
    		var vmi={};
    		var uuid = UUID.create();
    		vmi["virtual-machine-interface"]["uuid"] = uuid['hex'];
    		vmi["virtual-machine-interface"]["fq_name"][0] = llPostData["loadbalancer"]["fq_name"][0];
    		vmi["virtual-machine-interface"]["fq_name"][1] = llPostData["loadbalancer"]["fq_name"][1];
    		vmi["virtual-machine-interface"]["fq_name"][2] = uuid['hex'];
    		vmi["virtual-machine-interface"]["display_name"] = uuid['hex'];
    		vmi["virtual-machine-interface"]["name"] = uuid['hex'];
    		
    		vmi["virtual-machine-interface"]["parent_type"] = llPostData["loadbalancer"]["parent_type"];
    		vmi["virtual-machine-interface"]["id_perms"] = {enable : true};
    		
    		vmi["virtual-machine-interface"]["security_group_refs"][0] = llPostData["loadbalancer"]["fq_name"][0];
    		vmi["virtual-machine-interface"]["security_group_refs"][1] = llPostData["loadbalancer"]["fq_name"][1]; 
    		vmi["virtual-machine-interface"]["security_group_refs"][2] = "default";
    		
    		vmi["virtual-machine-interface"]["virtual_machine_interface_device_owner"] = "neutron:LOADBALANCER";
    		
    	       
    	       
    		callback(null, vmi);
    		
   
    }

exports.listLoadBalancers = listLoadBalancers;
exports.getLoadBalancersTree = getLoadBalancersTree;
exports.getLoadBalancersDetails = getLoadBalancersDetails;
exports.getLoadBalancerbyId = getLoadBalancerbyId;

exports.getListenerById = getListenerById;
exports.listListenersByLBId = listListenersByLBId;
exports.listPoolsByListernerId = listPoolsByListernerId;
exports.getPoolById = getPoolById;

exports.createLoadBalancer = createLoadBalancer;
exports.updateLoadBalancer = updateLoadBalancer;
exports.deleteLoadBalancer = deleteLoadBalancer;

exports.createListener = createListener;
exports.updateListener = updateListener;
exports.deleteListener = deleteListener;

exports.createPool = createPool;
exports.updatePool = updatePool;
exports.deletePool = deletePool;

exports.createMember = createMember;
exports.updateMember = updateMember;
exports.deleteMember = deleteMember;

exports.createHealthMonitor = createHealthMonitor;
exports.updateHealthMonitor = updateHealthMonitor;
exports.deleteHealthMonitor = deleteHealthMonitor;
