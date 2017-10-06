/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-config-model',
    'config/networking/loadbalancer/ui/js/models/poolMemberCollectionModel'
], function (_, ContrailConfigModel, PoolMemberCollectionModel) {
    var lbCfgModel = ContrailConfigModel.extend({

        defaultConfig: {
            'name': 'Load balancer 1',
            'description': '',
            'ip_address': '',
            'lb_subnet': '',
            'listener_name':'Listener 1',
            'listener_description':'',
            'listener_protocol':'',
            'listener_port':'',
            'pool_name':'',
            'pool_description':'',
            'pool_method':'',
            'pool_member': [],
            'monitor_type':'',
            'health_check_interval':'5',
            'retry_count':'3',
            'timeout':'5'
            
        },

        formatModelConfig: function (modelConfig) {
            var poolMemberCollection = [];
            modelConfig["pool_member"] = new Backbone.Collection(poolMemberCollection);
            return modelConfig;
        },
        addPoolMember: function() {
            var poolMember = this.model().attributes['pool_member'],
                newPoolMember = new PoolMemberCollectionModel();
            poolMember.add([newPoolMember]);
        },
        addPoolMemberByIndex: function(data, member) {
            var selectedRuleIndex = data.model().collection.indexOf(member.model());
            var poolMember = this.model().attributes['pool_member'],
                newPoolMember = new PoolMemberCollectionModel();
            poolMember.add([newPoolMember],{at: selectedRuleIndex+1});
        },
        deletePoolMember: function(data, member) {
            var memberCollection = data.model().collection,
                delMember = member.model();
            memberCollection.remove(delMember);
        },
    });
    return lbCfgModel;
});
