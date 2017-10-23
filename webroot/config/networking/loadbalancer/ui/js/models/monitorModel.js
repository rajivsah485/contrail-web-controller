/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var MonitorModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "delay":"5",
            "description":"",
            "max_retries":"3",
            "admin_state":false,
            "timeout": "5",
            "monitor_type":"",
            "loadbalancer_healthmonitor_properties": {},
            "field_disable": false,
            'http_method': '',
            'expected_codes':'',
            'url_path':'',
            
        },

        formatModelConfig: function(modelConfig) {
            var delay = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;delay", '');
            if(delay != ''){
                modelConfig["delay"] = delay;
            }
            var adminState = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;admin_state", false);
            if(adminState){
                modelConfig["admin_state"] = adminState;
            }
            var retries = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;max_retries", '');
            if(retries != ''){
                modelConfig["max_retries"] = retries;
            }
            var httpMethod = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;http_method", '');
            if(httpMethod != ''){
                modelConfig["http_method"] = httpMethod;
            }
            var expectedCodes = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;expected_codes", '');
            if(expectedCodes != ''){
                modelConfig["expected_codes"] = expectedCodes;
            }
            var urlPath = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;url_path", '');
            if(urlPath != ''){
                modelConfig["url_path"] = urlPath;
            }
            var timeout = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;timeout", '');
            if(timeout != ''){
                modelConfig["timeout"] = timeout;
            }
            var monitorType = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;monitor_type", '');
            if(monitorType != ''){
                modelConfig["monitor_type"] = monitorType;
            }
            var description = getValueByJsonPath(modelConfig,
                    "id_perms;description", '');
            if(description != ''){
                modelConfig["description"] = description;
            }
            return modelConfig;
        }
    });
    return MonitorModel;
});