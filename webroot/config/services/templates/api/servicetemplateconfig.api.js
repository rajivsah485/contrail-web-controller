/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

/**
 * @servicetemplate.api.js
 *     - Handlers for Service Template Configuration
 *     - Interfaces with config api server
 */

var rest = require(process.mainModule.exports["corePath"] + '/src/serverroot/common/rest.api');
var async = require('async');
var logutils = require(process.mainModule.exports["corePath"] + '/src/serverroot/utils/log.utils');
var commonUtils = require(process.mainModule.exports["corePath"] +
                          '/src/serverroot/utils/common.utils');
var config = process.mainModule.exports["config"];
var messages = require(process.mainModule.exports["corePath"] + '/src/serverroot/common/messages');
var global = require(process.mainModule.exports["corePath"] + '/src/serverroot/common/global');
var appErrors = require(process.mainModule.exports["corePath"] +
                        '/src/serverroot/errors/app.errors');
var util = require('util');
var url = require('url');
var imageApi = require(process.mainModule.exports["corePath"] + '/src/serverroot/common/imagemanager.api');
var configApiServer = require(process.mainModule.exports["corePath"] + '/src/serverroot/common/configServer.api');
var computeApi = require(process.mainModule.exports["corePath"] + '/src/serverroot/common/computemanager.api');

/**
 * Bail out if called directly as "nodejs servicetemplateconfig.api.js"
 */
if (!module.parent) 
{
    logutils.logger.warn(util.format(messages.warn.invalid_mod_call,
        module.filename));
    process.exit(1);
}

/**
 * @listServiceTemplates
 * public function
 * 1. URL /api/tenants/config/service-templates/:id
 * 2. Gets list of service templates for a given domain
 * 3. Needs domain  id as the id
 * 4. Calls listServiceTemplatesCb that process data from config
 *    api server and sends back the http response.
 */
function listServiceTemplates(request, response, appData) 
{
    var domainId = null;
    var requestParams = url.parse(request.url, true);

    domainId = request.param('id');

    var svcTmplUrl = '/service-templates?detail=true&' +
        'fields=service_template_properties,service_instance_back_refs&' +
        'parent_id=' + domainId;
    configApiServer.apiGet(svcTmplUrl, appData,
        function (error, data) {
        if ((null != error) || (null == data) ||
            (null == data['service-templates'])) {
            commonUtils.handleJSONResponse(error, response, null);
            return;
        }
        stListAggCb(data['service-templates'], response)
    });
}

/**
 * @stListAggCb
 * private function
 * 1. Callback for the ST gets, sends all STs to client.
 */
function stListAggCb(results, response) 
{
    var serviceTemplates = {}, finalResults;

    finalResults = filterDefaultAnalyzerTemplate(results);
    serviceTemplates['service_templates'] = finalResults;
    commonUtils.handleJSONResponse(null, response, serviceTemplates);
}

function getServiceTemplates (dataObj, callback)
{
    var serviceTemplates = {}, finalResults;

    var configData = dataObj['configData'];
    var dataObjArr = dataObj['dataObjArr'];
    
    async.map(dataObjArr,
              commonUtils.getServerResponseByRestApi(configApiServer,
                                                     true),
              function(err, result) {
        serviceTemplates['service_templates'] = result;
        callback(err, serviceTemplates);
    });
}

/**
 * @filterDefaultAnalyzerTemplate
 * private function
 * 1. Filter Default Analyzer Template
 * 2. Required SI Template JSON
 */
function filterDefaultAnalyzerTemplate(serviceTemplates) 
{
    var name, filteredTemplates = [], j = 0;
    for (var i = 0; i < serviceTemplates.length; i++) {
        name = serviceTemplates[i]['service-template']['name'];
        if (name != 'analyzer-template') {
            filteredTemplates[j++] = serviceTemplates[i];
        }
    }
    return filteredTemplates;
}

function filterDefAnalyzerTemplate (svcTmpl)
{
    var j = 0;
    var filteredTemplates = [];
    try {
        var svcTmplLen = svcTmpl.length;
    } catch(e) {
        return svcTmpl;
    }
    for (var i = 0; i < svcTmplLen; i++) {
        try {
            if (svcTmpl[i]['to'][1] != 'analyzer-template') {
                filteredTemplates[j++] = svcTmpl[i];
            }
        } catch(e) {
        }
    }
    return filteredTemplates;
}

/**
 * @createServiceTemplate
 * public function
 * 1. URL /api/tenants/config/service-templates - Post
 * 2. Sets Post Data and sends back the service template config to client
 */
function createServiceTemplate(request, response, appData) 
{
    var stCreateURL = '/service-templates';
    var stPostData = request.body;

    if (typeof(stPostData) != 'object') {
        error = new appErrors.RESTServerError('Invalid Post Data');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }

    if ((!('service-template' in stPostData)) ||
        (!('fq_name' in stPostData['service-template'])) ||
        (!(stPostData['service-template']['fq_name'][1].length))) {
        error = new appErrors.RESTServerError('Invalid Service template');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }

    configApiServer.apiPost(stCreateURL, stPostData, appData,
        function (error, data) {
            setSTRead(error, data, response, appData);
        });

}

/**
 * @deleteServiceTemplateCb
 * private function
 * 1. Return back the response of service template delete.
 */
function deleteServiceTemplateCb(error, stDelResp, response) 
{

    if (error) {
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }

    commonUtils.handleJSONResponse(error, response, stDelResp);
}

/**
 * @deleteServiceTemplate
 * public function
 * 1. URL /api/tenants/config/service-template/:id
 * 2. Deletes the service template from config api server
 */
function deleteServiceTemplate(request, response, appData) 
{
    var stDelURL = '/service-template/';
    var stId = null;
    var requestParams = url.parse(request.url, true);

    if (stId = request.param('id').toString()) {
        stDelURL += stId;
    } else {
        error = new appErrors.RESTServerError('Service Template ID is required.');
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }
    configApiServer.apiDelete(stDelURL, appData,
        function (error, data) {
            deleteServiceTemplateCb(error, data, response)
        });
}

/**
 * @setSTRead
 * private function
 * 1. Callback for ST create / update operations
 * 2. Reads the response of ST get from config api server
 *    and sends it back to the client.
 */
function setSTRead(error, stConfig, response, appData) 
{
    var stGetURL = '/service-template/';

    if (error) {
        commonUtils.handleJSONResponse(error, response, null);
        return;
    }

    stGetURL += stConfig['service-template']['uuid'];
    configApiServer.apiGet(stGetURL, appData,
        function (error, data) {
            stSendResponse(error, data, response)
        });
}

/**
 * @stSendResponse
 * private function
 * 1. Sends back the response of service template read to clients after set operations.
 */
function stSendResponse(error, stConfig, response) 
{
    if (error) {
        commonUtils.handleJSONResponse(error, response, null);
    } else {
        commonUtils.handleJSONResponse(error, response, stConfig);
    }
    return;
}

/**
 * @listServiceTemplateImages
 * public function
 * URL: /api/tenants/config/service-template-images - GET
 * 1. Gets the list of available images registed with Glance and sends back response to client.
 */
function listServiceTemplateImages(request, response, appData) 
{
    imageApi.getImageList(request, function (error, data) {
        if (error) {
            commonUtils.handleJSONResponse(error, response, null);
        } else {
            commonUtils.handleJSONResponse(error, response, data);
        }
    });
}

/**
 * @getSystemFlavors
 * private function
 * 1.gets the list of system flavors with details and sends back response to client.
 */
function getSystemFlavors(request, response, appdata)
{
    computeApi.getFlavors(request, function(err, data) {
        commonUtils.handleJSONResponse(err, response, data);
    });
}

exports.listServiceTemplates = listServiceTemplates;
exports.getServiceTemplates  = getServiceTemplates;
exports.listServiceTemplateImages = listServiceTemplateImages;
exports.createServiceTemplate = createServiceTemplate;
exports.deleteServiceTemplate = deleteServiceTemplate;
exports.getSystemFlavors = getSystemFlavors;
exports.filterDefAnalyzerTemplate = filterDefAnalyzerTemplate;

