/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var poolMemberModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "subnet":"",
            "ip_address":"",
            "port":"80",
            "weight":"1",
            "admin_state":false,
            "status_description": "",
            "loadbalancer_member_properties": {}
            
        },

        formatModelConfig: function(modelConfig) {
           var protocolPort = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;protocol_port", '');
            if(protocolPort != ''){
                modelConfig["port"] = protocolPort;
            }
            var adminState = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;admin_state", false);
            if(adminState){
                modelConfig["admin_state"] = adminState;
            }
            var address = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;address", '');
            if(address != ''){
                modelConfig["ip_address"] = address;
            }
            var weight = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;weight", 0);
            if(weight != 0){
                modelConfig["weight"] = weight;
            }
            var description = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;status_description", '');
            if(description != ''){
                modelConfig["status_description"] = description;
            }
            var subnet = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;subnet", '');
            if(subnet != ''){
                modelConfig["subnet"] = subnet;
            }
            return modelConfig;
        }
    });
    return poolMemberModel;
});