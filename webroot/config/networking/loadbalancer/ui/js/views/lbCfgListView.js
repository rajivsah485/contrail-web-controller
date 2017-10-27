/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters'
], function (_, ContrailView, ContrailListModel, LbCfgFormatters) {
    //var self;
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
                            url: '/api/tenants/config/lbaas/load-balancers-details?tenant_id=' + currentProject.value ,//ctwc.URL_GET_CONFIG_DETAILS,
                            type: "GET"//,
                            //data: lbCfgFormatter.setPostUrlData(options)
                        },
                        dataParser: self.parseLoadbalancersData,
                    }
                };
                var contrailListModel = new ContrailListModel(listModelConfig);
                var getAjaxs = [];
                getAjaxs[0] = $.ajax({
                    url: ctwc.get(ctwc.URL_GET_PORT_UUID, currentProject.value),
                    type:"GET"
                });
                $.when.apply($, getAjaxs).then(
                        function () {
                            var results = arguments;
                            self.renderView4Config(self.$el,
                                   contrailListModel, getLbCfgListViewConfig(viewConfig, results[0]));     
                });
                
        },
        parseLoadbalancersData : function(response){
             var lbList = getValueByJsonPath(response, "loadbalancers", []), listnerList = [], portList = [];
             /*_.each(lbList, function(obj) {
                 listnerList = listnerList.concat(obj['loadbalancer']['loadbalancer-listener']);
             });
             _.each(listnerList, function(obj) {
                 portList.push(obj['loadbalancer_listener_properties']['protocol_port']);
             });
             self.listener.port = portList;*/
             return lbList;
        }
    });
    var getLbCfgListViewConfig = function (viewConfig, vmiList) {
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
                                      viewConfig.projectSelectedValueData.value,
                                      vmiList: vmiList
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
