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
            "expected_codes":"0",
            "max_retries":"3",
            "http_method":"",
            "admin_state":false,
            "timeout": "5",
            "monitor_type":"",
            "loadbalancer_healthmonitor_properties": {}
            
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
            var code = getValueByJsonPath(modelConfig,
                    "loadbalancer_healthmonitor_properties;expected_codes", '');
            if(code != ''){
                modelConfig["expected_codes"] = code;
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
            return modelConfig;
        }
    });
    return MonitorModel;
});