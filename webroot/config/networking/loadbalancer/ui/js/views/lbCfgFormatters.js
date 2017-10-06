/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 *
 */

define([
    'underscore'
], function (_) {
    var lbCfgFormatters = function() {
        var self = this;

        this.setPostUrlData = function (options) {
            var type = options.type;
            var fields = options.fields;
            var parent_id = options.parentId;
            var postData = {
               "data" : [ {
                   "type" : type
               } ]
            }
            if(fields != null && fields.length > 0) {
                postData['data'][0]['fields'] = fields;
            }
            if(parent_id != null && parent_id.length > 0) {
                postData['data'][0]['parent_id'] = parent_id;
            }
            return JSON.stringify(postData);
        };

        this.descriptionFormatter = function(d, c, v, cd, dc) {
            var description = getValueByJsonPath(dc, 'id_perms;description', '');
            if (description !== '') {
                return description;
            }else{
                return '-'; 
            } 
        };

        this.operatingStatusFormatter = function(d, c, v, cd, dc) {
            var status = getValueByJsonPath(dc, 'loadbalancer_properties;operating_status', '');
            if (status !== '') {
                return status;
            }else{
                return '-'; 
            } 
        };

        this.provisioningStatusFormatter = function(d, c, v, cd, dc) {
            var status = getValueByJsonPath(dc, 'loadbalancer_properties;provisioning_status', '');
            if (status !== '') {
                return status;
            }else{
                return '-'; 
            } 
        };
        
        this.ipAddressFormatter = function(d, c, v, cd, dc) {
            var ip = getValueByJsonPath(dc, 'loadbalancer_properties;vip_address', '');
            if (ip !== '') {
                return ip;
            }else{
                return '-'; 
            } 
        };
        
        this.listenersCountFormatter = function(d, c, v, cd, dc) {
            var listener = getValueByJsonPath(dc, 'loadbalancer_listener_back_refs', []);
            if (listener.length > 0) {
                return listener.length.toString();
            }else{
                return '0'; 
            } 
        };
    }
    return lbCfgFormatters;
});
