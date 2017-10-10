/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model'
], function (_, ContrailView, ContrailListModel) {
    var listenerListView = ContrailView.extend({
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
            //pushBreadcrumb([loadBalancer]);
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
                    contrailListModel, getListenerGridViewConfig());
        },

        parseLoadbalancersData : function(response) {
           var listenerList = getValueByJsonPath(response,
                        "loadbalancer;loadbalancer-listener", [], false);
           return listenerList;
        }
    });

    var getListenerGridViewConfig = function () {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_LB_LISTENER_SECTION_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_LB_LISTENER_ID,
                                view: "listenerGridView",
                                viewPathPrefix: "config/networking/loadbalancer/ui/js/views/listener/",
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

    return listenerListView;
});

