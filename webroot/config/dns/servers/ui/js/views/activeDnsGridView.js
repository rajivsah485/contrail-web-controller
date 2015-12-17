/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */
define([
    'underscore',
    'contrail-view',
    'config/dns/servers/ui/js/activeDNSFormatter'],function(_, ContrailView, activeDNSFormatter) {
    var gridElId = "#ActiveDnsGrid";

    var ActiveDnsGridView = ContrailView.extend({
        el: $(contentContainer),
        render: function() {
            var self = this,
                viewConfig = this.attributes.viewConfig,
                pagerOptions = viewConfig['pagerOptions'];
            this.renderView4Config(self.$el, self.model,
                getActiveDnsGridViewConfig(pagerOptions)
            );
        }
    });

    var getActiveDnsGridViewConfig = function(pagerOptions) {
        return {
            elementId: "ActiveDnsListView",
            view: "SectionView",
            viewConfig: {
                rows: [{
                    columns: [{
                        elementId: 'ActiveDnsGrid',
                        title: 'Active DNS Database',
                        view: "GridView",
                        viewConfig: {
                            elementConfig: getConfiguration(
                                pagerOptions)
                        }
                    }]
                }]
            }
        }
    };
    var getConfiguration = function() {
        var gridElementConfig = {
            header: {
                title: {
                    text: "Active DNS Database"
                },
                customControls: [
                    '<a class="widget-toolbar-icon"><i class="icon-forward"></i></a>',
                    '<a class="widget-toolbar-icon"><i class="icon-backward"></i></a>',
                ]
            },

            body: {
                options: {
                    detail: {
                        template:
                         cowu.generateDetailTemplateHTML(getActiveDNSDetailsTemplateConfig(),
                                                       cowc.APP_CONTRAIL_CONTROLLER)
                    },
                    checkboxSelectable: false,
                },
                dataSource: {}
            },
            columnHeader: {
                columns: ActiveDnsColumns
            },
            footer: false
        };
        return gridElementConfig;
    };

    var ActiveDnsColumns = [{
        id: 'name',
        field: 'name',
        name: 'Name',
        minWidth: 300,
        formatter: activeDNSFormatter.nameFormatter
    }, {
        id: 'rec_name',
        field: 'rec_name',
        name: 'DNS Record Name',
        formatter: activeDNSFormatter.recNameFormatter
    }, {
        id: 'rec_type',
        field: 'rec_type',
        name: 'DNS Record Type',
        formatter: activeDNSFormatter.recTypeFormatter
    }, {
        id: 'rec_data',
        field: 'rec_data',
        name: 'DNS Record Data',
        formatter: activeDNSFormatter.recDataFormatter
    }, {
        id: 'source',
        field: 'source',
        name: 'Source',
        formatter: activeDNSFormatter.sourceFormatter
    }, {
        id: 'installed',
        field: 'installed',
        name: 'Installed',
        formatter: activeDNSFormatter.installedFormatter
    }];

    function getActiveDNSDetailsTemplateConfig() {
        return {
            templateGenerator: 'RowSectionTemplateGenerator',
            templateGeneratorConfig: {
                rows: [{
                    templateGenerator: 'ColumnSectionTemplateGenerator',
                    templateGeneratorConfig: {
                        columns: [{
                            class: 'span6',
                            rows: [{
                                title: 'Details',
                                templateGenerator: 'BlockListTemplateGenerator',
                                templateGeneratorConfig: [{
                                    key: 'name',
                                    templateGenerator: 'TextGenerator',
                                    label: 'Name',
                                    templateGeneratorConfig: {
                                        formatter: 'NameFormatter'
                                    }
                                },{
                                    key: 'rec_name',
                                    label: 'Record Name',
                                    templateGenerator: 'TextGenerator',
                                    templateGeneratorConfig: {
                                        formatter: 'RecNameFormatter'
                                    }
                                },{
                                    key: 'rec_type',
                                    label: 'Record Type',
                                    templateGenerator: 'TextGenerator',
                                    templateGeneratorConfig: {
                                        formatter: 'RecTypeFormatter'
                                    }
                                },{
                                    key: 'rec_data',
                                    label: 'Record Data',
                                    templateGenerator: 'TextGenerator',
                                    templateGeneratorConfig: {
                                        formatter: 'RecDataFormatter'
                                    }
                                },{
                                    key: 'rec_ttl',
                                    label: 'Time To Live',
                                    templateGenerator: 'TextGenerator',
                                    templateGeneratorConfig: {
                                        formatter: 'TTLFormatter'
                                    }
                                },{
                                    key: 'source',
                                    label: 'Source',
                                    templateGenerator: 'TextGenerator',
                                    templateGeneratorConfig: {
                                        formatter: 'SourceFormatter'
                                    }
                                },{
                                    key: 'installed',
                                    label: 'Installed',
                                    templateGenerator: 'TextGenerator',
                                    templateGeneratorConfig: {
                                        formatter: 'InstalledFormatter'
                                    }
                                }]
                            }]
                        }]
                    }
                }]
            }
        };
    };


    this.NameFormatter = function(v, dc) {
        return activeDNSFormatter.nameFormatter("", "", v, "", dc);
    };
    this.RecNameFormatter = function(v, dc) {
        return activeDNSFormatter.recNameFormatter("", "", v, "", dc);
    };
    this.RecTypeFormatter = function(v, dc) {
        return activeDNSFormatter.recTypeFormatter("", "", v, "", dc);
    };
    this.RecDataFormatter = function(v, dc) {
        return activeDNSFormatter.recDataFormatter("", "", v, "", dc);
    };
    this.SourceFormatter = function(v, dc) {
        return activeDNSFormatter.sourceFormatter("", "", v, "", dc);
    };
    this.InstalledFormatter = function(v, dc) {
        return activeDNSFormatter.installedFormatter("", "", v, "", dc);
    };
    this.TTLFormatter = function(v, dc) {
        return activeDNSFormatter.ttlFormatter("", "", v, "", dc);
    };
    return ActiveDnsGridView;
});