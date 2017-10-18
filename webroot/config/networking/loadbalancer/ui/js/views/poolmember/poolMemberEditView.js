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
        renderEditPoolMember: function(options) {
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
        },
        renderAddPoolMember: function(options) {
            var editTemplate =
                contrail.getTemplate4Id(ctwl.TMPL_CORE_GENERIC_EDIT),
                editLayout = editTemplate({prefixId: prefixId, modalId: modalId}),
                self = this;
            cowu.createModal({'modalId': modalId, 'className': 'modal-700',
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
                                   poolMemberAddViewConfig(),
                                   "",
                                   null, null, function() {
                self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
                Knockback.applyBindings(self.model,
                                        document.getElementById(modalId));
                kbValidation.bind(self,{collection:
                    self.model.model().attributes.pool_member});
                kbValidation.bind(self);
            });
        },
        renderMultiDeletePoolMember: function(options) {
            var delTemplate =
                //Fix the template to be common delete template
                contrail.getTemplate4Id('core-generic-delete-form-template');
            var self = this;

            var delLayout = delTemplate({prefixId: prefixId});
            cowu.createModal({'modalId': modalId, 'className': 'modal-480',
                             'title': options['title'], 'btnName': 'Confirm',
                             'body': delLayout,
               'onSave': function () {
                /*self.model.multiDeleteVNCfg(options['checkedRows'], {
                    init: function () {
                        cowu.enableModalLoading(modalId);
                    },
                    success: function () {
                        options['callback']();
                        $("#" + modalId).modal('hide');
                    },
                    error: function (error) {
                        //Fix the form modal id for error
                        cowu.disableModalLoading(modalId, function () {
                            self.model.showErrorAttr(prefixId +
                                                     cowc.FORM_SUFFIX_ID,
                                                     error.responseText);
                        });
                    }
                });*/
                // TODO: Release binding on successful configure
            }, 'onCancel': function () {
                Knockback.release(self.model,
                                    document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).modal('hide');
            }});
            this.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
            Knockback.applyBindings(self.model,
                                        document.getElementById(modalId));
            kbValidation.bind(self);
        }
    });
    var poolMemberAddViewConfig = function () {
        return {
            elementId: ctwc.CONFIG_LB_POOL_MEMBER_PREFIX_ID,
            view: 'SectionView',
            active:false,
            viewConfig: {
                rows: [{
                    columns: [{
                        elementId: 'pool_member',
                        view: "FormCollectionView",
                        viewConfig: {
                            label:"",
                            path: "pool_member",
                            class: 'col-xs-12',
                            //validation: '',
                            templateId: cowc.TMPL_COLLECTION_HEADING_VIEW,
                            collection: "pool_member",
                            rows:[{
                               rowActions: [
                                   {onClick: "function() { $root.addPoolMemberByIndex($data, this); }",
                                   iconClass: 'fa fa-plus'},
                                   {onClick:
                                   "function() { $root.deletePoolMember($data, this); }",
                                    iconClass: 'fa fa-minus'}
                               ],
                            columns: [
                                {
                                    elementId: "pool_name",
                                    view: "FormInputView",
                                    name: 'Name',
                                    width: 200,
                                    viewConfig: {
                                        path: "pool_name",
                                        label: '',
                                        dataBindValue: "pool_name()",
                                        width: 200,
                                    }
                                },
                                {
                                    elementId: "pool_member_ip_address",
                                    view: "FormInputView",
                                    name: 'IP Address',
                                    width: 200,
                                    viewConfig: {
                                        path: "pool_member_ip_address",
                                        placeholder : 'xx.xx.xx.xx',
                                        label: '',
                                        dataBindValue: "pool_member_ip_address()",
                                        width: 200,
                                    }
                                },
                                {
                                    elementId: 'pool_member_subnet',
                                    view: "FormDropdownView",
                                    name: 'Subnet',
                                    width: 300,
                                    viewConfig: {
                                        path : 'pool_member_subnet',
                                        label: '',
                                        width: 300,
                                        dataBindValue :
                                            'pool_member_subnet()',
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
                                    elementId: "pool_member_port",
                                    view: "FormInputView",
                                    name: 'Port',
                                    width: 200,
                                    viewConfig: {
                                        path: "pool_member_port",
                                        label: '',
                                        dataBindValue: "pool_member_port()",
                                        width: 200
                                    }
                                },
                                {
                                    elementId: "pool_member_weight",
                                    view: "FormInputView",
                                    name: 'Weight',
                                    width: 200,
                                    viewConfig: {
                                        path: "pool_member_weight",
                                        type:'number',
                                        label: '',
                                        dataBindValue: "pool_member_weight()",
                                        width: 200
                                    }
                                }]
                            }],
                            gridActions: [
                                {onClick: "function() { addPoolMember(); }",
                                 buttonTitle: ""}
                            ]
                    }
                    }]
                }]
            }
        }
    };
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
                                elementId: "description",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "description",
                                    label: 'Description',
                                    dataBindValue: "description",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    },
                    {
                        columns: [
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
                            },{
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
                            }
                        ]
                    },
                    {
                        columns: [
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
                            },{
                                elementId: "weight",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "weight",
                                    type:'number',
                                    label: 'Weight',
                                    dataBindValue: "weight",
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

    return poolMemberEditView;
});

