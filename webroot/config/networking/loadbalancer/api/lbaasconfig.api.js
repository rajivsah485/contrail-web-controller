/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

/**
 * @lbaasconfig.api.js - Handlers to manage lBaaS resources - Interfaces with
 *                     config api server
 */

var rest = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/common/rest.api');
var async = require('async');
var vnconfigapi = module.exports;
var logutils = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/utils/log.utils');
var commonUtils = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/utils/common.utils');
var messages = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/common/messages');
var global = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/common/global');
var appErrors = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/errors/app.errors');
var util = require('util');
var url = require('url');
var UUID = require('uuid-js');
var configApiServer = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/common/configServer.api');
var jsonDiff = require(process.mainModule.exports['corePath']
		+ '/src/serverroot/common/jsondiff');
var _ = require('underscore');
var jsonPath = require('JSONPath').eval;

/**
 * Bail out if called directly as 'nodejs lbaasconfig.api.js'
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
	console.log('listLoadBalancers');
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
	console.log('getLoadBalancersDetails');
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
	console.log('getLoadBalancersDetailsCB');
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
	console.log('parseLoadBalancerDetails');
	var jsonstr = JSON.stringify(lbs);
	var new_jsonstr = jsonstr.replace(
			/loadbalancer_listener_back_refs/g,
			'loadbalancer-listener');
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
	console.log('getLoadBalancersTree');
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
	console.log('getLoadBalancerbyId');
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
	console.log('getLBaaSDetailsbyIdCB');
	var jsonstr = JSON.stringify(lb);
	var new_jsonstr = jsonstr.replace(/loadbalancer_listener_back_refs/g,
			'loadbalancer-listener');
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
	console.log('getLoadBalancersTreeInfo');
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
								'loadbalancer-listener');
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
		console.log('getLoadBalancerRefDetails');
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
	console.log('getServiceInstanceDetailsfromLB');
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
	console.log('parseServiceInstanceDetailsfromLB');
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
	console.log('getFloatingIPfromVMI');
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
	console.log('getFloatingIPfromVMI-lisLength-'+lisLength);
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
	console.log('parseFloatingIps');
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
	console.log('parseVNSubnets');
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
	console.log('getListenersDetailInfo');
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
		callback(null, lbs);
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
	console.log('mergeListenerToLB');
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
			'loadbalancer-pool');
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
	console.log('getPoolDetailInfo');
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
		callback(null, lbs);
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
	console.log('mergePoolToLB');
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
			'loadbalancer-healthmonitor');
	var new_jsonstr1 = new_jsonstr.replace(/loadbalancer_members/g,
			'loadbalancer-members');
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
	console.log('getMemberHealthMonitorInfo');
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
						// console.log('mem:',mem);
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
	console.log('mergeMemberHealthDetailToLB');
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
	console.log('listListenersByLBId');
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
	console.log('getListenerById');
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
	console.log('parseListenerbyId');
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
	console.log('listPoolsByListernerId');
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
	console.log('parsePoolsbyListenerId');
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
	console.log('getPoolById');
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
	console.log('createLoadBalancer');
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
				commonUtils.handleJSONResponse(error, response, results);
			});
		});
}



/**
* @createLoadBalancer
* private function
* 1. Basic validation before creating the Load Balancer
*/
function createLoadBalancerValidate (appData, postData, callback){
	console.log('createLoadBalancerValidate');
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
        lbPostData['loadbalancer']['uuid'] = uuid['hex'];
        lbPostData['loadbalancer']['fq_name'][2] = lbPostData['loadbalancer']['name'] +'-'+uuid['hex'];
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
	lbPostData['loadbalancer']['display_name'] = lbPostData['loadbalancer']['name'];
	
    configApiServer.apiPost(lbCreateURL, lbPostData, appData, 
    		function(error, lbData) {
			if (error) {
				callback(error, null);
				return;
			}
			//console.log('lbData:'+ JSON.stringify(lbData));
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
	console.log('readLBwithUUID');
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
	console.log('updateLoadBalancer');
	updateLoadBalancerCB(request, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}


/**
 * @updateLoadBalancerCB
 * private function
 * 1. Callback for LoadBalancer update operations 
 * 2. Send a call to Update the LoadBalancer diff
 */
function updateLoadBalancerCB (request, appData, callback){
	console.log('updateLoadBalancer');
	var lbId = request.param('uuid');
    var lbPutData= request.body;
    var lbPutURL = '/loadbalancer/';
    if (!('loadbalancer' in lbPutData) ||
            (!('uuid' in lbPutData['loadbalancer']))) {
        error = new appErrors.RESTServerError('loadbalancer object or its uuid missing ');
        callback(error, lbPutData);
        return;
    }
    var lbUUID = lbPutData['loadbalancer']['uuid'];
    if(lbId != lbUUID){
    	 	error = new appErrors.RESTServerError('loadbalancer Id and listener Object uuid mismatch ');
         callback(error, lbPutData);
         return;
    }
    lbPutURL += lbUUID;
    lbPutData = removeLoadBalancerBackRefs(lbPutData);
    lbPutData = removeLoadBalancerRefs(lbPutData);
    jsonDiff.getConfigDiffAndMakeCall(lbPutURL, appData, lbPutData,
                                          function(locError, data) {
        error = appendMessage(locError, locError);
        callback(error, data);
    });
}

/**
 * removeLoadBalancerBackRefs
 * private function
 * 1. Callback for LoadBalancer update operations
 * 2. If any back reference is available in the object from UI
 *    remove it from the object
 */
function removeLoadBalancerBackRefs(lbPutData){
	
    if ('loadbalancer_listener_back_refs' in lbPutData['loadbalancer']) {
        delete lbPutData['loadbalancer']['loadbalancer_listener_back_refs'];
    }
    if ('service_appliance_set_refs' in lbPutData['loadbalancer']) {
        delete lbPutData['loadbalancer']['service_appliance_set_refs'];
    }
    
    return lbPutData;
}
/**
 * removeLoadBalancerRefs
 * private function
 * 1. Callback for LoadBalancer update operations
 * 2. If any back reference is available in the object from UI
 *    remove it from the object
 */
function removeLoadBalancerRefs(lbPutData){
    if ('service_instance_refs' in lbPutData['loadbalancer']) {
        delete lbPutData['loadbalancer']['service_instance_refs'];
    }
    if ('virtual_machine_interface_refs' in lbPutData['loadbalancer']) {
        delete lbPutData['loadbalancer']['virtual_machine_interface_refs'];
    }
    return lbPutData;
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
	console.log('deleteLoadBalancer');
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
	console.log('deleteLoadBalancerCB');
	deleteLoadBalancerRefs(uuid, appData, function(err, outputs) {
		configApiServer.apiDelete('/loadbalancer/' + uuid, appData, 
				function(error, results) {
					if (error) {
						callback(error, null);
						return;
					}
					//console.log(JSON.stringify('deleteLoadBalancerCB:'+results));
					var newMessage={};
					newMessage.message="Load Balancer are deleted....";
					callback(null,appendMessage(newMessage, outputs));
				});
		});
}
function deleteLoadBalancerRefs(uuid, appData, callback){
	console.log('deleteLoadBalancerRefs');
	readLBwithUUID(uuid, appData, function(err, lbData) {
		if (err) {
			callback(err, lbData);
			return;
		}
		var l_back_refs = commonUtils.getValueByJsonPath(lbData,
				'loadbalancer;loadbalancer_listener_back_refs', false);
		deleteListenerByUUIDList(l_back_refs, appData, function(error, results) {
			//console.log(JSON.stringify('results:'+results));
			callback(null,results);
		});
	});
	
}


/**
 * @createListener public function 
 * 1. URL /api/tenants/config/lbaas/listener - POST 
 * 2. Sets Post Data and sends back the listener config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createListener(request, response, appData) {
	console.log('createListener');
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
	console.log('createListenerValidate');
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
        llPostData['loadbalancer-listener']['uuid'] = uuid['hex'];
        llPostData['loadbalancer-listener']['fq_name'][2] = llPostData['loadbalancer-listener']['name'] +'-'+uuid['hex'];
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
	
	llPostData['loadbalancer-listener']['display_name'] = llPostData['loadbalancer-listener']['name'];
	llPostData['loadbalancer-listener']['loadbalancer_refs'] = [{'to' : postData['loadbalancer']['fq_name']}];
	
    
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
	console.log('readLLwithUUID');
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
	console.log('updateListener');
	updateListenerCB(request, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}



/**
 * @updateListenerCB
 * private function
 * 1. Callback for Listener update operations 
 * 2. Send a call to Update the Listener diff
 */
function updateListenerCB (request, appData, callback){
	console.log('updateListenerCB');
	var lisId = request.param('uuid');
    var lisPutData= request.body;
    var lisPutURL = '/loadbalancer-listener/';
    if (!('loadbalancer-listener' in lisPutData) ||
            (!('uuid' in lisPutData['loadbalancer-listener']))) {
        error = new appErrors.RESTServerError('listener object or its uuid missing ');
        callback(error, lisPutData);
        return;
    }
    var lisUUID = lisPutData['loadbalancer-listener']['uuid'];
    if(lisId != lisUUID){
    	 	error = new appErrors.RESTServerError('listener Id and listener Object uuid mismatch ');
         callback(error, lisPutData);
         return;
    }
    lisPutURL += lisUUID;
    lisPutData = removeListenerBackRefs(lisPutData);
    lisPutData = removeListenerRefs(lisPutData);
    jsonDiff.getConfigDiffAndMakeCall(lisPutURL, appData, lisPutData,
                                          function(locError, data) {
        error = appendMessage(locError, locError);
        callback(error, data);
    });
}

/**
 * removeListenerBackRefs
 * private function
 * 1. Callback for Listener update operations
 * 2. If any back reference is available in the object from UI
 *    remove it from the object
 */
function removeListenerBackRefs(lisPutData){
    if ('loadbalancer_pool_back_refs' in lisPutData['loadbalancer-listener']) {
        delete lisPutData['loadbalancer-listener']['loadbalancer_pool_back_refs'];
    }
    return lisPutData;
}
/**
 * removeListenerRefs
 * private function
 * 1. Callback for Listener update operations
 * 2. If any back reference is available in the object from UI
 *    remove it from the object
 */
function removeListenerRefs(lisPutData){
    if ('loadbalancer_refs' in lisPutData['loadbalancer-listener']) {
        delete lisPutData['loadbalancer-listener']['loadbalancer_refs'];
    }
    return lisPutData;
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
	console.log('deleteListener');
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
	console.log('deleteListenerCB:');
	readLLwithUUID(uuid, appData, function(err, llData) {
		if (err) {
			callback(err, llData);
			return;
		}
		var l_back_refs=[];
		l_back_refs.push(llData['loadbalancer-listener']);
		deleteListenerByUUIDList(l_back_refs, appData, function(error, results) {
			//console.log(JSON.stringify('results:'+results));
			callback(null,results);
		});
	});
}

function deleteListenerByUUIDList(llIds, appData, callback) {
	var dataObjArr = [];
	var rowsCnt = llIds.length;
	deleteListenerRefs(llIds, appData, function(err, outputs) {
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
			var newMessage={};
			newMessage.message="All Listener are deleted....";
			callback(null,appendMessage(newMessage, outputs));
		});
	});
}

function deleteListenerRefs(llIds, appData, callback){
	console.log('deleteListenerRefs');	
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
		if(p_back_refs== undefined || p_back_refs==false ){
			callback(null,'');
			return;
		}
		getPoolListbyIds(p_back_refs, appData, function(error, pLists){
			deletePoolMembers(pLists, appData, function(error, results) {
				var newMessage={};
				newMessage.message="All Listener refs are deleted....";
				callback(null,appendMessage(newMessage, results));
			});
		});
	});	
}

/**
 * @createPool 
 * public function 
 * 1. URL /api/tenants/config/lbaas/pool - POST 
 * 2. Sets Post Data and sends back the Pool config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function createPool(request, response, appData) {
	console.log('createPool');
	createPoolValidate(request, request.body, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}

/**
* @createPoolMembers
* private function
* 1. Basic validation before creating the Load Balancer - Pool
*/
function createPoolMembers (appData, postData, callback){
	console.log('createPoolMembers');
	async.waterfall([
		async.apply(createHealthMonitorValidate, appData, postData),
		async.apply(createPoolValidate, appData),
		async.apply(createPoolMember, appData)
	],
	 function(err, postData) {
		if(err){
			callback(err, null);
		}
		callback(err, postData);	
	});
}

function createPoolMember(appData, postData, callback){
	console.log('createPoolMember');
	if (!('loadbalancer-member' in postData)) {
         callback(null, postData);
        return;
    }
	var members= postData['loadbalancer-member'];
	var allDataObj =[];
	if(members.length > 0 ){
		for(i=0; i<members.length; i++){
			var mObj = {};
			mObj['loadbalancer-member'] = members[i];
		    mObj['appData'] = appData;
		    allDataObj.push(mObj);
		}
	}
	async.mapSeries(allDataObj, createMemberValidate, function(err, data) {
		 postData['loadbalancer-member']= data;
         callback(err, postData);
     });
}


/**
* createPoolValidate
* private function
* 1. Basic validation before creating the Load Balancer - Pool
*/
function createPoolValidate (appData, postData, callback){
	console.log('createPoolValidate');
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
        pPostData['loadbalancer-pool']['uuid'] = uuid['hex'];
        pPostData['loadbalancer-pool']['fq_name'][2] = pPostData['loadbalancer-pool']['name'] +'-'+uuid['hex'];
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
	pPostData['loadbalancer-pool']['display_name'] = pPostData['loadbalancer-pool']['name'];
	pPostData['loadbalancer-pool']['loadbalancer_listener_refs'] = [{'to' : postData['loadbalancer-listener']['fq_name']}];
	
	if ((!('loadbalancer_healthmonitor' in pPostData)) ||
		    (!('uuid' in pPostData['loadbalancer_healthmonitor']))) {
		pPostData['loadbalancer-pool']['loadbalancer_healthmonitor_refs'] = [{'to' : postData['loadbalancer-healthmonitor']['fq_name']}];
	}
//	console.log('pPostData:'+ JSON.stringify(pPostData));
    configApiServer.apiPost(pCreateURL, pPostData, appData, 
    		function(error, pData) {
			if (error) {
				callback(error, null);
				return;
			}
			
			var pId = pData['loadbalancer-pool']['uuid'];
			readPoolwithUUID(pId, appData, function(err, pData) {
				if (err) {
					callback(err, pData);
					return;
				}
				
				if (('loadbalancer-member' in postData))  {
					var mLength = postData['loadbalancer-member'].length;
					for(i=0; i< mLength; i++){
						postData['loadbalancer-member'][i]['fq_name'][2] = pData['loadbalancer-pool']['name'];
						postData['loadbalancer-member'][i]['parent_type'] = 'loadbalancer-pool';
					}
				}
				postData['loadbalancer-pool'] = pData['loadbalancer-pool'];
				//console.log('postData:'+ JSON.stringify(postData));
				callback(err, postData);
			});
    });
}


function readPoolwithUUID(pId, appData, callback){
	console.log('readPoolwithUUID');
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
 * updatePool 
 * public function 
 * 1. URL /api/tenants/config/lbaas/pool/:uuid - PUT 
 * 2. Sets Post Data and sends back the Pool config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updatePool(request, response, appData) {
	console.log('updatePool');
	updatePoolCB(request, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}



/**
 * @updatePoolCB
 * private function
 * 1. Callback for pool update operations 
 * 2. Send a call to Update the Pool diff
 */
function updatePoolCB (request, appData, callback){
	console.log('updatePoolCB');
	var poolId = request.param('uuid');
    var poolPutData= request.body;
    var poolPutURL = '/loadbalancer-pool/';
    if (!('loadbalancer-pool' in poolPutData) ||
            (!('uuid' in poolPutData['loadbalancer-pool']))) {
        error = new appErrors.RESTServerError('pool object or its uuid missing ');
        callback(error, poolPutData);
        return;
    }
    var poolUUID = poolPutData['loadbalancer-pool']['uuid'];
    if(poolId != poolUUID){
    	 	error = new appErrors.RESTServerError('pool Id and pool Object uuid mismatch ');
         callback(error, poolPutData);
         return;
    }
    poolPutURL += poolUUID;
    poolPutData = removePoolBackRefs(poolPutData);
    poolPutData = removePoolRefs(poolPutData);
    jsonDiff.getConfigDiffAndMakeCall(poolPutURL, appData, poolPutData,
                                          function(locError, data) {
        error = appendMessage(locError, locError);
        callback(error, data);
    });
}

/**
 * removePoolBackRefs
 * private function
 * 1. Callback for Pool update operations
 * 2. If any back reference is available in the object from UI
 *    remove it from the object
 */
function removePoolBackRefs(poolPutData){
    if ('loadbalancer_listener_refs' in poolPutData['loadbalancer-pool']) {
        delete poolPutData['loadbalancer-pool']['loadbalancer_listener_refs'];
    }
    if ('loadbalancer_healthmonitor_refs' in poolPutData['loadbalancer-pool']) {
        delete poolPutData['loadbalancer-pool']['loadbalancer_healthmonitor_refs'];
    }
    return poolPutData;
}
/**
 * removePoolRefs
 * private function
 * 1. Callback for Pool update operations
 * 2. If any back reference is available in the object from UI
 *    remove it from the object
 */
function removePoolRefs(poolPutData){
    if ('loadbalancer_members' in poolPutData['loadbalancer-pool']) {
        delete poolPutData['loadbalancer-pool']['loadbalancer_members'];
    }
    return poolPutData;
}


/**
 * deletePool 
 * public function 
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

function deletePoolMembers(pLists, appData, callback){
	console.log('deletePoolMembers');
	async.waterfall([
		async.apply(deleteMembersbypList, appData, pLists),
		async.apply(deletePoolsByUUIDList, appData, pLists),
		async.apply(deleteHealthMonitorsbypList, appData, pLists),
		],
	 function(err, results) {
		if(err){
			callback(err, null);
		}
		callback(null, results);	
	});
}

function getPoolListbyIds(pIds, appData, callback){
	console.log('getPoolListbyIds');	
	if(!pIds.length){
		callback(null, null);
		return;
	}
	var dataObjArr = [];
	var rowsCnt = pIds.length;
	for (var i = 0; i < rowsCnt; i++) {
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
		callback(null,results);
	});
	
}

function deletePoolsByUUIDList(appData, pIds, message, callback) {
	console.log('deletePoolsByUUIDList');	
	var dataObjArr = [];
	var rowsCnt = pIds.length;
	for (var i = 0; i < rowsCnt; i++) {
		reqUrl = '/loadbalancer-pool/' + pIds[i]['loadbalancer-pool']['uuid']
		commonUtils.createReqObj(dataObjArr, reqUrl,
				global.HTTP_REQUEST_DELETE, null, null, null, appData);
	}
	async.map(dataObjArr, commonUtils.getAPIServerResponse(
			configApiServer.apiDelete, true), function(error, results) {
		if (error) {
			callback(error, null);
			return;
		}
		var newMessage={};
		newMessage.message="Pools are deleted....";
		callback(null, appendMessage(newMessage, message));
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
	console.log('createMember');
	var postData = request.body;
	if (typeof(postData) != 'object') {
        error = new appErrors.RESTServerError('Invalid Post Data');
        callback(error, null);
        return;
    }
	var dataObj=[];
	var mObj = {};
	mObj['loadbalancer-member'] = postData;
    mObj['appData'] = appData;
    dataObj.push(mObj);
	createMemberValidate(dataObj, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}

/**
* @createMemberValidate
* private function
* 1. Basic validation before creating the Load Balancer - Pool
*/
function createMemberValidate (dataObj, callback){
	console.log('createMemberValidate');
	if (!('loadbalancer-member' in dataObj)) {
        error = new appErrors.RESTServerError('Load Balancer Pool Member object missing ');
        callback(error, postData);
        return;
    }
	var appData= dataObj['appData'];
	var postData={};
	postData['loadbalancer-member'] = dataObj['loadbalancer-member'];
	callback(null, postData);
	
	var mCreateURL = '/loadbalancer-members';

	var mPostData={};
	mPostData['loadbalancer-member'] = postData['loadbalancer-member'];
	if ((!('loadbalancer-member' in mPostData)) ||
        (!('fq_name' in mPostData['loadbalancer-member']))) {
        error = new appErrors.RESTServerError('Enter Pool Name ');
        callback(error, null);
        return;
    }
	if ((!('loadbalancer-member' in mPostData)) ||
        (!('parent_type' in mPostData['loadbalancer-member']))) {
        error = new appErrors.RESTServerError('Parent Type is required ');
        callback(error, null);
        return;
    }
	if (mPostData['loadbalancer-member']['fq_name'].length > 2) {
        var uuid = UUID.create();
        mPostData['loadbalancer-member']['uuid'] = uuid['hex'];
        mPostData['loadbalancer-member']['name'] = uuid['hex'];
        mPostData['loadbalancer-member']['fq_name'][3] = uuid['hex'];
    }
	
	if ((!('loadbalancer-member' in mPostData)) ||
	    (!('loadbalancer_member_properties' in mPostData['loadbalancer-member']))) {
	    error = new appErrors.RESTServerError('Member Properties are missing ');
	    callback(error, null);
	    return;
	}
	mPostData['loadbalancer-member']['display_name'] = mPostData['loadbalancer-member']['uuid'];
	
	delete mPostData['loadbalancer-member']['loadbalancer_member_properties']['vip_subnet_id'];

    configApiServer.apiPost(mCreateURL, mPostData, appData, 
    		function(error, mData) {
			if (error) {
				callback(error, null);
				return;
			}
			var mId = mData['loadbalancer-member']['uuid'];
			readMemberwithUUID(mId, appData, function(err, mData) {
				if (err) {
					callback(err, mData);
					return;
				}
				callback(null, mData);
			});
    });
  
}

function readMemberwithUUID(mId, appData, callback){
	console.log('readMemberwithUUID');
	var mURL = '/loadbalancer-member/' + mId;
	configApiServer.apiGet(mURL, appData, function(error, member) {
		if (error) {
			callback(error, null);
			return;
		}
		callback(null, member);
	});
}

/**
 * @updateMember public function 
 * 1. URL /api/tenants/config/lbaas/member/:uuid - PUT 
 * 2. Sets Post Data and sends back the Member config to client
 * 
 * @param request
 * @param response
 * @param appData
 * @returns
 */
function updateMember(request, response, appData) {
	console.log('updateMember');
	updateMemberCB(request, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}

/**
 * @updateMemberCB
 * private function
 * 1. Callback for Member update operations 
 * 2. Send a call to Update the Member diff
 */
function updateMemberCB(request, appData, callback){
	console.log('updateMemberCB');
	var memId = request.param('uuid');
    var memPutURL = '/loadbalancer-member/';
    var memPutData = request.body;
    if (!('loadbalancer-member' in memPutData) ||
            (!('uuid' in memPutData['loadbalancer-member']))) {
        error = new appErrors.RESTServerError('Member object or its uuid missing');
        callback(error, memPutData);
        return;
    }
    var memUUID = memPutData['loadbalancer-member']['uuid'];
    
    if(memId != memUUID){
    	 	error = new appErrors.RESTServerError('Member Id and Member Object uuid mismatch ');
         callback(error, memPutData);
         return;
    }
    
    memPutURL += memUUID;
    jsonDiff.getConfigDiffAndMakeCall(memPutURL, appData, memPutData,
                                          function(locError, data) {
        error = appendMessage(locError, error);
        callback(error, data);
    });
}

/**
 * @deleteMember public function 
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

function deleteMembersbypList(appData, pIds, callback){
	console.log('deleteMembersbypList');	
		var mIds=[];
		for(i=0; i<pIds.length; i++){
			var memberRef= pIds[i]['loadbalancer-pool']['loadbalancer_members'];
			if(memberRef!= undefined && memberRef.length > 0){
				for(j=0; j< memberRef.length; j++){
					mIds.push(memberRef[j]);
				}
			}
		}
		deleteMembersByUUIDList(mIds,appData, function(error, results){
			callback(null, results);
		});
}

function deleteMembersByUUIDList(mIds, appData, callback) {
	console.log('deleteMembersByUUIDList');	
	var dataObjArr = [];
	var rowsCnt = mIds.length;
	for (var i = 0; i < rowsCnt; i++) {
		reqUrl = '/loadbalancer-member/' + mIds[i]['uuid'];
		commonUtils.createReqObj(dataObjArr, reqUrl,
				global.HTTP_REQUEST_DELETE, null, null, null, appData);
	}
	async.map(dataObjArr, commonUtils.getAPIServerResponse(
			configApiServer.apiDelete, true), function(error, results) {
		if (error) {
			callback(error, null);
			return;
		}
		var newMessage={};
		newMessage.message="Members are deleted....";
		callback(null, appendMessage(newMessage, null));
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
	console.log('createHealthMonitorValidate');
	if (!('loadbalancer-healthmonitor' in postData)) {
        error = new appErrors.RESTServerError('Load Balancer Pool Health Monitor object missing ');
        callback(error, postData);
        return;
    }
	var hmCreateURL = '/loadbalancer-healthmonitors';

	var hmPostData={};
	hmPostData['loadbalancer-healthmonitor'] = postData['loadbalancer-healthmonitor'];
	
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
        hmPostData['loadbalancer-healthmonitor']['uuid'] = uuid['hex'];
        hmPostData['loadbalancer-healthmonitor']['fq_name'][2] = uuid['hex'];
        hmPostData['loadbalancer-healthmonitor']['display_name'] = uuid['hex'];
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
	//console.log('hmPostData:'+ JSON.stringify(hmPostData));
    configApiServer.apiPost(hmCreateURL, hmPostData, appData, 
    		function(error, hmData) {
			if (error) {
				callback(error, null);
				return;
			}
			//console.log('hmData:'+ JSON.stringify(hmData));
			var hmId = hmData['loadbalancer-healthmonitor']['uuid'];
			readHMwithUUID(hmId, appData, function(err, hmData) {
				if (err) {
					callback(err, postData);
					return;
				}
				//console.log('hmData:'+ JSON.stringify(hmData));
				
				postData['loadbalancer-healthmonitor'] = hmData['loadbalancer-healthmonitor'];
				//console.log('postData:'+ JSON.stringify(postData));
				callback(null, postData);
			});
    });
}

function readHMwithUUID(hmId, appData, callback){
	console.log('readHMwithUUID');
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
	console.log('updateHealthMonitor');
	updateHealthMonitorCB(request, appData, function(error, results) {
	    commonUtils.handleJSONResponse(error, response, results);
	}) ;
}

/**
 * @updateHealthMonitorCB
 * private function
 * 1. Callback for HealthMonitor update operations 
 * 2. Send a call to Update the HM diff
 */
function updateHealthMonitorCB (request, appData, callback){
	console.log('updateHealthMonitorCB');
	var hmId = request.param('uuid');
    var hmPutData= request.body;
    var hmPutURL = '/loadbalancer-healthmonitor/';
    if (!('loadbalancer-healthmonitor' in hmPutData) ||
            (!('uuid' in hmPutData['loadbalancer-healthmonitor']))) {
        error = new appErrors.RESTServerError('Health Monitor object or its uuid missing ');
        callback(error, hmPutData);
        return;
    }
    var hmUUID = hmPutData['loadbalancer-healthmonitor']['uuid'];
    if(hmId != hmUUID){
    	 	error = new appErrors.RESTServerError('healthmonitor Id and healthmonitor Object uuid mismatch ');
         callback(error, hmPutData);
         return;
    }
 
    hmPutURL += hmUUID;
    hmPutData = removeHMBackRefs(hmPutData);
    jsonDiff.getConfigDiffAndMakeCall(hmPutURL, appData, hmPutData,
                                          function(locError, data) {
        error = appendMessage(locError, locError);
        callback(error, data);
    });
}

/**
 * @removeHMBackRefs
 * private function
 * 1. Callback for Health Monitor update operations
 * 2. If any back reference is available in the object from UI
 *    remove it from the object
 */
function removeHMBackRefs(hmPutData){
    if ('loadbalancer_pool_back_refs' in hmPutData['loadbalancer-healthmonitor']) {
        delete hmPutData['loadbalancer-healthmonitor']['loadbalancer_pool_back_refs'];
    }
    return hmPutData;
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

function deleteHealthMonitorsbypList(appData, pIds, message, callback){
	console.log('deleteHealthMonitorsbypList');	
	var hmIds=[];
	for(i=0; i< pIds.length; i++){
        if(pIds[i]['loadbalancer-pool']!=null){
			var ref= pIds[i]['loadbalancer-pool']['loadbalancer_healthmonitor_refs'];
			if(ref.length > 0){
				for(j=0; j< ref.length; j++){
					hmIds.push(ref[j]);
				}
			}
        }
		
	}
	//console.log("hmIds:", hmIds);
	deleteHealthMonitorsByUUIDList(hmIds,appData,message, function(error, results){
		callback(null, results);
	});
}


function deleteHealthMonitorsByUUIDList(hmIds, appData, message, callback) {
	console.log('deleteHealthMonitorsByUUIDList');	
	var dataObjArr = [];
	var rowsCnt = hmIds.length;
	for (var i = 0; i < rowsCnt; i++) {
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
		var newMessage={};
		newMessage.message="Health Monitor are deleted....";
		callback(null, appendMessage(newMessage, message));
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
    
    var lrUUID = '';
    if ('logical_router_back_refs' in portPostData['virtual-machine-interface']) {
        if (portPostData['virtual-machine-interface']['logical_router_back_refs'].length === 1) {
            lrUUID = portPostData['virtual-machine-interface']['logical_router_back_refs'][0]['uuid'];
        }
        delete portPostData['virtual-machine-interface']['logical_router_back_refs'];
    }
    if (('virtual_machine_interface_device_owner' in portPostData['virtual-machine-interface']) && 
        (portPostData['virtual-machine-interface']['virtual_machine_interface_device_owner']).substring(0,7) == 'compute'){
        //portPostData['virtual-machine-interface']['virtual_machine_interface_device_owner'] = '';
        delete portPostData['virtual-machine-interface']['virtual_machine_interface_device_owner'];
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
    		vmi['virtual-machine-interface']['uuid'] = uuid['hex'];
    		vmi['virtual-machine-interface']['fq_name'][0] = llPostData['loadbalancer']['fq_name'][0];
    		vmi['virtual-machine-interface']['fq_name'][1] = llPostData['loadbalancer']['fq_name'][1];
    		vmi['virtual-machine-interface']['fq_name'][2] = uuid['hex'];
    		vmi['virtual-machine-interface']['display_name'] = uuid['hex'];
    		vmi['virtual-machine-interface']['name'] = uuid['hex'];
    		
    		vmi['virtual-machine-interface']['parent_type'] = llPostData['loadbalancer']['parent_type'];
    		vmi['virtual-machine-interface']['id_perms'] = {enable : true};
    		
    		vmi['virtual-machine-interface']['security_group_refs'][0] = llPostData['loadbalancer']['fq_name'][0];
    		vmi['virtual-machine-interface']['security_group_refs'][1] = llPostData['loadbalancer']['fq_name'][1]; 
    		vmi['virtual-machine-interface']['security_group_refs'][2] = 'default';
    		
    		vmi['virtual-machine-interface']['virtual_machine_interface_device_owner'] = 'neutron:LOADBALANCER';
    		
    	       
    	       
    		callback(null, vmi);
    		
   
    }
  
  /**
   * @appendMessage
   * private function
   * 1. Utility function to append the error message to the error object
   */
function appendMessage(newMessage, existingMessage) {
      if (newMessage) {
          if (existingMessage != null) {
        	  	existingMessage.message += '<br>' + newMessage.message;
          } else {
        	  	existingMessage = newMessage;
          }
      }
      return existingMessage;
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
