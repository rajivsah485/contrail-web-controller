/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model',
    'config/networking/loadbalancer/ui/js/models/poolMemberCollectionModel'
], function (_, ContrailModel, PoolMemberCollectionModel) {
    var poolMemberModel = ContrailModel.extend({
        defaultConfig: {
            "display_name": "",
            "subnet":"",
            "ip_address":"",
            "description":"",
            "port":"80",
            "weight":"1",
            "admin_state": true,
            "status_description": "",
            "loadbalancer_member_properties": {},
            'pool_member': []
            
        },

        formatModelConfig: function(modelConfig) {
           var poolMemberCollection = [];
           modelConfig["pool_member"] = new Backbone.Collection(poolMemberCollection);
           var protocolPort = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;protocol_port", '');
            if(protocolPort != ''){
                modelConfig["port"] = protocolPort;
            }
            modelConfig["admin_state"] = getValueByJsonPath(modelConfig,
                    "loadbalancer_member_properties;admin_state", false);
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
            var description = getValueByJsonPath(modelConfig,
                    "id_perms;description", '');
            if(description != ''){
                modelConfig["description"] = description;
            }
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
        }
    });
    return poolMemberModel;
});