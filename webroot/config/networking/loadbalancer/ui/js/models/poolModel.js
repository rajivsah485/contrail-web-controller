/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var poolModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "protocol": "",
            "description":"",
            "loadbalancer_pool_properties": {},
            'session_persistence': "",
            "status_description":"",
            "loadbalancer_method":"",
            "admin_state": false
        },

        formatModelConfig: function(modelConfig) {
            var protocol = getValueByJsonPath(modelConfig,
                    "loadbalancer_pool_properties;protocol", '');
            if(protocol != ''){
                modelConfig["protocol"] = protocol;
            }
            var adminState = getValueByJsonPath(modelConfig,
                    "loadbalancer_pool_properties;admin_state", false);
            if(adminState){
                modelConfig["admin_state"] = adminState;
            }
            var persistence = getValueByJsonPath(modelConfig,
                    "loadbalancer_pool_properties;session_persistence", '');
            if(persistence != ''){
                modelConfig["session_persistence"] = persistence;
            }
            var description = getValueByJsonPath(modelConfig,
                    "loadbalancer_pool_properties;status_description", '');
            if(description != ''){
                modelConfig["status_description"] = description;
            }
            var method = getValueByJsonPath(modelConfig,
                    "loadbalancer_pool_properties;loadbalancer_method", '');
            if(method != ''){
                modelConfig["loadbalancer_method"] = method;
            }
            var description = getValueByJsonPath(modelConfig,
                    "id_perms;description", '');
            if(description != ''){
                modelConfig["description"] = description;
            }
            return modelConfig;
        }
    });
    return poolModel;
});