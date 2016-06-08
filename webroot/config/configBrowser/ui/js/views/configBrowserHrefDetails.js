/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */
define([
    'underscore',
    'contrail-view','contrail-list-model'],
    function(_, ContrailView, ContrailListModel) {
        var configHrefDetails = ContrailView.extend({
            el: $(contentContainer),
            renderConfigHref: function(viewConfig) {
                var self = this;
                var hrefTmpl = contrail.getTemplate4Id(cowc.TMPL_CONFIG_HREF);
                $(contentContainer).html(hrefTmpl);
                var href = decodeURIComponent(contrail.getCookie('configBrowserHref')).split('/');
                href.splice(href.length - 2, 1);
                var configHref = href.join('/');
                var ajaxConfig = {
                        url:configHref,
                        type:'Get'
                     };
                contrail.ajaxHandler(ajaxConfig, null, function(model) {
                     var rowJson = contrail.formatConfigBrowserJSON2HTML(model, 10, true);
                     var jsonContainer = $(contentContainer).find('#href-container')
                     jsonContainer.append(rowJson);
                });
            }
        });
    return configHrefDetails;
});