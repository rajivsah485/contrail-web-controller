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
        },
        updateLoadBalancer: function(callbackObj){
            var ajaxConfig = {};
            var self = this;
            var model = $.extend(true,{},this.model().attributes);
            var obj = {};
            obj.loadbalancer = {};
            obj.loadbalancer.display_name = model.display_name;
            obj.loadbalancer.uuid = model.uuid;
            ajaxConfig.url = ' /api/tenants/config/lbaas/load-balancer/'+ model.uuid;
            ajaxConfig.type  = 'PUT';
            ajaxConfig.data  = JSON.stringify(obj);
            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function (response) {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
                returnFlag = true;
            }, function (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
                returnFlag = false;
            });
        },
        multiDeleteLB: function (checkedRows, callbackObj) {
            var ajaxConfig = {}, that = this;
            var uuidList = [];
            $.each(checkedRows, function (checkedRowsKey, checkedRowsValue) {
                uuidList.push(checkedRowsValue.uuid);
            });
            ajaxConfig.type = "DELETE";
            ajaxConfig.url = '/api/tenants/config/lbaas/load-balancer/' + uuidList[0];
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
    return lbInfoModel;
});