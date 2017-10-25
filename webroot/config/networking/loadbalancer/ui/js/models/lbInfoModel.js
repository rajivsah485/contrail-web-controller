/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var lbInfoModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "description":"",
            "loadbalancer_provider": "",
            "loadbalancer_properties": {},
            "admin_state": true,
            "fixed_ip": "",
            "associated_ip_address": ""
        },

        formatModelConfig: function(modelConfig) {
            var adminState = getValueByJsonPath(modelConfig,
                    "loadbalancer_properties;admin_state", false);
            if(adminState){
                modelConfig["admin_state"] = adminState;
            }
            var ips = getValueByJsonPath(modelConfig,
                    "loadbalancer_properties;vip_address", '');
            if(ips != ''){
                modelConfig["fixed_ip"] = ips;
            }
            var description = getValueByJsonPath(modelConfig,
                    "id_perms;description", '');
            if(description != ''){
                modelConfig["description"] = description;
            }
            return modelConfig;
        }
    });
    return lbInfoModel;
});