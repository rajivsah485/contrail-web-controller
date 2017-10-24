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
        renderEditLb: function(options) {
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
        },
        renderMultiDeleteLb: function(options) {
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
        },
        renderAssociateIp: function(options) {
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
            this.fetchAllData(self ,options, 
                    function(allData) {
                    self.renderView4Config($("#" + modalId).find(formId),
                            self.model,
                            associateIpViewConfig(allData),
                            "",
                            null, null, function() {
                     self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
                     $('#configure-config_lb_info .modal-footer button:last-child').text('Associate');
                     Knockback.applyBindings(self.model,
                                             document.getElementById(modalId));
                     kbValidation.bind(self);
                 });
            });
        },
        renderDeassociateIp: function(options) {
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
                    self.model,
                    diAssociateIpViewConfig(options),
                    "",
                    null, null, function() {
             self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
             $('#configure-config_lb_info .modal-footer button:last-child').text('Diassociate');
             Knockback.applyBindings(self.model,
                                     document.getElementById(modalId));
             kbValidation.bind(self);
           });
        },
        fetchAllData : function(self, options, callback) {
            var getAjaxs = [];
            getAjaxs[0] = $.ajax({
                url: ctwc.get(ctwc.URL_CFG_FIP_DETAILS) + '/' + options.ProjectId,
                type:"GET"
            });
            $.when.apply($, getAjaxs).then(
                function () {
                    var returnArr = []
                    var floatingList = arguments[0]['floating_ip_back_refs'];
                    var floatingIpList = [];
                    for(var i = 0; i < floatingList.length; i++){
                        var floatingIp = floatingList[i]['floating-ip'];
                        floatingIpList.push(
                                 {text : floatingIp.floating_ip_address,
                                     value : floatingIp.uuid + cowc.DROPDOWN_VALUE_SEPARATOR + "floating_ip_address",
                                     id : floatingIp.uuid + cowc.DROPDOWN_VALUE_SEPARATOR + "floating_ip_address",
                                     parent : "floating_ip_address"});
                        
                    }
                    
                    var addrFields = [];
                    addrFields.push({text : 'Floating IP Addresses', value : 'floating_ip_address', id: 'floating_ip_address', children : floatingIpList},
                                   {text : "Floating IP Pools", value: "floating_ip_pools", id:'floating_ip_pools', children: []});
                    returnArr["addrFields"] = addrFields;
                    callback(returnArr);
                }
            )
        }
    });
    var diAssociateIpViewConfig = function(options){
        var confirmMsg = 'You are about to disassociate the floating IP address from load balancer "'+ options.LbName +'" Please confirm.'
        return {
            elementId: ctwc.CONFIG_LB_INFO_PREFIX_ID,
            view: 'SectionView',
            active:false,
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: 'diassociated-ip-text',
                                view: "FormTextView",
                                viewConfig: {
                                    value: confirmMsg,
                                    elementConfig: {
                                        class: "and-clause-text",
                                        class: "col-xs-12"
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    }
    var associateIpViewConfig = function (allData) {
        return {
            elementId: ctwc.CONFIG_LB_INFO_PREFIX_ID,
            view: 'SectionView',
            active:false,
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: 'associated-ip-text',
                                view: "FormTextView",
                                viewConfig: {
                                    value: "Select a floating IP address to associate with the load balancer or a floating IP pool in which to allocate a new floating IP address.",
                                    elementConfig: {
                                        class: "and-clause-text",
                                        class: "col-xs-12"
                                    }
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: 'associated_ip_address',
                                view:"FormHierarchicalDropdownView",
                                name: 'Floating IP address or pool',
                                viewConfig: {
                                    templateId: cowc.TMPL_MULTISELECT_VIEW,
                                    path: 'associated_ip_address',
                                    label: 'Floating IP address or pool',
                                    class:'col-xs-12',
                                    dataBindValue: 'associated_ip_address',
                                    selectOnBlur: false,
                                    elementConfig: {
                                        placeholder: 'Select Floating IP address or pool',
                                        //defaultValueId : 1,
                                        minimumResultsForSearch : 1,
                                        dataTextField: "text",
                                        dataValueField: "value",
                                        data: allData.addrFields,
                                        queryMap: [
                                            { name : 'Floating IP Addresses',  value : 'floating_ip_address', iconClass:'icon-contrail-network-ipam' },
                                            { name : 'Floating IP Pools',  value : 'floating_ip_pools', iconClass:'fa fa-globe'}]
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };
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
                                elementId: "loadbalancer_provider",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "loadbalancer_provider",
                                    disabled: true,
                                    label: 'Loadbalancer Provider',
                                    dataBindValue: "loadbalancer_provider",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: "fixed_ip",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "fixed_ip",
                                    label: 'Fixed IPs',
                                    disabled: true,
                                    dataBindValue: "fixed_ip",
                                    class: "col-xs-6"
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

    return lnInfoEditView;
});
