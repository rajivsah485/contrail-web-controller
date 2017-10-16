/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'config/networking/loadbalancer/ui/js/models/listenerInfoModel',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters',
    'config/networking/loadbalancer/ui/js/views/listener/listenerInfoEditView'
], function (_, ContrailView, ListenerInfoModel, LbCfgFormatters, ListenerInfoEditView) {
    var gridElId = "#" + ctwc.CONFIG_LISTENER_INFO_GRID_ID;
    var lbCfgFormatters = new LbCfgFormatters();
    var listenerInfoEditView = new ListenerInfoEditView();
    var listenerInfoGridView = ContrailView.extend({
        el: $(contentContainer),
        render: function () {
            var self = this,
                viewConfig = this.attributes.viewConfig,
                pagerOptions = viewConfig['pagerOptions'];
            self.renderView4Config(self.$el, self.model,
                                   getListenerInfoGriewConfig(pagerOptions, viewConfig));
        }
    });

    var getListenerInfoGriewConfig = function (pagerOptions, viewConfig) {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_LISTENER_INFO_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_LISTENER_INFO_GRID_ID,
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
                        text: 'Loading Listeners..'
                    },
                    empty: {
                        text: 'No Listeners Found.'
                    },
                    errorGettingData: {
                        type: 'error',
                        iconClasses: 'fa fa-warning',
                        text: 'Error in getting Listeners.'
                    }
                }
            },
            columnHeader: {
                columns: listenerInfoColumns
            },
            footer: false
        };
        return gridElementConfig;
    };

    var listenerInfoColumns = [
        {
            id: 'name',
            field: 'name',
            name: 'Listener Details',
            cssClass: 'cell-text-blue',
            sortable: false
        },
        {
            id: 'value',
            field: 'value',
            name: 'Value',
            formatter: lbCfgFormatters.listenerValueFormatter,
            sortable: false
        }
    ];

    function getHeaderActionConfig(viewConfig) {
        var headerActionConfig = [
            {
                "type": "link",
                "title": 'Edit Listener',
                "iconClass": 'fa fa-pencil-square-o',
                "onClick": function() {
                    var ajaxConfig = {
                        url : "/api/tenants/config/lbaas/load-balancer/"+ viewConfig.lbId,
                        type : 'GET'
                    };
                    contrail.ajaxHandler(ajaxConfig, null, function(response) {
                        var listenerData = getValueByJsonPath(response,
                            "loadbalancer;loadbalancer-listener;0", {});
                        if(Object.keys(listenerData).length > 0){
                            listenerModel = new ListenerInfoModel(listenerData);
                            listenerInfoEditView.model = listenerModel;
                            listenerInfoEditView.renderEditListenerInfo({
                                          "title": 'Edit Listener Details',
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

   return listenerInfoGridView;
});

