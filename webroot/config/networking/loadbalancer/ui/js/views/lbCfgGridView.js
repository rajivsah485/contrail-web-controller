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
                                   getLBCfgGridViewConfig(viewConfig));
        }
    });


    var getLBCfgGridViewConfig = function (viewConfig) {
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
                    text: ctwl.CFG_LB_TITLE
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
                         field:  'loadbalancer',
                         name:   'Name',
                         formatter: lbCfgFormatters.nameFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         },
                         cssClass :'cell-hyperlink-blue',
                         events : {
                             onClick : onLoadBalancerClick.bind({viewConfig:viewConfig})
                         }
                     },
                     {
                         field:  'loadbalancer',
                         name:   'Description',
                         formatter: lbCfgFormatters.descriptionFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'loadbalancer',
                         name:   'Subnet',
                         formatter: lbCfgFormatters.subnetFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'loadbalancer',
                         name:   'Fixed IPs',
                         formatter: lbCfgFormatters.ipAddressFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'loadbalancer',
                         name:   'Floating IPs',
                         formatter: lbCfgFormatters.floatingIpFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'loadbalancer',
                         name:   'Listeners',
                         formatter: lbCfgFormatters.listenersCountFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:"loadbalancer",
                         name:"Operating Status",
                         sortable: {
                            sortBy: 'formattedValue'
                         },
                         formatter: lbCfgFormatters.operatingStatusFormatter
                     },
                     {
                         field:  'loadbalancer',
                         name:   'Provisioning Status',
                         formatter: lbCfgFormatters.provisioningStatusFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     },
                     {
                         field:  'loadbalancer',
                         name:   'Admin State',
                         formatter: lbCfgFormatters.adminStatusFormatter,
                         sortable: {
                            sortBy: 'formattedValue'
                         }
                     }
                ]
            },
        };
        return gridElementConfig
    };
    
    function onLoadBalancerClick(e, dc) {
        var isGlobal = this.viewConfig.isGlobal;
        var viewTab = 'config_loadbalancer_details';
        var hashP = 'config_load_balancer';
        var hashParams = null,
            hashObj = {
                view: viewTab,
                focusedElement: {
                    loadBalancer: dc.loadbalancer.name,
                    uuid: dc.uuid,
                    tab: viewTab
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

    function getHeaderActionConfig() {
        var headerActionConfig = [
            {
                "type": "link",
                "title": ctwl.CFG_LB_TITLE_DELETE,
                "iconClass": "fa fa-trash",
                "linkElementId": "linkLBDelete",
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
        rowActionConfig.push(ctwgc.getEditConfig('Associate Floating IP', function(rowIndex) {
            /*dataView = $('#' + ctwl.CFG_VN_GRID_ID).data("contrailGrid")._dataView;
            vnCfgEditView.model = new VNCfgModel();
            vnCfgEditView.renderMultiDeleteVNCfg({
                                  "title": ctwl.CFG_VN_TITLE_DELETE,
                                  checkedRows: [dataView.getItem(rowIndex)],
                                  callback: function () {
                                      dataView.refreshData();
            }});*/
        }));
        rowActionConfig.push(ctwgc.getDeleteConfig('Delete Loadbalancer', function(rowIndex) {
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
    }

    function getSubnetExpandDetailsTmpl() {
        return {
            title: "Subnets",
            templateGenerator: 'BlockListTemplateGenerator',
            templateGeneratorConfig: [
                {
                    label: 'Subnet(s)',
                    key: 'uuid',
                    templateGenerator: 'TextGenerator',
                    templateGeneratorConfig: {
                        formatter: 'subnetTmplFormatterList'
                    },
                    keyClass:'col-xs-3',
                    valueClass:'col-xs-9'
                }
            ]
        }
    };

    function getListenersExpandDetailsTmpl() {
        return {
            title: "Listeners",
            templateGenerator: 'BlockListTemplateGenerator',
            templateGeneratorConfig: [
                {
                    label: 'Listener(s)',
                    key: 'uuid',
                    templateGenerator: 'TextGenerator',
                    templateGeneratorConfig: {
                        formatter: 'listenersFormatterList'
                    },
                    keyClass:'col-xs-3',
                    valueClass:'col-xs-9'
                }
            ]
        }
    };

    function getRBACPermissionExpandDetails(keyClass) {
        return {
            title: "Permissions",
            templateGenerator: 'BlockListTemplateGenerator',
            templateGeneratorConfig: [
                {
                    label: 'Owner',
                    key: 'loadbalancer',
                    keyClass: keyClass,
                    templateGenerator: 'TextGenerator',
                    templateGeneratorConfig: {
                        formatter: 'lbOwnerFormatter',
                    }
                },
                {
                    label: 'Owner Permissions',
                    key: 'loadbalancer',
                    keyClass: keyClass,
                    templateGenerator: 'TextGenerator',
                    templateGeneratorConfig: {
                        formatter: 'lbOwnerPermissionFormatter',
                    }
                },
                {
                    label: 'Global Permissions',
                    key: 'loadbalancer',
                    keyClass: keyClass,
                    templateGenerator: 'TextGenerator',
                    templateGeneratorConfig: {
                        formatter: 'lbGlobalPermissionFormatter',
                    }
                },
                {
                    label: 'Shared List',
                    key: 'loadbalancer',
                    keyClass: keyClass,
                    templateGenerator: 'TextGenerator',
                    templateGeneratorConfig: {
                        formatter: 'lbSharedPermissionFormatter'
                    }
                }
            ]
        }
    };
    
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
                                    class: 'col-xs-12',
                                    rows: [
                                          getSubnetExpandDetailsTmpl(),
                                          {
                                            title: ctwl.CFG_VN_TITLE_DETAILS,
                                            templateGenerator: 'BlockListTemplateGenerator',
                                            templateGeneratorConfig: [
                                                {
                                                    label: 'Name',
                                                    key: 'loadbalancer',
                                                    templateGeneratorConfig: {
                                                        formatter: 'loadbalancerName'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Display Name',
                                                    key: 'loadbalancer',
                                                    templateGeneratorConfig: {
                                                        formatter: 'loadbalancerDisplayName'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    key: 'uuid',
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Loadbalancer Provider',
                                                    key: 'loadbalancer',
                                                    templateGeneratorConfig: {
                                                        formatter: 'loadbalancerProvider'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Operating Status',
                                                    key: 'loadbalancer',
                                                    templateGeneratorConfig: {
                                                        formatter: 'operatingStatus'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Provisioning Status',
                                                    key: 'loadbalancer',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'provisioningStatus'
                                                    },
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Fixed IPs',
                                                    key: 'loadbalancer',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'ipAddress'
                                                    },
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Floating IPs',
                                                    key: 'loadbalancer',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'floatingIps'
                                                    },
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Listeners',
                                                    key: 'loadbalancer',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'listenersCount'
                                                    },
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                },
                                                {
                                                    label: 'Description',
                                                    key: 'loadbalancer',
                                                    templateGeneratorConfig: {
                                                        formatter: 'idPermsDescription'
                                                    },
                                                    templateGenerator: 'TextGenerator',
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9'
                                                }
                                            ]
                                        },getListenersExpandDetailsTmpl(),
                                        //permissions
                                        getRBACPermissionExpandDetails('col-xs-3')
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
    };

    this.idPermsDescription = function (v, dc){
        return lbCfgFormatters.descriptionFormatter(null,
                null, null, null, dc);
    };

    this.provisioningStatus = function (v, dc) {
        return lbCfgFormatters.provisioningStatusFormatter(null,
                                        null, null, null, dc);
    };

    this.ipAddress = function (v, dc){
        return lbCfgFormatters.ipAddressFormatter(null,
                null, null, null, dc);
    };

    this.floatingIps = function(v, dc){
        return lbCfgFormatters.floatingIpFormatter(null,
                null, null, null, dc);
    };

    this.listenersCount = function (v, dc){
        return lbCfgFormatters.listenersCountFormatter(null,
                null, null, null, dc);
    };

    this.loadbalancerProvider = function(v, dc){
        return lbCfgFormatters.loadbalancerProviderFormatter(null,
                null, null, null, dc);
    };
    
    this.loadbalancerName = function(v, dc){
        return lbCfgFormatters.nameFormatter(null,
                null, null, null, dc);
    };
    
    this.loadbalancerDisplayName = function(v, dc){
        return lbCfgFormatters.displayNameFormatter(null,
                null, null, null, dc);
    };
    
    this.subnetTmplFormatterList = function (v, dc) {
        return lbCfgFormatters.subnetTmplFormatterList(null,
                                        null, null, null, dc);
    };
    
    this.listenersFormatterList = function(v, dc){
        return lbCfgFormatters.listenersFormatterList(null,
                null, null, null, dc);
    };
    
    this.lbOwnerPermissionFormatter = function(v, dc){
        return lbCfgFormatters.lbOwnerPermissionFormatter(null,
                null, null, null, dc);
    };
    
    this.lbGlobalPermissionFormatter = function(v, dc){
        return lbCfgFormatters.lbGlobalPermissionFormatter(null,
                null, null, null, dc);
    };
    
    this.lbOwnerFormatter = function(v, dc){
        return lbCfgFormatters.lbOwnerFormatter(null,
                null, null, null, dc);
    };
    
    this.lbSharedPermissionFormatter = function(v, dc){
        return lbCfgFormatters.lbSharedPermissionFormatter(null,
                null, null, null, dc);
    }
    return lbCfgGridView;
});
