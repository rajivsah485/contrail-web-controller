/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var lbCfgView = ContrailView.extend({
        el: $(contentContainer),
        renderLoadBalancer: function (viewConfig) {
            this.renderView4Config(this.$el, null, getLBCfgListConfig(viewConfig));
        }
    });


    function getLBCfgListConfig(viewConfig) {
        var hashParams = viewConfig.hashParams,
            customProjectDropdownOptions = {
                config: true,
                includeDefaultProject: true,
                childView: {
                    init: getLBCfgViewConfig(viewConfig),
                },
            },
            customDomainDropdownOptions = {
                childView: {
                    init: ctwvc.getProjectBreadcrumbDropdownViewConfig(hashParams,
                                                 customProjectDropdownOptions)
                }
            };
        return ctwvc.getDomainBreadcrumbDropdownViewConfig(hashParams,
                                                     customDomainDropdownOptions)
    };

    function getLBCfgViewConfig(viewConfig) {
        return function (projectSelectedValueData) {
            return {
                elementId: cowu.formatElementId([ctwl.CFG_LB_PAGE_ID]),
                view: "lbCfgListView",
                viewPathPrefix:
                    "config/networking/loadbalancer/ui/js/views/",
                app: cowc.APP_CONTRAIL_CONTROLLER,
                viewConfig: $.extend(true, {},
                     viewConfig, {projectSelectedValueData: projectSelectedValueData})
            }
        }
    };

    return lbCfgView;
});
