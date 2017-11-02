/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-config-model',
    'config/networking/loadbalancer/ui/js/models/poolMemberCollectionModel',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters'
], function (_, ContrailConfigModel, PoolMemberCollectionModel, LbCfgFormatters) {
    var lbCfgFormatters = new LbCfgFormatters();
    var lbCfgModel = ContrailConfigModel.extend({
        defaultConfig: {
            'name': 'Load balancer 1',
            'display_name': '',
            'description': '',
            'ip_address': '',
            'lb_provider': '',
            'lb_status':'',
            'lb_provisioning_status':'',
            'lb_vipaddress': '',
            'lb_vipsubnetid':'',
            'lb_operating_status':'',
            'lb_admin_state': true,
            'lb_subnet': '',
            'listener_name':'Listener 1',
            'listener_description':'',
            'listener_protocol':'',
            'listener_port':'',
            'listener_admin_state': true,
            'pool_name':'Pool 1',
            'pool_description':'',
            'pool_method':'',
            'pool_member': [],
             //'pool_status':'',
            'pool_protocol':'',
            'pool_session_persistence':'',
            'pool_subnet_id':'',
            'pool_admin_state': true,
            'monitor_type':'',
            'health_check_interval':'5',
            'retry_count':'3',
            'timeout':'5',
            'monitor_http_method': 'GET',
            'monitor_http_status_code':'200',
            'monitor_url_path':'/',
            'field_disable': false,
            'existing_port' :''
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

        validations: {
            loadBalancerValidation: {
                'name' : function(value, attr, data) {
                   if(value === ''){
                       return "Enter the name.";
                   }
                },
                'ip_address' : function(value, attr, data) {
                    if(!lbCfgFormatters.validateIP(value)){
                        return "The IP address is not valid.";
                    }
                 },
                 'listener_name' : function(value, attr, data) {
                     if(value === ''){
                         return "Enter the name.";
                     }
                },
                'listener_port': function(value, attr, data) {
                   var port = Number(value);
                   if(data.existing_port.length > 0){
                       if(data.existing_port.indexOf(port) !== -1){
                           return "The port must be unique among all listeners attached to this load balancer";
                       }  
                   }
                },
                'pool_name' : function(value, attr, data) {
                    if(value === ''){
                        return "Enter the name.";
                    }
               }
             }
        },

        configureLoadBalancer: function(callbackObj, options, allData, isListener){
            var ajaxConfig = {}, returnFlag = true,updatedVal = {}, postFWRuleData = {};
            var postFWPolicyData = {}, newFWPolicyData, attr;
            var updatedModel = {},policyList = [];
            var self = this;
            //Validation we have to update
            var model = $.extend(true,{},this.model().attributes);
            var poolMember = $.extend(true,{},model.pool_member).toJSON();
            var obj = {};
            if(!isListener){
             // Load Balancer
                var loadbalancer = {};
                loadbalancer.name = model.name;
                loadbalancer.display_name = model.name;
                var fqName = [];
                fqName.push(contrail.getCookie(cowc.COOKIE_DOMAIN));
                fqName.push(contrail.getCookie(cowc.COOKIE_PROJECT));
                fqName.push(model.name);
                loadbalancer.fq_name = fqName;
                loadbalancer["parent_type"] = "project";
                if(model.lb_provider !== ''){
                    var providerRef = model.lb_provider.split(';');
                    var providerName = providerRef[1];
                    
                    loadbalancer.loadbalancer_provider = providerName;
                    loadbalancer.service_appliance_set_refs = [];
                    var providerObj = {};
                    providerObj.to = providerRef;
                    loadbalancer.service_appliance_set_refs.push(providerObj);
                }
                loadbalancer.loadbalancer_properties = {};
                loadbalancer.loadbalancer_properties['admin_state'] = model.lb_admin_state;
                loadbalancer.loadbalancer_properties['vip_address'] = model.ip_address;
                loadbalancer.loadbalancer_properties['vip_subnet_id'] = model.lb_subnet;
                if(model.description !== ''){
                    loadbalancer.id_perms = {};
                    loadbalancer.id_perms.description = model.description; 
                }
                obj.loadbalancer = loadbalancer; 
            }else{
                var lbObj = options.lbObj;
                obj.loadbalancer = lbObj;
            }
            // Listeners
            var listener = {};
            listener.name = model.listener_name;
            var listenerfqName = [];
            listenerfqName.push(contrail.getCookie(cowc.COOKIE_DOMAIN));
            listenerfqName.push(contrail.getCookie(cowc.COOKIE_PROJECT));
            listenerfqName.push(model.listener_name);
            listener.fq_name = listenerfqName;
            listener["parent_type"] = "project";
            if(model.listener_description !== ''){
                listener.id_perms = {};
                listener.id_perms.description = model.listener_description;
            }
            listener.loadbalancer_listener_properties = {};
            listener.loadbalancer_listener_properties['admin_state'] = model.listener_admin_state;
            listener.loadbalancer_listener_properties['protocol'] = model.listener_protocol;
            listener.loadbalancer_listener_properties['protocol_port'] = Number(model.listener_port);
            obj['loadbalancer-listener'] = listener;
            
            // Pool
            var pool = {};
            pool.name = model.pool_name;
            var poolfqName = [];
            poolfqName.push(contrail.getCookie(cowc.COOKIE_DOMAIN));
            poolfqName.push(contrail.getCookie(cowc.COOKIE_PROJECT));
            poolfqName.push(model.pool_name);
            pool.fq_name = poolfqName;
            pool["parent_type"] = "project";
            if(model.pool_description !== ''){
                pool.id_perms = {};
                pool.id_perms.description = model.pool_description;
            }
            pool.loadbalancer_pool_properties = {};
            pool.loadbalancer_pool_properties['admin_state'] = model.pool_admin_state;
            pool.loadbalancer_pool_properties['loadbalancer_method'] = model.pool_method;
            if(model.pool_session_persistence !== ''){
                pool.loadbalancer_pool_properties['session_persistence'] = model.pool_session_persistence;
            }
            if(model.pool_protocol !== ''){
                pool.loadbalancer_pool_properties['protocol'] = model.pool_protocol;
            }
            obj['loadbalancer-pool'] = pool;
            
            if(poolMember.length > 0){
                var poolStack = [];
                _.each(poolMember, function(poolObj) {
                    var obj = {};
                    obj.name = poolObj.pool_name();
                    obj.parent_type = "loadbalancer-pool";
                    var memberfqName = [];
                    memberfqName.push(contrail.getCookie(cowc.COOKIE_DOMAIN));
                    memberfqName.push(contrail.getCookie(cowc.COOKIE_PROJECT));
                    memberfqName.push(poolObj.pool_name());
                    obj.fq_name = memberfqName;
                    obj.loadbalancer_member_properties = {};
                    obj.loadbalancer_member_properties['address'] = poolObj.pool_member_ip_address();
                    obj.loadbalancer_member_properties['protocol_port'] = Number(poolObj.pool_member_port());
                    obj.loadbalancer_member_properties['weight'] = Number(poolObj.pool_member_weight());
                    obj.loadbalancer_member_properties['vip_subnet_id'] = poolObj.pool_member_subnet();
                    poolStack.push(obj);
                });
                obj['loadbalancer-member'] = poolStack;
            }
            // Monitor
            var monitor = {};
            monitor.name = '';
            var monitorFqName = [];
            monitorFqName.push(contrail.getCookie(cowc.COOKIE_DOMAIN));
            monitorFqName.push(contrail.getCookie(cowc.COOKIE_PROJECT));
            monitorFqName.push('');
            monitor.fq_name = monitorFqName;
            monitor["parent_type"] = "project";
            monitor.loadbalancer_healthmonitor_properties = {};
            monitor.loadbalancer_healthmonitor_properties['delay'] = Number(model.health_check_interval);
            monitor.loadbalancer_healthmonitor_properties['max_retries'] = Number(model.retry_count);
            monitor.loadbalancer_healthmonitor_properties['monitor_type'] = model.monitor_type;
            monitor.loadbalancer_healthmonitor_properties['timeout'] = Number(model.timeout);
            if(model.monitor_type === 'HTTP'){
                monitor.loadbalancer_healthmonitor_properties['url_path'] = model.monitor_url_path;
                monitor.loadbalancer_healthmonitor_properties['expected_codes'] = model.monitor_http_status_code;
                monitor.loadbalancer_healthmonitor_properties['http_method'] = model.monitor_http_method;
            }
            obj['loadbalancer-healthmonitor'] = monitor;
            
            if(isListener){
                ajaxConfig.url = '/api/tenants/config/lbaas/listener';
            }else{
                ajaxConfig.url = '/api/tenants/config/lbaas/load-balancer';
            }
            ajaxConfig.type  = 'POST';
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
        }
    });
    return lbCfgModel;
});
