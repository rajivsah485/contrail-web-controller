/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var gridElId = '#' + ctwc.CONFIG_LB_POOL_MEMBER_GRID_ID,
        prefixId = ctwc.CONFIG_LB_POOL_MEMBER_PREFIX_ID,
        modalId = 'configure-' + prefixId,
        formId = '#' + modalId + '-form';

    var poolMemberEditView = ContrailView.extend({
        renderAddEditPoolMember: function(options) {
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
                                   poolMemberViewConfig(),
                                   "",
                                   null, null, function() {
                self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
                Knockback.applyBindings(self.model,
                                        document.getElementById(modalId));
                kbValidation.bind(self);
            });
        }
    });

    var poolMemberViewConfig = function () {
        return {
            elementId: ctwc.CONFIG_LB_POOL_MEMBER_PREFIX_ID,
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
                                elementId: "ip_address",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "ip_address",
                                    label: 'IP Address',
                                    placeholder:"xx.xx.xx.xx",
                                    dataBindValue: "ip_address",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: 'subnet',
                                view: "FormDropdownView",
                                name: 'Subnet',
                                viewConfig: {
                                    path : 'subnet',
                                    label: 'Subnet',
                                    class: "col-xs-6",
                                    dataBindValue :
                                        'subnet',
                                    elementConfig : {
                                        dataTextField : "text",
                                        dataValueField : "id",
                                        placeholder : 'Select Subnet',
                                        data : [{id: 'c4b529b7-87ae-4ec3-8c17-a592c3a45dcb', text:'testOne'},
                                            {id: 'd800a8fb-3d7e-4ecf-a0a6-e19f6701dfc5', text:'test22'}]
                                    }
                                }
                            },
                            {
                                elementId: "port",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "port",
                                    label: 'Port',
                                    type:'number',
                                    dataBindValue: "port",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: "weight",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "weight",
                                    type:'number',
                                    label: 'Weight',
                                    dataBindValue: "weight",
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
                                elementId: "status_description",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "status_description",
                                    label: 'Status Description',
                                    dataBindValue: "status_description",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return poolMemberEditView;
});

