/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var gridElId = '#' + ctwc.CONFIG_POOL_INFO_GRID_ID,
        prefixId = ctwc.CONFIG_POOL_INFO_PREFIX_ID,
        modalId = 'configure-' + prefixId,
        formId = '#' + modalId + '-form';

    var poolInfoEditView = ContrailView.extend({
        renderEditPoolInfo: function(options) {
            var editTemplate =
                contrail.getTemplate4Id(ctwl.TMPL_CORE_GENERIC_EDIT),
                editLayout = editTemplate({prefixId: prefixId, modalId: modalId}),
                self = this;
            cowu.createModal({'modalId': modalId, 'className': 'modal-560',
                             'title': options['title'], 'body': editLayout,
                             'onSave': function () {
                /*self.model.configureForwardingOptions({
                    init: function () {
                        cowu.enableModalLoading(modalId);
                    },
                    success: function () {
                        options['callback']();
                        $("#" + modalId).modal('hide');
                    },
                    error: function (error) {
                        cowu.disableModalLoading(modalId, function () {
                            self.model.showErrorAttr(prefixId +
                                                     cowc.FORM_SUFFIX_ID,
                                                     error.responseText);
                        });
                    }
                });*/
                // TODO: Release binding on successful configure
            }, 'onCancel': function () {
                Knockback.release(self.model, document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).modal('hide');
            }});

            self.renderView4Config($("#" + modalId).find(formId),
                                   this.model,
                                   poolInfoViewConfig(),
                                   "",
                                   null, null, function() {
                self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
                Knockback.applyBindings(self.model,
                                        document.getElementById(modalId));
                kbValidation.bind(self);
            });
        }
    });

    var poolInfoViewConfig = function () {
        return {
            elementId: ctwc.CONFIG_POOL_INFO_PREFIX_ID,
            view: 'SectionView',
            active:false,
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: "display_name",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "display_name",
                                    label: 'Name',
                                    dataBindValue: "display_name",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: 'protocol',
                                view: "FormDropdownView",
                                viewConfig: {
                                    label: 'Protocol',
                                    path : 'protocol',
                                    class: 'col-xs-6',
                                    dataBindValue :
                                        'protocol',
                                    elementConfig : {
                                        dataTextField : "text",
                                        dataValueField : "id",
                                        placeholder : 'Select Protocol',
                                        data : [{id: 'HTTP', text:'HTTP'},
                                                {id: 'HTTPS', text:'HTTPS'},
                                                {id: 'TCP', text:'TCP'},
                                                {id: 'TERMINATED_HTTPS', text:'TERMINATED_HTTPS'}]
                                    }
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: "session_persistence",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "session_persistence",
                                    label: 'Session Persistence',
                                    dataBindValue: "session_persistence",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: "persistence_cookie_name",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "persistence_cookie_name",
                                    label: 'Persistence Cookie Name',
                                    dataBindValue: "persistence_cookie_name",
                                    class: "col-xs-6"
                                }
                            }
                            
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: "status_description",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "status_description",
                                    label: 'Status Description',
                                    dataBindValue: "status_description",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: 'loadbalancer_method',
                                view: "FormDropdownView",
                                viewConfig: {
                                    label: 'Load Balancer Method',
                                    path : 'loadbalancer_method',
                                    class: 'col-xs-6',
                                    dataBindValue :
                                        'loadbalancer_method',
                                    elementConfig : {
                                        dataTextField : "text",
                                        dataValueField : "id",
                                        placeholder : 'Select Method',
                                        data : [{id: 'LEAST_CONNECTIONS', text:'LEAST_CONNECTIONS'},
                                                {id: 'ROUND_ROBIN', text:'ROUND_ROBIN'},{id: 'SOURCE_IP', text:'SOURCE_IP'}]
                                    }
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: 'admin_state',
                                view: "FormCheckboxView",
                                viewConfig : {
                                    path : 'admin_state',
                                    class : "col-xs-6",
                                    label:'Admin State',
                                    dataBindValue : 'admin_state',
                                    elementConfig : {
                                        isChecked:false
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return poolInfoEditView;
});

