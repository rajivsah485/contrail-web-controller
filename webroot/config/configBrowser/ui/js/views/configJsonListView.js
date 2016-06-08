/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'backbone'
],function(_,Backbone) {
    var JsonListView = Backbone.View.extend({
        initialize: function(options) {
        },
        renderJsonList: function() {
            var self = this;
            var jsonList = self.model.getItems();
            var jsonListTmpl = contrail.getTemplate4Id('jsonList-template');
            self.$el.find('.widget-body .widget-main').
                html(jsonListTmpl(jsonList));
        },
        render: function(viewConfig) {
            var self = this;
            self.renderJsonList();
            self.model.onDataUpdate.subscribe(function() {
                self.renderJsonList();
            });
        }
    });
    return JsonListView;
});
