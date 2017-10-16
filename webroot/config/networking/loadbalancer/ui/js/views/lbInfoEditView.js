/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var gridElId = '#' + ctwc.CONFIG_LB_INFO_GRID_ID,
        prefixId = ctwc.CONFIG_LB_INFO_PREFIX_ID,
        modalId = 'configure-' + prefixId,
        formId = '#' + modalId + '-form';

    var lnInfoEditView = ContrailView.extend({
        renderEditInfoLb: function(options) {
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
                                   lbInfoViewConfig(),
                                   "",
                                   null, null, function() {
                self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
                Knockback.applyBindings(self.model,
                                        document.getElementById(modalId));
                kbValidation.bind(self);
            });
        }
    });

    var lbInfoViewConfig = function () {
        return {
            elementId: ctwc.CONFIG_LB_INFO_PREFIX_ID,
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
                                elementId: 'loadbalancer_provider',
                                view: "FormDropdownView",
                                viewConfig: {
                                    label: 'Loadbalancer Provider',
                                    path : 'loadbalancer_provider',
                                    class: 'col-xs-6',
                                    dataBindValue :
                                        'loadbalancer_provider',
                                    elementConfig : {
                                        placeholder : 'Select Loadbalancer Provider',
                                        dataTextField : "text",
                                        dataValueField : "id",
                                        data : [{id: 'native', text:'native'},
                                            {id: 'opencontrail', text:'opencontrail'}]
                                    }
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: "provisioning_status",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "provisioning_status",
                                    label: 'Provisioning Status',
                                    dataBindValue: "provisioning_status",
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
                    },
                    {
                        columns: [
                            {
                                elementId: "fixed_ip",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "fixed_ip",
                                    label: 'Fixed Ips',
                                    disabled: true,
                                    dataBindValue: "fixed_ip",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: "operating_status",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "operating_status",
                                    label: 'Operating Status',
                                    dataBindValue: "operating_status",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: "service_instance_refs",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "service_instance_refs",
                                    disabled: true,
                                    label: 'Service Instance',
                                    dataBindValue: "service_instance_refs",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: "virtual_machine_interface_refs",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "virtual_machine_interface_refs",
                                    disabled: true,
                                    label: 'Virtual Machine Interface',
                                    dataBindValue: "virtual_machine_interface_refs",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return lnInfoEditView;
});

