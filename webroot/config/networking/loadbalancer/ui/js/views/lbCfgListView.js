/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters'
], function (_, ContrailView, ContrailListModel, LbCfgFormatters) {
    var lbCfgFormatter = new LbCfgFormatters();
    var lbCfgListView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this, viewConfig = this.attributes.viewConfig;
            var currentProject = viewConfig["projectSelectedValueData"];
            var listModelConfig = {
                    remote: {
                        ajaxConfig: {
                            url: '/api/tenants/config/lbaas/load-balancers-details?tenant_id=' + currentProject.value ,
                            type: "GET"
                        },
                        dataParser: self.parseLoadbalancersData,
                    }
                };
                var contrailListModel = new ContrailListModel(listModelConfig);
                self.renderView4Config(self.$el,
                        contrailListModel, getLbCfgListViewConfig(viewConfig));
        },
        parseLoadbalancersData : function(response){
             var lbList = getValueByJsonPath(response, "loadbalancers", []);
             return lbList;
        }
    });
    var getLbCfgListViewConfig = function (viewConfig) {
        return {
            elementId: cowu.formatElementId([ctwl.CFG_LB_LIST_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwl.CFG_LB_LIST_ID,
                                title: ctwl.CFG_LB_TITLE,
                                view: "lbCfgGridView",
                                viewPathPrefix:
                                    "config/networking/loadbalancer/ui/js/views/",
                                app: cowc.APP_CONTRAIL_CONTROLLER,
                                viewConfig: {
                                    selectedProjId:
                                      viewConfig.projectSelectedValueData.value
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return lbCfgListView;
});
