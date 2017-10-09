/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters'
    ],
    function (_, ContrailView, LbCfgFormatters) {
    var lbCfgFormatters = new LbCfgFormatters();
    var dataView;
    var poolGridView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this;
            var viewConfig = this.attributes.viewConfig;
            this.renderView4Config(self.$el, self.model,
                                   getPoolGridViewConfig(viewConfig));
        }
    });


    var getPoolGridViewConfig = function (viewConfig) {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_LB_POOL_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_LB_POOL_GRID_ID,
                                title: ctwc.CONFIG_LB_POOL_TITLE,
                                view: "GridView",
                                viewConfig: {
                                    elementConfig: getConfiguration(viewConfig)
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };


    var getConfiguration = function (viewConfig) {
        var gridElementConfig = {
            header: {
                title: {
                    text: ctwc.CONFIG_LB_POOL_TITLE
                },
                defaultControls: {
                    //columnPickable:true
                 },
                advanceControls: getHeaderActionConfig(),
            },
            body: {
                options: {
                    autoRefresh: false,
                    disableRowsOnLoading:true,
                    checkboxSelectable: {
                        onNothingChecked: function(e){
                            $('#poolDelete').addClass('disabled-link');
                        },
                        onSomethingChecked: function(e){
                            $('#poolDelete').removeClass('disabled-link');
                        }
                    },
                    actionCell: getRowActionConfig,
                    detail: {
                        noCache: true,
                        template: cowu.generateDetailTemplateHTML(
                                       getPoolDetailsTemplateConfig(),
                                       cowc.APP_CONTRAIL_CONTROLLER)
                    }
                },
                dataSource: {data: []},
                statusMessages: {
                    loading: {
                        text: 'Loading Pools..'
                    },
                    empty: {
                        text: 'No Pools Found.'
                    }
                }
            },
            columnHeader: {
                columns: [
                    {
                        id: 'name',
                        field: 'name',
                        name: 'Name',
                    },
                    {
                         field:  'uuid',
                         name:   'Protocol',
                         formatter: lbCfgFormatters.poolProtocolFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'uuid',
                         name:   'Loadbalancer Method',
                         formatter: lbCfgFormatters.poolLbMethodFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'uuid',
                         name:   'Pool Members',
                         formatter: lbCfgFormatters.poolMemberCountFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'uuid',
                         name:   'Admin State',
                         formatter: lbCfgFormatters.poolAdminStateFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     }
                ]
            },
        };
        return gridElementConfig
    };
    
    function getHeaderActionConfig() {
        var headerActionConfig = [
            {
                "type": "link",
                "title": ctwl.CFG_LB_TITLE_DELETE,
                "iconClass": "fa fa-trash",
                "linkElementId": "poolDelete",
                "onClick": function () {
                    /*var gridElId = '#' + ctwl.CFG_VN_GRID_ID;
                    var checkedRows = $(gridElId).data("contrailGrid").getCheckedRows();

                    vnCfgEditView.model = new VNCfgModel();
                    vnCfgEditView.renderMultiDeleteVNCfg({"title":
                                                            ctwl.CFG_VN_TITLE_MULTI_DELETE,
                                                            checkedRows: checkedRows,
                                                            callback: function () {
                        $(gridElId).data("contrailGrid")._dataView.refreshData();
                    }});*/
                }
            },
            {
                "type": "link",
                "title": ctwl.CFG_LB_TITLE_CREATE,
                "iconClass": "fa fa-plus",
                "onClick": function () {
                   /* var lbodel = new LbCfgModel();
                    lbCfgEditView.model = lbodel;
                    lbCfgEditView.renderAddLb({
                                              "title": 'Create Loadbalancer',
                                              callback: function () {
                    $('#' + ctwl.CFG_LB_GRID_ID).data("contrailGrid")._dataView.refreshData();
                    }});*/
                }
            }

        ];
        return headerActionConfig;
    }

    function  getRowActionConfig (dc) {
        rowActionConfig = [
            ctwgc.getEditConfig('Edit', function(rowIndex) {
                /*dataView = $('#' + ctwl.CFG_VN_GRID_ID).data("contrailGrid")._dataView;
                var vnModel = new VNCfgModel(dataView.getItem(rowIndex));
                vnCfgEditView.model = vnModel;
                subscribeModelChangeEvents(vnModel);
                vnCfgEditView.renderEditVNCfg({
                                      "title": ctwl.EDIT,
                                      callback: function () {
                                          dataView.refreshData();
                }});*/
            })
        ];
        rowActionConfig.push(ctwgc.getDeleteConfig('Delete', function(rowIndex) {
                /*dataView = $('#' + ctwl.CFG_VN_GRID_ID).data("contrailGrid")._dataView;
                vnCfgEditView.model = new VNCfgModel();
                vnCfgEditView.renderMultiDeleteVNCfg({
                                      "title": ctwl.CFG_VN_TITLE_DELETE,
                                      checkedRows: [dataView.getItem(rowIndex)],
                                      callback: function () {
                                          dataView.refreshData();
                }});*/
            }));
        return rowActionConfig;
    };
    
    function getPoolDetailsTemplateConfig() {
        return {
            templateGenerator: 'RowSectionTemplateGenerator',
            templateGeneratorConfig: {
                rows: [
                    {
                        //Change  once the AJAX call is corrected
                        templateGenerator: 'ColumnSectionTemplateGenerator',
                        templateGeneratorConfig: {
                            columns: [
                                {
                                    class: 'col-xs-12',
                                    rows: [
                                          {
                                            title: ctwl.CFG_VN_TITLE_DETAILS,
                                            templateGenerator: 'BlockListTemplateGenerator',
                                            templateGeneratorConfig: [
                                                {
                                                    key: 'name',
                                                    label: 'Name',
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    key: 'display_name',
                                                    label: 'Display Name',
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    key: 'uuid',
                                                    label: 'UUID',
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Protocol',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'poolProtocol'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Load Balancer Method',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'loadBalancerMethod'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Pools',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'poolMemberCount'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Admin State',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'poolAdminState'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                }
                                            ]
                                        },
                                        ctwu.getRBACPermissionExpandDetails('col-xs-3')
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        };
    };

    this.poolProtocol = function (v, dc) {
        return lbCfgFormatters.poolProtocolFormatter(null,
                                        null, null, null, dc);
    };

    this.loadBalancerMethod = function (v, dc){
        return lbCfgFormatters.poolLbMethodFormatter(null,
                null, null, null, dc);
    };

    this.poolMemberCount = function (v, dc) {
        return lbCfgFormatters.poolMemberCountFormatter(null,
                                        null, null, null, dc);
    };

    this.poolAdminState = function (v, dc){
        return lbCfgFormatters.poolAdminStateFormatter(null,
                null, null, null, dc);
    };

    return poolGridView;
});
