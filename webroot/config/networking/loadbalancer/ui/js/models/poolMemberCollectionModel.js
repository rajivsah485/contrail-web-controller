/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model'
], function (_, ContrailModel) {
    var self;
    var poolMemberModel = ContrailModel.extend({
        defaultConfig: {
            'pool_member_ip_address' : '',
            'pool_member_subnet' : '',
            'pool_member_port': '',
            'pool_member_weight':'1',
            'pool_name':''
        },
        formatModelConfig: function (modelConfig) {
            return modelConfig;
        }
        
    });
    return poolMemberModel;
});
