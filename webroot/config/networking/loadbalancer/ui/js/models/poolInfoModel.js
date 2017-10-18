/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var poolInfoModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "loadbalancer_pool_properties": {},
            "protocol": "",
            "description":"",
            "admin_state": false,
            "session_persistence": "",
            "persistence_cookie_name": "",
            "status_description": "",
            "loadbalancer_method":""
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
            var cookieName = getValueByJsonPath(modelConfig,
                    "loadbalancer_pool_properties;persistence_cookie_name", '');
            if(cookieName != ''){
                modelConfig["persistence_cookie_name"] = cookieName;
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
    return poolInfoModel;
});