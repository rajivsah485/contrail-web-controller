/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */
define([
    'underscore',
    'contrail-view','contrail-list-model',
    'config/configBrowser/ui/js/views/configJsonListView',
    'config/configBrowser/ui/js/models/configJsonListModel',
    'config/configBrowser/ui/js/views/configBrowserHrefDetails'],
    function(_, ContrailView, ContrailListModel, ConfigJsonListView, ConfigJsonListModel,
            ConfigBrowserHrefDetails ) {
        var configData = [];
        var configBrowserView = ContrailView.extend({
        el: $(contentContainer),
        renderConfig: function(viewConfig) {
            var self = this;
            var hashParams = viewConfig.hashParams;
            if(viewConfig.hashParams.configLevel === 'jsonList'){
                var configHrefDetail = new ConfigBrowserHrefDetails();
                configHrefDetail.renderConfigHref({
                    hashParams: hashParams
                });
             }else{
                var jsonListTmpl = contrail.getTemplate4Id(cowc.TMPL_CONFIG_JSON_LSIT);
                $(contentContainer).html(jsonListTmpl);
                var configJsonListView = new ConfigJsonListView({
                    el: $(contentContainer).find('#config-json-list'),
                    model: new ConfigJsonListModel()
                });
                configJsonListView.render();
            }
            
        }
    });
    return configBrowserView;
});