/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model'
], function (_, ContrailView, ContrailListModel) {
    var listenerInfoView = ContrailView.extend({
        el: $(contentContainer),
        render: function () {
            var self = this,
            viewConfig = this.attributes.viewConfig,
            currentHashParams = layoutHandler.getURLHashParams(),
            listener = currentHashParams.focusedElement.listener,
            loadBalancerId = currentHashParams.focusedElement.uuid;
            var lbName = currentHashParams.focusedElement.lbName;
            var listenerRef = currentHashParams.focusedElement.listenerRef;
            viewConfig.lbId = currentHashParams.focusedElement.uuid;
            if($('#breadcrumb').children().length === 3){
                pushBreadcrumb([{label: lbName, href: listenerRef},{label: listener, href: ''}]);
            }
            var listModelConfig = {
                    remote: {
                        ajaxConfig: {
                            url: '/api/tenants/config/lbaas/load-balancer/'+ loadBalancerId ,
                            type: "GET"
                        },
                        dataParser: self.parseListenerinfoData,
                    }
            };
            var contrailListModel = new ContrailListModel(listModelConfig);
            this.renderView4Config(this.$el,
                    contrailListModel, getListenerInfoViewConfig(viewConfig));
        },

        parseListenerinfoData : function(response) {
            var listener = getValueByJsonPath(response,
                         "loadbalancer;loadbalancer-listener", [], false), dataItems = [];
            _.each(ctwc.LISTENER_INFO_OPTIONS_MAP, function(listenerOption){
                dataItems.push({ name: listenerOption.name,
                    value: listener[0][listenerOption.key], key: listenerOption.key});
            });
            return dataItems;
         }
    });

    var getListenerInfoViewConfig = function (viewConfig) {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_LISTENER_INFO_SECTION_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_LISTENER_INFO_ID,
                                view: "listenerInfoGridView",
                                viewPathPrefix: "config/networking/loadbalancer/ui/js/views/listener/",
                                app: cowc.APP_CONTRAIL_CONTROLLER,
                                viewConfig: {
                                    pagerOptions: {
                                        options: {
                                            pageSize: 10,
                                            pageSizeSelect: [10, 50, 100]
                                        }
                                    },
                                    lbId: viewConfig.lbId
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return listenerInfoView;
});

