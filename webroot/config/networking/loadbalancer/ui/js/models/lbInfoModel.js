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
            modelConfig["admin_state"] = getValueByJsonPath(modelConfig,
                    "loadbalancer_properties;admin_state", false);
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
            model.id_perms.description = model.description;
            obj.loadbalancer.id_perms = model.id_perms;
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
            ajaxConfig.type = "POST";
            ajaxConfig.url = '/api/tenants/config/lbaas/load-balancer/delete';
            ajaxConfig.data = JSON.stringify({'uuids': uuidList});
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