/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model'
], function (_, ContrailView, ContrailListModel) {
    var poolMemberListView = ContrailView.extend({
        el: $(contentContainer),
        render: function () {
            var self = this,
                viewConfig = this.attributes.viewConfig,
                currentHashParams = layoutHandler.getURLHashParams(),
                loadBalancer = currentHashParams.focusedElement.loadBalancer,
                loadBalancerId = currentHashParams.focusedElement.uuid;
            var breadcrumbCount = $('#breadcrumb').children().length;
            if(breadcrumbCount === 3){
                pushBreadcrumb([loadBalancer]); 
            }
            var listModelConfig = {
                    remote: {
                        ajaxConfig: {
                            url: '/api/tenants/config/lbaas/load-balancer/'+ loadBalancerId ,
                            type: "GET"
                        },
                        dataParser: self.parseLoadbalancersData,
                    }
            };
            var contrailListModel = new ContrailListModel(listModelConfig);
            this.renderView4Config(this.$el,
                    contrailListModel, getPoolMemberGridViewConfig());
        },

        parseLoadbalancersData : function(response) {
           var listenerList = getValueByJsonPath(response,
                        "loadbalancer;loadbalancer-listener", [], false),
               poolMemberList = [], poolList = [];
           _.each(listenerList, function(listner) {
               var pool = getValueByJsonPath(listner, 'loadbalancer-pool', []);
               if(pool.length > 0){
                 poolList = poolList.concat(pool);   
               }
           });
           _.each(poolList, function(pool) {
               var poolMember = getValueByJsonPath(pool, 'loadbalancer-members', []);
               if(poolMember.length > 0){
                   poolMemberList = poolMemberList.concat(poolMember);   
               }
           });
           return poolMemberList;
        }
    });

    var getPoolMemberGridViewConfig = function () {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_LB_POOL_MEMBER_SECTION_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_LB_POOL_MEMBER_ID,
                                view: "poolMemberGridView",
                                viewPathPrefix: "config/networking/loadbalancer/ui/js/views/poolmember/",
                                app: cowc.APP_CONTRAIL_CONTROLLER,
                                viewConfig: {
                                    pagerOptions: {
                                        options: {
                                            pageSize: 10,
                                            pageSizeSelect: [10, 50, 100]
                                        }
                                    }//,
                                    //isGlobal: false
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return poolMemberListView;
});

