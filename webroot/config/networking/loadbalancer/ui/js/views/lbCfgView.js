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
        },
        renderLBDetails: function(viewConfig) {
            var self = this,
            currentHashParams = layoutHandler.getURLHashParams(),
            loadBalancer = currentHashParams.focusedElement.loadBalancer,
            projectDisplayName = contrail.getCookie(cowc.COOKIE_PROJECT_DISPLAY_NAME),
            lbNameFormat;
            lbNameFormat = loadBalancer + " ("+projectDisplayName+")";
            
            self.renderView4Config(self.$el, null,
                  getLoadBalancerDetails(viewConfig, lbNameFormat));
        }
    });

    function getLoadBalancerDetails(viewConfig, lbNameFormat){
        return {
            elementId: "laod-balancer-childs-page-id",
            view: "SectionView",
            viewConfig: {
                title: 'Load Balancer' + " : " + lbNameFormat,
                elementId: "flaod-balancer-childs-page-tabs",
                rows: [{
                    columns: [{
                        elementId: "laod-balancer-childs-tab-id",
                        view: 'TabsView',
                        viewConfig: getLoadBalancerTabs(viewConfig)
                    }]
                }]
            }
        };
    };

    function getLoadBalancerTabs(viewConfig){
        return {
            theme: 'default',
            active: 0,
            tabs: [/*{
               elementId: 'load_balancer_info_tab',
               title: 'Load Balancer Info',
               view: "lbInfoView",
               viewPathPrefix: "config/networking/loadbalancer/ui/js/views/",
               app: cowc.APP_CONTRAIL_CONTROLLER,
               viewConfig: viewConfig,
               tabConfig: {
                   activate: function(event, ui) {
                       var gridId = $('#' + 'fw-policy-Project-info');
                       if (gridId.data('contrailGrid')) {
                           gridId.data('contrailGrid').refreshView();
                       }
                   },
                   renderOnActivate: false
               }
           },*/ {
               elementId: 'load_balancer_listener_info_tab',
               title: 'Listeners',
               view: "listenerListView",
               viewPathPrefix: "config/networking/loadbalancer/ui/js/views/listener/",
               app: cowc.APP_CONTRAIL_CONTROLLER,
               viewConfig: viewConfig,
               tabConfig: {
                   activate: function(event, ui) {
                       var gridId = $('#' + ctwc.CONFIG_LB_LISTENER_GRID_ID);
                       if (gridId.data('contrailGrid')) {
                           gridId.data('contrailGrid').refreshView();
                       }
                   },
                   renderOnActivate: true
               }
           }, {
               elementId: 'load_balancer_pool_info_tab',
               title: 'Pools',
               view: "poolListView",
               viewPathPrefix: "config/networking/loadbalancer/ui/js/views/pool/",
               viewConfig: viewConfig,
               tabConfig: {
                   activate: function(event, ui) {
                       var gridId = $('#' + ctwc.CONFIG_LB_POOL_GRID_ID);
                       if (gridId.data('contrailGrid')) {
                           gridId.data('contrailGrid').refreshView();
                       }
                   },
                   renderOnActivate: false
               }
           },{
               elementId: 'load_balancer_poolmember_info_tab',
               title: 'Pool Members',
               view: "poolMemberListView",
               viewPathPrefix: "config/networking/loadbalancer/ui/js/views/poolmember/",
               viewConfig: viewConfig,
               tabConfig: {
                   activate: function(event, ui) {
                       var gridId = $('#' + ctwc.CONFIG_LB_POOL_MEMBER_GRID_ID);
                       if (gridId.data('contrailGrid')) {
                           gridId.data('contrailGrid').refreshView();
                       }
                   },
                   renderOnActivate: false
               }
           },{
               elementId: 'load_balancer_monitor_info_tab',
               title: 'Monitors',
               view: "monitorListView",
               viewPathPrefix: "config/networking/loadbalancer/ui/js/views/monitor/",
               viewConfig: viewConfig,
               tabConfig: {
                   activate: function(event, ui) {
                       var gridId = $('#' + ctwc.CONFIG_LB_MONITOR_GRID_ID);
                       if (gridId.data('contrailGrid')) {
                           gridId.data('contrailGrid').refreshView();
                       }
                   },
                   renderOnActivate: false
               }
           }]
        };
    };

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
