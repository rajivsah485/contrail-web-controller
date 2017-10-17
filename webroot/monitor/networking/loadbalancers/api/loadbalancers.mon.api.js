/*

 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

var nwMonApi = module.exports;

var cacheApi = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/web/core/cache.api'), global = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/common/global'), messages = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/common/messages'), commonUtils = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/utils/common.utils'), rest = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/common/rest.api'), authApi = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/common/auth.api'), opApiServer = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/common/opServer.api'), configApiServer = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/common/configServer.api'), logutils = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/utils/log.utils'), infraCmn = require('../../../../common/api/infra.common.api'), nwMonUtils = require('../../../../common/api/nwMon.utils'), ctrlGlobal = require('../../../../common/api/global'), nwMonJobs = require('../../jobs/network.mon.jobs.js'), appErrors = require(process.mainModule.exports["corePath"]
		+ '/src/serverroot/errors/app.errors'), async = require('async'), jsonPath = require('JSONPath').eval, flowCache = require('../../../../common/api/flowCache.api'), qeUtils = require(process.mainModule.exports["corePath"]
		+ '/webroot/reports/qe/api/query.utils'), _ = require("underscore"), lodash = require("lodash"), assert = require('assert');

var uveListExpTime = 1;//10 * 60; // 10 Minutes

function getLoadBalancersUUIDList(req, res, appData) {

	var reqId = req.body["reqId"];
	console.log("getLoadBalancersUUIDList:"+reqId);
	redisUtils.getRedisData(reqId, function(error, list) {
		if (!lodash.isNil(list)) {
			commonUtils.handleJSONResponse(error, res, list);
			return;
		}
		var dataObjArr = [];
		dataObjArr.push({
			type : "config",
			req : req,
			appData : appData
		});
		
		async.map(dataObjArr, getLoadBalancersListAsync, function(error, lbList) {
			getAllUveLBListByConfigList(lbList, appData, function(error,
					data) {
				var configLBList = lbList;
				var opLBList = data;
				var resultData = {
					opLBList : opLBList,
					configLBList : configLBList
				};
				redisUtils.setexRedisData(reqId, uveListExpTime, resultData);
				commonUtils.handleJSONResponse(null, res, resultData);
			});
			
		});
	});
}

function getLoadBalancersListAsync(dataObj, callback) {
	console.log("getLoadBalancersListAsync:"+dataObj.type);
	getLBListFromConfig(dataObj.req, dataObj.appData, function(error,
			configLBList) {
		callback(null, configLBList);
	});
}
function getAllUveLBListByConfigList(lbList,appData, callback) {
	var resultJSON = [], lbKfilt = [],
	url = '/analytics/uves/loadbalancer';
	lt = lbList[0]['lbUUIDList'];
	console.log("LBLISt:", lbList);
	console.log("LBLISt:lt:"+lt);
    for (i = 0; i < lt.length ; i++) {
    		lbKfilt.push(lt[i])
    }
    console.log("lbKfilt",lbKfilt);
	var postData = {};
    postData['kfilt'] = lbKfilt;
    
	// url=url+"?kfilt="+lt;

    console.log("URL:"+url);
    console.log("postData:",postData);
    
   
    opApiServer.apiPost(url, postData, appData, function (err, data) {
        if (err || (null == data)) {
            logutils.logger.error('In Load Balancers: we did not get data ' +
            'for: ' + url);
            callback(null, resultJSON);
            return;
        }
        console.log("data:",data);
        var len = resultJSON.length;
        data = data['value'];
        var newCnt = data.length;
        for (var i = 0; i < newCnt; i++) {
        			resultJSON[len + i] = data[i]['name'];
        }
        callback(null, resultJSON);
    });
}

function getLBListFromConfig(req, appData, callback) {
	console.log("getLBListFromConfig");
	var parent_id = req.body['FQN'];
	if (null == parent_id) {
		/* All Load Balancer */
		getAllConfigLBList(req, appData, function(error, configLBList) {
			callback(null, configLBList);
		});
	} else {
		var url = "/loadbalancers?parent_id=" + parent_id;
		configApiServer.apiGet(url, appData, function(error, lbData) {
			if ((null != error) || (null == lbData)) {
				callback(error, []);
				return;
			}
			var lbData = commonUtils.getValueByJsonPath(lbData,
					"loadbalancers", []);
			var lbCnt = lbData.length;
			var lbIdList = [];
			var lbFqnList = [];
			for (var i = 0; i < lbCnt; i++) {
				lbIdList.push(lbData[i].uuid);
				lbFqnList.push(lbData[i].fq_name.join(":"));
			}
			console.log("getLBListFromConfig:else:", lbIdList, lbFqnList);
			callback(null, {
				lbUUIDList : lbIdList,
				lbFqnList : lbFqnList
			});
		});
	}
}

function getAllConfigLBList(req, appData, callback) {
	var chunk = 200;
	var reqUrl = "/loadbalancers?parent_id=";
	var dataObjArr = [];
	var tmpArray = [];
	var domainFQN = commonUtils.getValueByJsonPath(req, "cookies;domain", null,
			false);
	getAllProjectList(req, appData, function(err, tenantList) {
		var projects = commonUtils
				.getValueByJsonPath(tenantList, "tenants", []);
		var projectsLen = projects.length;
		var uuidList = [];
		for (var i = 0; i < projectsLen; i++) {
			var uuid = commonUtils.convertUUIDToString(projects[i].id);
			uuidList.push(uuid);
		}
		for (var i = 0, j = projectsLen; i < j; i += chunk) {
			tmpArray = uuidList.slice(i, i + chunk);
			var url = reqUrl + tmpArray.join(",");
			commonUtils.createReqObj(dataObjArr, url, null, null, null, null,
					appData);
		}
		async.map(dataObjArr, commonUtils.getAPIServerResponse(
				configApiServer.apiGet, true), function(error, lbChunks) {
			var lbIDList = [];
			var lbFqnList = [];
			lbChunkLen = lbChunks.length;
			for (var i = 0; i < lbChunkLen; i++) {
				if (lodash.isNil(lbChunks[i])) {
					continue;
				}
				var lbsPerChunk = commonUtils.getValueByJsonPath(lbChunks, i
						+ ";loadbalancers", []);
				var lbsPerChunkCnt = lbsPerChunk.length;
				for (var j = 0; j < lbsPerChunkCnt; j++) {
					lbid = lbsPerChunk[j].uuid;
					lbfqn = lbsPerChunk[j].fq_name.join(":");
					lbIDList.push(lbid);
					lbFqnList.push(lbfqn);
				}
			}
			callback(null, {
				lbUUIDList : lbIDList,
				lbFqnList : lbFqnList
			});
		});
	});
}

function getAllProjectListCB(dataObj, callback) {
	var type = dataObj.type;
	if ("config" === type) {
		getAllProjectFromConfig(dataObj.req, dataObj.appData, callback);
	} else {
		getAllProjectFromIdentity(dataObj.req, dataObj.appData, callback);
	}
}

function getAllProjectList(req, appData, callback) {
	var dataObjArr = [];
	var configProjects, identityProjects;
	var identityProjectsCnt = 0, configProjectsLen = 0;
	var tmpProjects = {};

	dataObjArr.push({
		type : "config",
		req : req,
		appData : appData
	});
	dataObjArr.push({
		type : "identity",
		req : req,
		appData : appData
	});
	async.map(dataObjArr, getAllProjectListCB, function(error, data) {
		configProjects = data[0].tenants;
		identityProjects = data[1].tenants;
		identityProjectsCnt = identityProjects.length;
		for (var i = 0; i < identityProjectsCnt; i++) {
			var projName = identityProjects[i].name;
			tmpProjects[projName] = identityProjects[i];
		}
		configProjectsLen = configProjects.length;
		for (i = 0; i < configProjectsLen; i++) {
			var projName = configProjects[i].name;
			if (lodash.isNil(tmpProjects[projName])) {
				identityProjects.push(configProjects[i]);
			}
		}
		callback(null, {
			tenants : identityProjects
		});
	});
}

function getAllProjectFromConfig(req, appData, callback) {
	var tenantList = [];
	var domCookie = req.cookies.domain;
	var url = "/projects?parent_type=domain&parent_fq_name_str=" + domCookie;
	configApiServer.apiGet(url, appData, function(error, data) {
		if ((null != error) || (null == data) || (null == data.projects)) {
			callback(null, {
				tenants : []
			});
			return;
		}
		var projects = data.projects;
		var projCnt = projects.length;
		for (var i = 0; i < projCnt; i++) {
			tenantList.push({
				name : projects[i].fq_name[1],
				id : commonUtils
						.convertApiServerUUIDtoKeystoneUUID(projects[i].uuid)
			});
		}
		callback(null, {
			tenants : tenantList
		});
	});
}

function getAllProjectFromIdentity(req, appData, callback) {
	authApi.getTenantList(req, appData, function(error, tenantList) {
		if ((null != error) || (null == tenantList)
				|| (null == tenantList.tenants)) {
			callback(null, {
				tenants : []
			});
			return;
		}
		callback(null, tenantList);
	});
}

/**
*
* @param req
* @param res
* @param appData
*/
function getLoadBalancersDetails (req, res, appData) {
   
	getLoadBalancersForUserFromAnalytics(req, appData, function (err, instDetails) {
       commonUtils.handleJSONResponse(err, res, instDetails);
       return;
   });
}


function getLoadBalancersForUserFromAnalytics (req, appData, callback) {
    var lastUUID = req.query['lastKey'];
    var count = req.query['count'];
    var type = req.query['type'];
    var filtUrl = null;

    var reqId = req.body['id'];
    var fqn = req.body['FQN'];
    var opUrl = '/analytics/uves/loadbalancer';
    var postData = {};
    var resultJSON = createEmptyPaginatedData();

    postData['cfilt'] = [
        'UveVirtualNetworkAgent:virtualmachine_list',
        'UveVirtualNetworkAgent:interface_list'
    ];
    if (null == fqn) {
        fqn = commonUtils.getValueByJsonPath(req, "cookies;domain", null, false);
    }
    var fqnArr = fqn.split(":");
    if (3 == fqnArr.length) {
        /* VN */
        postData['kfilt'] = [fqn];
    } else {//if (type == 'project') {
        postData['kfilt'] = [fqn + ":*"];
    }

    var filtData = nwMonUtils.buildBulkUVEUrls(req.body, appData);
    if (filtData && filtData[0]) {
        filtUrl = filtData[0]['reqUrl'];
    }

    redisUtils.getRedisData(reqId, function(error, opVMCachedList) {
        if (null != opVMCachedList) {
            var data = nwMonUtils.makeUVEList(opVMCachedList, 'VMUUID');

            processInstanceReqByLastUUID(lastUUID, count, 'VMUUID', data, filtUrl, appData,
                                     function (err, data) {
                getVMIDetils(data, appData, function(error, vmiData) {
                    data.vmiData = vmiData;
                    callback(err, data);
                });
            });
        } else {
            getVMListByURL(opUrl, postData, appData, function(err, list) {
                var opVMList = list.vmList;
                if (!opVMList.length) {
                    callback(null, {data: {}, lastKey: null, more: false});
                    return;
                }
                redisUtils.setexRedisData(reqId, uveListExpTime, opVMList);
                var data = nwMonUtils.makeUVEList(opVMList, 'VMUUID');
                processInstanceReqByLastUUID(lastUUID, count, 'VMUUID', data, filtUrl, appData, function (err, data) {
                    getVMIDetils(data, appData, function(error, vmiData) {
                        data.vmiData = vmiData;
                        callback(err, data);
                    });
                });
            });
        }
    });
}



/* List all public functions */

exports.getLoadBalancersUUIDList = getLoadBalancersUUIDList;
