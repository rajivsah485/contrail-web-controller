/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model'
], function (_, ContrailView, ContrailListModel) {
    var poolInfoView = ContrailView.extend({
        el: $(contentContainer),
        render: function () {
            var self = this,
            viewConfig = this.attributes.viewConfig,
            currentHashParams = layoutHandler.getURLHashParams(),
            poolName = currentHashParams.focusedElement.pool,
            loadBalancerId = currentHashParams.focusedElement.uuid,
            lbName = currentHashParams.focusedElement.lbName,
            listenerRef = currentHashParams.focusedElement.listenerRef,
            poolRef = currentHashParams.focusedElement.poolRef,
            listenerName = currentHashParams.focusedElement.listenerName;
            viewConfig.lbId = currentHashParams.focusedElement.uuid;
            if($('#breadcrumb').children().length === 4){
                $('#breadcrumb li').last().remove();
            }
            if($('#breadcrumb').children().length === 3){
                pushBreadcrumb([{label: lbName, href: listenerRef},{label: listenerName, href: poolRef},{label: poolName, href: ''}]);
            }
            var listModelConfig = {
                    remote: {
                        ajaxConfig: {
                            url: '/api/tenants/config/lbaas/load-balancer/'+ loadBalancerId ,
                            type: "GET"
                        },
                        dataParser: self.parsePoolinfoData,
                    }
            };
            var contrailListModel = new ContrailListModel(listModelConfig);
            this.renderView4Config(this.$el,
                    contrailListModel, getPoolInfoViewConfig(viewConfig));
        },

        parsePoolinfoData : function(response) {
            var listener = getValueByJsonPath(response,
                         "loadbalancer;loadbalancer-listener", [], false), dataItems = [],
                         poolList = [];
            _.each(listener, function(obj) {
                var pool = getValueByJsonPath(obj, 'loadbalancer-pool', []);
                if(pool.length > 0){
                  poolList = poolList.concat(pool);   
                }
            });
            _.each(ctwc.POOL_INFO_OPTIONS_MAP, function(poolOption){
                dataItems.push({ name: poolOption.name,
                    value: poolList[0][poolOption.key], key: poolOption.key});
            });
            return dataItems;
         }
    });

    var getPoolInfoViewConfig = function (viewConfig) {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_POOL_INFO_SECTION_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_POOL_INFO_ID,
                                view: "poolInfoGridView",
                                viewPathPrefix: "config/networking/loadbalancer/ui/js/views/pool/",
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

    return poolInfoView;
});

