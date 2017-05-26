/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'config/firewall/common/fwpolicy/ui/js/fwRuleFormatter'
], function(_, ContrailView, FWRuleFormatter) {
    var self, gridElId = '#' + ctwc.FW_RULE_GRID_ID, gridObj,
      fwRuleFormatter = new FWRuleFormatter();
    var fwRuleGridView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            self = this;
            var viewConfig = self.attributes.viewConfig,
                pagerOptions = viewConfig['pagerOptions'];
            self.renderView4Config(self.$el, self.model,
                getFWRuleGridViewConfig(viewConfig));
        }
    });


    function getFWRuleGridViewConfig (viewConfig) {
        return {
            elementId:
                cowu.formatElementId(
                [ctwc.CONFIG_FW_RULE_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.FW_RULE_GRID_ID,
                                view: "GridView",
                                viewConfig: {
                                    elementConfig:
                                        getConfiguration(viewConfig)
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    function getConfiguration (viewConfig) {
        var gridElementConfig = {
            header: {
                title: {
                    text: ctwl.TITLE_FW_RULE
                },
               advanceControls: []//getHeaderActionConfig(viewConfig)
            },
            body: {
                options: {
                    checkboxSelectable: {
                        onNothingChecked: function(e){
                            $('#btnDeleteFWRule').addClass('disabled-link');
                        },
                        onSomethingChecked: function(e){
                            $('#btnDeleteFWRule').
                                removeClass('disabled-link');
                        }
                    },
                    actionCell: [],//getRowActionConfig(viewConfig),
                    detail: {
                        template:
                            cowu.generateDetailTemplateHTML(
                                    getFWRuleExpDetailsTemplateConfig(),
                            cowc.APP_CONTRAIL_CONTROLLER)
                    }
                },
                dataSource: {
                },
                statusMessages: {
                    loading: {
                        text: 'Loading Firewall Rules..'
                    },
                    empty: {
                        text: 'No Firewall Rule Found.'
                    }
                }
            },
            columnHeader: { columns: fwRuleColumns}
        };
        return gridElementConfig;
    };

    var fwRuleColumns = [{
                              id: 'action_list.simple_action',
                              field: 'action_list.simple_action',
                              name: 'Action',
                              formatter: fwRuleFormatter.actionFormatter
                           }, {
                               id: 'service',
                               field: 'service',
                               name: 'Service (Portocol:Port)',
                               formatter: fwRuleFormatter.serviceFormatter
                           }, {
                               id: 'endpoint_1',
                               field: 'endpoint_1',
                               name: 'End Point 1',
                               formatter: fwRuleFormatter.endPoint1Formatter
                           }, {
                               id: 'direction',
                               field: 'direction',
                               name: 'Dir',
                               formatter: fwRuleFormatter.dirFormatter
                           }, {
                               id: 'endpoint_2',
                               field: 'endpoint_2',
                               name: 'End Point 2',
                               formatter: fwRuleFormatter.endPoint2Formatter
                           }, {
                               id: 'match_tags',
                               field: 'match_tags',
                               name: 'Match',
                               formatter: fwRuleFormatter.matchFormatter
                           }, {
                               id: 'action_list.apply_service',
                               field: 'action_list.apply_service',
                               name: 'Simple Actions',
                               formatter: fwRuleFormatter.simpleActionFormatter
                           }];


    function getFWRuleExpDetailsTemplateConfig() {
        return {
            templateGenerator: 'RowSectionTemplateGenerator',
            templateGeneratorConfig: {
                rows: [{
                    templateGenerator: 'ColumnSectionTemplateGenerator',
                    templateGeneratorConfig: {
                        columns: [{
                            class: 'col-xs-12',
                            rows: [{
                                keyClass:'col-xs-3',
                                valueClass:'col-xs-9',
                                title: 'Details',
                                templateGenerator: 'BlockListTemplateGenerator',
                                templateGeneratorConfig: [{
                                    key: 'name',
                                    templateGenerator: 'TextGenerator',
                                    label: 'Rule Name'
                                },{
                                    keyClass:'col-xs-3',
                                    valueClass:'col-xs-9',
                                    key: 'display_name',
                                    templateGenerator: 'TextGenerator',
                                    label: 'Rule Display Name'
                                },{
                                    keyClass:'col-xs-3',
                                    valueClass:'col-xs-9',
                                    key: "uuid",
                                    templateGenerator: "TextGenerator",
                                    label: "UUID"
                                },{
                                    keyClass:'col-xs-3',
                                    valueClass:'col-xs-9',
                                    key: "action_list.simple_action",
                                    templateGenerator: "TextGenerator",
                                    label: "Action",
                                    templateGeneratorConfig: {
                                        formatter: "actionFormatter"
                                    }
                                },{
                                    keyClass:'col-xs-3',
                                    valueClass:'col-xs-9',
                                    key: "service",
                                    templateGenerator: "TextGenerator",
                                    label: "Service (Portocol:Port)",
                                    templateGeneratorConfig: {
                                        formatter: "serviceFormatter"
                                    }
                                },{
                                    keyClass:'col-xs-3',
                                    valueClass:'col-xs-9',
                                    key: "endpoint_1",
                                    templateGenerator: "TextGenerator",
                                    label: "End Point 1",
                                    templateGeneratorConfig: {
                                        formatter: "endPoint1Formatter"
                                    }
                                },{
                                    keyClass:'col-xs-3',
                                    valueClass:'col-xs-9',
                                    key: "direction",
                                    templateGenerator: "TextGenerator",
                                    label: "Dir"
                                },{
                                    key: "endpoint_2",
                                    templateGenerator: "TextGenerator",
                                    label: "End Point 2",
                                    templateGeneratorConfig: {
                                        formatter: "endPoint2Formatter"
                                    }
                                },{
                                    key: "match_tags",
                                    templateGenerator: "TextGenerator",
                                    label: "Match",
                                    templateGeneratorConfig: {
                                        formatter: "matchFormatter"
                                    }
                                },{
                                    key: "action_list.apply_service",
                                    templateGenerator: "TextGenerator",
                                    label: "Simple Actions",
                                    templateGeneratorConfig: {
                                        formatter: "simpleActionFormatter"
                                    }
                                }]
                           }]
                      }]
                    }
                }]
            }
        };
    };

    this.actionFormatter = function(v, dc) {
        return fwRuleFormatter.actionFormatter("", "", v, "", dc);
    };

    this.serviceFormatter = function(v, dc) {
        return fwRuleFormatter.serviceFormatter("", "", v, "", dc);
    };
    
    this.dirFormatter = function(v, dc) {
        return fwRuleFormatter.dirFormatter("", "", v, "", dc);
    };    

    this.endPoint1Formatter = function(v, dc) {
        return fwRuleFormatter.endPoint1Formatter("", "", v, "", dc);
    };

    this.endPoint2Formatter = function(v, dc) {
        return fwRuleFormatter.endPoint2Formatter("", "", v, "", dc);
    };

    this.matchFormatter = function(v, dc) {
        return fwRuleFormatter.matchFormatter("", "", v, "", dc);
    };
    
    this.simpleActionFormatter = function(v, dc) {
        return fwRuleFormatter.simpleActionFormatter("", "", v, "", dc);
    };

    return fwRuleGridView;
});
