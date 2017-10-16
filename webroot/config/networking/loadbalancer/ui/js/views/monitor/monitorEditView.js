/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var gridElId = '#' + ctwc.CONFIG_LB_MONITOR_GRID_ID,
        prefixId = ctwc.CONFIG_LB_MONITOR_PREFIX_ID,
        modalId = 'configure-' + prefixId,
        formId = '#' + modalId + '-form';

    var monitorEditView = ContrailView.extend({
        renderMonitorEdit: function(options) {
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
                                   monitorViewConfig(),
                                   "",
                                   null, null, function() {
                self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
                Knockback.applyBindings(self.model,
                                        document.getElementById(modalId));
                kbValidation.bind(self);
            });
        }
    });

    var monitorViewConfig = function () {
        return {
            elementId: ctwc.CONFIG_LB_MONITOR_PREFIX_ID,
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
                                elementId: "delay",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "delay",
                                    label: 'Delay',
                                    type:'number',
                                    dataBindValue: "delay",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: "max_retries",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "max_retries",
                                    type:'number',
                                    label: 'Retry count before markdown',
                                    dataBindValue: "max_retries",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: "timeout",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "timeout",
                                    type:'number',
                                    label: 'Timeout (sec)',
                                    dataBindValue: "timeout",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: 'monitor_type',
                                view: "FormDropdownView",
                                viewConfig: {
                                    label: 'Monitor Type',
                                    path : 'monitor_type',
                                    class: 'col-xs-6',
                                    dataBindValue :
                                        'monitor_type',
                                    elementConfig : {
                                        dataTextField : "text",
                                        dataValueField : "id",
                                        placeholder : 'Select Monitor Type',
                                        data : [{id: 'HTTP', text:'HTTP'},{id: 'HTTPS', text:'HTTPS'},
                                                {id: 'PING', text:'PING'},{id: 'TCP', text:'TCP'}]
                                    }
                                }
                            },
                            {
                                elementId: "expected_codes",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "expected_codes",
                                    type:'number',
                                    label: 'Health check interval (sec)',
                                    dataBindValue: "expected_codes",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: "http_method",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "http_method",
                                    label: 'Http Method',
                                    dataBindValue: "http_method",
                                    class: "col-xs-6"
                                }
                            },
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

    return monitorEditView;
});

