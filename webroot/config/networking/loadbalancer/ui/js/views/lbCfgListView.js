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
            var options = {
                            type:'loadbalancers',
                            fields: ['loadbalancer_listener_back_refs'],
                            parentId: currentProject.value
                          };
           
            var listModelConfig = {
                    remote: {
                        ajaxConfig: {
                            url: '/api/tenants/config/lbaas/load-balancers-details',//ctwc.URL_GET_CONFIG_DETAILS,
                            type: "GET"//,
                            //data: lbCfgFormatter.setPostUrlData(options)
                        },
                        dataParser: self.parseLoadbalancersData,
                    }
                };
                var contrailListModel = new ContrailListModel(listModelConfig);
                this.renderView4Config(this.$el,
                       contrailListModel, getLbCfgListViewConfig(viewConfig));
        },
        parseLoadbalancersData : function(response){
            //var dataItems = [],
               var lbList = getValueByJsonPath(response, "loadbalancers", []);
               /* _.each(tagData, function(val){
                        if("loadbalancer" in val) {
                            dataItems.push(val["loadbalancer"]);
                        }
                }); */
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
