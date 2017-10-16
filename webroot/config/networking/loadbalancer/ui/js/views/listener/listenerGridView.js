/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters',
    'config/networking/loadbalancer/ui/js/views/listener/listenerEditView',
    'config/networking/loadbalancer/ui/js/models/listenerModel'
    ],
    function (_, ContrailView, LbCfgFormatters, ListenerEditView, ListenerModel) {
    var lbCfgFormatters = new LbCfgFormatters();
    var listenerEditView = new ListenerEditView();
    var dataView;
    var listenerGridView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this;
            var viewConfig = this.attributes.viewConfig;
            this.renderView4Config(self.$el, self.model,
                                   getListenerGridViewConfig(viewConfig));
        }
    });


    var getListenerGridViewConfig = function (viewConfig) {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_LB_LISTENER_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_LB_LISTENER_GRID_ID,
                                title: ctwc.CONFIG_LB_LISTENER_TITLE,
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

    function onListenerClick(e, dc) {
        var lbId = this.viewConfig.lbId;
        var lbName = this.viewConfig.lbName;
        var listenerRef = this.viewConfig.listenerRef;
        var viewTab = 'config_listener_details';
        var hashP = 'config_load_balancer';
        var hashParams = null,
            hashObj = {
                view: viewTab,
                focusedElement: {
                    listener: dc.name,
                    uuid: lbId,
                    tab: viewTab,
                    lbName: lbName,
                    listenerRef: listenerRef
                }
            };
        if (contrail.checkIfKeyExistInObject(true,
                hashParams,
                'clickedElement')) {
            hashObj.clickedElement =
                hashParams.clickedElement;
        }

        layoutHandler.setURLHashParams(hashObj, {
            p: hashP,
            merge: false,
            triggerHashChange: true
        });
    };

    var getConfiguration = function (viewConfig) {
        var gridElementConfig = {
            header: {
                title: {
                    text: ctwc.CONFIG_LB_LISTENER_TITLE
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
                            $('#listenerDelete').addClass('disabled-link');
                        },
                        onSomethingChecked: function(e){
                            $('#listenerDelete').removeClass('disabled-link');
                        }
                    },
                    actionCell: getRowActionConfig,
                    detail: {
                        noCache: true,
                        template: cowu.generateDetailTemplateHTML(
                                       getListenerDetailsTemplateConfig(),
                                       cowc.APP_CONTRAIL_CONTROLLER)
                    }
                },
                dataSource: {data: []},
                statusMessages: {
                    loading: {
                        text: 'Loading Listeners..'
                    },
                    empty: {
                        text: 'No Listeners Found.'
                    }
                }
            },
            columnHeader: {
                columns: [
                    {
                        id: 'name',
                        field: 'name',
                        name: 'Name',
                        cssClass :'cell-hyperlink-blue',
                        events : {
                            onClick : onListenerClick.bind({viewConfig:viewConfig})
                        }
                    },
                    {
                         field:  'uuid',
                         name:   'Protocol',
                         formatter: lbCfgFormatters.listenerProtocolFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'uuid',
                         name:   'Port',
                         formatter: lbCfgFormatters.listenerPortFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'uuid',
                         name:   'Pool',
                         formatter: lbCfgFormatters.listenerPoolCountFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'uuid',
                         name:   'Admin State',
                         formatter: lbCfgFormatters.listenerAdminStateFormatter,
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
                "linkElementId": "listenerDelete",
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
            }

        ];
        return headerActionConfig;
    }

    function  getRowActionConfig (dc) {
        rowActionConfig = [
            ctwgc.getEditConfig('Edit Listener', function(rowIndex) {
                dataView = $('#' + ctwc.CONFIG_LB_LISTENER_GRID_ID).data("contrailGrid")._dataView;
                listenerEditView.model = new ListenerModel(dataView.getItem(rowIndex));;
                listenerEditView.renderListenerEdit({
                                      "title": 'Edit Listener',
                                      callback: function () {
                                          dataView.refreshData();
                }});
            })
        ];
        rowActionConfig.push(ctwgc.getDeleteConfig('Delete Listener', function(rowIndex) {
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
    
    function getListenerDetailsTemplateConfig() {
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
                                                        formatter: 'listenerProtocol'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Port',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'listenerPort'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Pool',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'listenerPoolCount'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Admin State',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'listenerAdminState'
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

    this.listenerProtocol = function (v, dc) {
        return lbCfgFormatters.listenerProtocolFormatter(null,
                                        null, null, null, dc);
    };

    this.listenerPort = function (v, dc){
        return lbCfgFormatters.listenerPortFormatter(null,
                null, null, null, dc);
    };

    this.listenerPoolCount = function (v, dc) {
        return lbCfgFormatters.listenerPoolCountFormatter(null,
                                        null, null, null, dc);
    };

    this.listenerAdminState = function (v, dc){
        return lbCfgFormatters.listenerAdminStateFormatter(null,
                null, null, null, dc);
    };

    return listenerGridView;
});
