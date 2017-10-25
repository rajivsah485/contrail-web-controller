/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var listenerInfoModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "description":"",
            "loadbalancer_listener_properties": {},
            "protocol": "",
            "admin_state": true,
            "connection_limit": "",
            "protocol_port": ""
        },

        formatModelConfig: function(modelConfig) {
            var protocol = getValueByJsonPath(modelConfig,
                    "loadbalancer_listener_properties;protocol", '');
            if(protocol != ''){
                modelConfig["protocol"] = protocol;
            }
            var adminState = getValueByJsonPath(modelConfig,
                    "loadbalancer_listener_properties;admin_state", false);
            if(adminState){
                modelConfig["admin_state"] = adminState;
            }
            var conLimit = getValueByJsonPath(modelConfig,
                    "loadbalancer_listener_properties;connection_limit", '');
            if(conLimit != ''){
                modelConfig["connection_limit"] = conLimit;
            }
            var port = getValueByJsonPath(modelConfig,
                    "loadbalancer_listener_properties;protocol_port", '');
            if(port != ''){
                modelConfig["protocol_port"] = port;
            }
            var description = getValueByJsonPath(modelConfig,
                    "id_perms;description", '');
            if(description != ''){
                modelConfig["description"] = description;
            }
            return modelConfig;
        }
    });
    return listenerInfoModel;
});