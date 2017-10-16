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
            "loadbalancer_provider": "",
            "loadbalancer_properties": {},
            'service_instance_refs': "",
            "virtual_machine_interface_refs": "",
            "provisioning_status": "",
            "admin_state": false,
            "fixed_ip": "",
            "operating_status": ""
        },

        formatModelConfig: function(modelConfig) {
            var proStatus = getValueByJsonPath(modelConfig,
                    "loadbalancer_properties;provisioning_status", '');
            if(proStatus != ''){
                modelConfig["provisioning_status"] = proStatus;
            }
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
            var opStatus = getValueByJsonPath(modelConfig,
                    "loadbalancer_properties;operating_status", '');
            if(opStatus != ''){
                modelConfig["operating_status"] = opStatus;
            }
            var serviceInsto = getValueByJsonPath(modelConfig,
                    "service_instance_refs;0;to",'');
            if(serviceInsto != ''){
                modelConfig["service_instance_refs"] = serviceInsto[serviceInsto.length-1];
            }
            var vmito = getValueByJsonPath(modelConfig,
                    "virtual_machine_interface_refs;0;to",'');
            if(vmito != ''){
                modelConfig["virtual_machine_interface_refs"] = vmito[vmito.length-1];
            }
            return modelConfig;
        }
    });
    return lbInfoModel;
});