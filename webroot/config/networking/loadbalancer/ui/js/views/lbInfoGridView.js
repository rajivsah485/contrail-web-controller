/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'config/networking/loadbalancer/ui/js/models/lbInfoModel',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters',
    'config/networking/loadbalancer/ui/js/views/lbInfoEditView'
], function (_, ContrailView, LbInfoModel, LbCfgFormatters, LbInfoEditView) {
    var gridElId = "#" + ctwc.CONFIG_LB_INFO_GRID_ID;
    var lbCfgFormatters = new LbCfgFormatters();
    var lbInfoEditView = new LbInfoEditView();
    var lbInfoGridView = ContrailView.extend({
        el: $(contentContainer),
        render: function () {
            var self = this,
                viewConfig = this.attributes.viewConfig,
                pagerOptions = viewConfig['pagerOptions'];
            self.renderView4Config(self.$el, self.model,
                                   getLbInfoGriewConfig(pagerOptions, viewConfig));
        }
    });

    var getLbInfoGriewConfig = function (pagerOptions, viewConfig) {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_LB_INFO_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_LB_INFO_GRID_ID,
                                view: "GridView",
                                viewConfig: {
                                    elementConfig: getConfiguration(pagerOptions, viewConfig)
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    var getConfiguration = function (pagerOptions, viewConfig) {
        var gridElementConfig = {
            header: {
                title: {
                    text: ""//ctwl.TITLE_FORWARDING_OPTIONS
                },
                defaultControls: {
                    exportable: false
                },
                advanceControls: getHeaderActionConfig(viewConfig),
            },
            body: {
                options: {
                    checkboxSelectable : false,
                    detail: false,
                },
                dataSource: {
                },
                statusMessages: {
                    loading: {
                        text: 'Loading Loadbalancers..'
                    },
                    empty: {
                        text: 'No Loadbalancers Found.'
                    },
                    errorGettingData: {
                        type: 'error',
                        iconClasses: 'fa fa-warning',
                        text: 'Error in getting Loadbalancers.'
                    }
                }
            },
            columnHeader: {
                columns: lbInfoColumns
            },
            footer: false
        };
        return gridElementConfig;
    };

    var lbInfoColumns = [
        {
            id: 'name',
            field: 'name',
            name: 'Load Balancer Details',
            cssClass: 'cell-text-blue',
            sortable: false
        },
        {
            id: 'value',
            field: 'value',
            name: 'Value',
            formatter: lbCfgFormatters.valueFormatter,
            sortable: false
        }
    ];

    function getHeaderActionConfig(viewConfig) {
        var headerActionConfig = [
            {
                "type": "link",
                "title": 'Edit Load Balancer',
                "iconClass": 'fa fa-pencil-square-o',
                "onClick": function() {
                    var ajaxConfig = {
                        url : "/api/tenants/config/lbaas/load-balancer/"+ viewConfig.lbId,
                        type : 'GET'
                    };
                    contrail.ajaxHandler(ajaxConfig, null, function(response) {
                        var lbData = getValueByJsonPath(response,
                            "loadbalancer", {});
                        if(Object.keys(lbData).length > 0){
                            lbInfoModel = new LbInfoModel(lbData);
                            lbInfoEditView.model = lbInfoModel;
                            lbInfoEditView.renderEditInfoLb({
                                          "title": 'Edit Load Balancer Details',
                                          callback: function() {
                                var dataView =
                                    $(gridElId).data("contrailGrid")._dataView;
                                dataView.refreshData();
                            }});
                        }
                    },function(error){
                    });
                }
            }
        ];
        return headerActionConfig;
    }

   return lbInfoGridView;
});

