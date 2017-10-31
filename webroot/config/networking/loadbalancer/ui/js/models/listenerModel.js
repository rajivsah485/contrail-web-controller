/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var listenerModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "protocol": "",
            "description":"",
            "loadbalancer_listener_properties": {},
            'connection_limit': "",
            "protocol_port": "",
            "admin_state": true
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
        },

        multiDeleteListener: function (checkedRows, callbackObj) {
            var ajaxConfig = {}, that = this;
            var uuidList = [];
            $.each(checkedRows, function (checkedRowsKey, checkedRowsValue) {
                uuidList.push(checkedRowsValue.uuid);
            });
            ajaxConfig.type = "DELETE";
            ajaxConfig.url = '/api/tenants/config/lbaas/listener/' + uuidList[0];
            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function (response) {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
            }, function (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
            });
        }
    });
    return listenerModel;
});