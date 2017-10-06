/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters',
    'config/networking/loadbalancer/ui/js/views/lbCfgEditView',
    'config/networking/loadbalancer/ui/js/models/lbCfgModel',
    ],
    function (_, ContrailView, LbCfgFormatters, LbCfgEditView, LbCfgModel) {
    var lbCfgFormatters = new LbCfgFormatters();
    var dataView;

    var lbCfgEditView = new LbCfgEditView();

    var lbCfgGridView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this;
            var viewConfig = this.attributes.viewConfig;
            this.renderView4Config(self.$el, self.model,
                                   getLBCfgGridViewConfig());
        }
    });


    var getLBCfgGridViewConfig = function () {
        return {
            elementId: cowu.formatElementId([ctwl.CFG_LB_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwl.CFG_LB_GRID_ID,
                                title: ctwl.CFG_LB_TITLE,
                                view: "GridView",
                                viewConfig: {
                                    elementConfig: getConfiguration()
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };


    var getConfiguration = function () {
        var gridElementConfig = {
            header: {
                title: {
                    text: ctwl.CFG_LB_TITLE
                },
                advanceControls: getHeaderActionConfig(),
            },
            body: {
                options: {
                    autoRefresh: false,
                    disableRowsOnLoading:true,
                    checkboxSelectable: {
                        onNothingChecked: function(e){
                            $('#linkLBDelete').addClass('disabled-link');
                        },
                        onSomethingChecked: function(e){
                            $('#linkLBDelete').removeClass('disabled-link');
                        }
                    },
                    actionCell: getRowActionConfig,
                    detail: {
                        noCache: true,
                        template: cowu.generateDetailTemplateHTML(
                                       getLbCfgDetailsTemplateConfig(),
                                       cowc.APP_CONTRAIL_CONTROLLER)
                    }
                },
                dataSource: {data: []},
                statusMessages: {
                    loading: {
                        text: 'Loading Loadbalancers..'
                    },
                    empty: {
                        text: 'No Loadbalancers Found.'
                    }
                }
            },
            columnHeader: {
                columns: [
                     {
                         field:  'display_name',
                         name:   'Name',
                         id: 'display_name'
                     },
                     {
                         field:  'id_perms',
                         name:   'Description',
                         formatter: lbCfgFormatters.descriptionFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         },
                     },
                     {
                         field:"loadbalancer_properties",
                         name:"Operating Status",
                         sortable: {
                            sortBy: 'formattedValue'
                         },
                         formatter: lbCfgFormatters.operatingStatusFormatter
                     },
                     {
                         field:  'loadbalancer_properties',
                         name:   'Provisioning Status',
                         formatter: lbCfgFormatters.provisioningStatusFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         },
                     },
                     {
                         field:  'loadbalancer_properties',
                         name:   'IP Address',
                         formatter: lbCfgFormatters.ipAddressFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         },
                     },
                     {
                         field:  'loadbalancer_properties',
                         name:   'Listeners',
                         formatter: lbCfgFormatters.listenersCountFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         },
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
                "linkElementId": "linkLBDelete",
                "onClick": function () {
                    var gridElId = '#' + ctwl.CFG_VN_GRID_ID;
                    var checkedRows = $(gridElId).data("contrailGrid").getCheckedRows();

                    vnCfgEditView.model = new VNCfgModel();
                    vnCfgEditView.renderMultiDeleteVNCfg({"title":
                                                            ctwl.CFG_VN_TITLE_MULTI_DELETE,
                                                            checkedRows: checkedRows,
                                                            callback: function () {
                        $(gridElId).data("contrailGrid")._dataView.refreshData();
                    }});
                }
            },
            {
                "type": "link",
                "title": ctwl.CFG_LB_TITLE_CREATE,
                "iconClass": "fa fa-plus",
                "onClick": function () {
                    var lbodel = new LbCfgModel();
                    lbCfgEditView.model = lbodel;
                    lbCfgEditView.renderAddLb({
                                              "title": 'Create Loadbalancer',
                                              callback: function () {
                    $('#' + ctwl.CFG_LB_GRID_ID).data("contrailGrid")._dataView.refreshData();
                    }});
                }
            }

        ];
        return headerActionConfig;
    }

    function  getRowActionConfig (dc) {
        rowActionConfig = [
            ctwgc.getEditConfig('Edit Loadbalancer', function(rowIndex) {
                dataView = $('#' + ctwl.CFG_VN_GRID_ID).data("contrailGrid")._dataView;
                var vnModel = new VNCfgModel(dataView.getItem(rowIndex));
                vnCfgEditView.model = vnModel;
                subscribeModelChangeEvents(vnModel);
                vnCfgEditView.renderEditVNCfg({
                                      "title": ctwl.EDIT,
                                      callback: function () {
                                          dataView.refreshData();
                }});
            })
        ];
        rowActionConfig.push(ctwgc.getEditConfig('Associate Floating IP', function(rowIndex) {
            dataView = $('#' + ctwl.CFG_VN_GRID_ID).data("contrailGrid")._dataView;
            vnCfgEditView.model = new VNCfgModel();
            vnCfgEditView.renderMultiDeleteVNCfg({
                                  "title": ctwl.CFG_VN_TITLE_DELETE,
                                  checkedRows: [dataView.getItem(rowIndex)],
                                  callback: function () {
                                      dataView.refreshData();
            }});
        }));
        rowActionConfig.push(ctwgc.getDeleteConfig('Delete Loadbalancer', function(rowIndex) {
                dataView = $('#' + ctwl.CFG_VN_GRID_ID).data("contrailGrid")._dataView;
                vnCfgEditView.model = new VNCfgModel();
                vnCfgEditView.renderMultiDeleteVNCfg({
                                      "title": ctwl.CFG_VN_TITLE_DELETE,
                                      checkedRows: [dataView.getItem(rowIndex)],
                                      callback: function () {
                                          dataView.refreshData();
                }});
            }));
        return rowActionConfig;
    }

    function getLbCfgDetailsTemplateConfig() {
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
                                    class: 'col-xs-6',
                                    rows: [{
                                            title: ctwl.CFG_VN_TITLE_DETAILS,
                                            templateGenerator: 'BlockListTemplateGenerator',
                                            templateGeneratorConfig: [
                                                {
                                                    label: 'Name',
                                                    key: 'name',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    label: 'Display Name',
                                                    key: 'display_name',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    key: 'uuid',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    label: 'Loadbalancer Provider',
                                                    key: 'loadbalancer_provider',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    label: 'Operating Status',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'operatingStatus'
                                                    },
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    label: 'Provisioning Status',
                                                    key: 'uuid',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'provisioningStatus'
                                                    }
                                                },
                                                {
                                                    label: 'IP Address',
                                                    key: 'uuid',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'ipAddress'
                                                    }
                                                },
                                                {
                                                    label: 'Listeners',
                                                    key: 'uuid',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'listenersCount'
                                                    }
                                                },
                                                {
                                                    label: 'Description',
                                                    key: 'uuid',
                                                    templateGeneratorConfig: {
                                                        formatter: 'idPermsDescription'
                                                    },
                                                    templateGenerator: 'TextGenerator'
                                                }
                                            ]
                                        },
                                        //permissions
                                        ctwu.getRBACPermissionExpandDetails()
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        };
    };

    this.operatingStatus = function (v, dc) {
        return lbCfgFormatters.operatingStatusFormatter(null,
                                        null, null, null, dc);
    }

    this.idPermsDescription = function (v, dc){
        return lbCfgFormatters.descriptionFormatter(null,
                null, null, null, dc);
    }

    this.provisioningStatus = function (v, dc) {
        return lbCfgFormatters.provisioningStatusFormatter(null,
                                        null, null, null, dc);
    }

    this.ipAddress = function (v, dc){
        return lbCfgFormatters.ipAddressFormatter(null,
                null, null, null, dc);
    }

    this.listenersCount = function (v, dc){
        return lbCfgFormatters.listenersCountFormatter(null,
                null, null, null, dc);
    }

    return lbCfgGridView;
});
