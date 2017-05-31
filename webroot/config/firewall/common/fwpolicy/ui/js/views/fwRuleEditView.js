/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var gridElId = '#' + ctwc.FW_RULE_GRID_ID,
        prefixId = ctwc.FW_RULE_PREFIX_ID,
        modalId = 'configure-' + prefixId,
        formId = '#' + modalId + '-form';

    var fwRuleEditView = ContrailView.extend({
    	renderAddEditFwRule: function(options) {
            var editTemplate =
                contrail.getTemplate4Id(ctwl.TMPL_CORE_GENERIC_EDIT),
                editLayout = editTemplate({prefixId: prefixId, modalId: modalId}),
                self = this,disable = false;
            var mode = options.mode;
            if(mode === 'edit'){
            	disable = true;
            }
            cowu.createModal({'modalId': modalId, 'className': 'modal-610',
                             'title': options['title'], 'body': editLayout,
                             'onSave': function () {
                self.model.addEditFirewallRule({
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
                }, options);
                // TODO: Release binding on successful configure
            }, 'onCancel': function () {
                Knockback.release(self.model, document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).modal('hide');
            }});
            this.fetchAllData(this ,
                    function(allData) {
                       self.renderView4Config($("#" + modalId).find(formId),
		                        self.model,
		                        getFwRuleViewConfig(disable, allData),
		                        "",
		                        null, null, function() {
							     self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
							     Knockback.applyBindings(self.model,
							                             document.getElementById(modalId));
							     kbValidation.bind(self);
					    },null,false);
		              return;
                   }
               );

        },
        renderDeleteFirewallRule: function(options) {
            var delTemplate =
                contrail.getTemplate4Id('core-generic-delete-form-template');
            var self = this;

            var delLayout = delTemplate({prefixId: prefixId});
            cowu.createModal({'modalId': modalId, 'className': 'modal-480',
                             'title': options['title'], 'btnName': 'Confirm',
                             'body': delLayout,
               'onSave': function () {
                self.model.deleteFirewallRule(options['selectedGridData'], {
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
                });
            }, 'onCancel': function () {
                Knockback.release(self.model, document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).modal('hide');
            }});
            self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
            Knockback.applyBindings(self.model,
                document.getElementById(modalId));
            kbValidation.bind(self);
        },
        fetchAllData : function(self, callback) {
            var getAjaxs = [];
            var tagParam = {data: [{type: 'tags'}]};
            var addressGrpParam = {data: [{type: 'address-groups'}]};
            getAjaxs[0] = $.ajax({
                url: '/api/tenants/config/get-config-details',
                type:"POST",
                data: tagParam
            });
            getAjaxs[1] = $.ajax({
                url: '/api/tenants/config/get-config-details',
                type:"POST",
                data: addressGrpParam
            });
            getAjaxs[2] = $.ajax({
                url:"/api/tenants/config/virtual-networks",
                type:"GET"
            });
            $.when.apply($, getAjaxs).then(
                function () {
                    var returnArr = [], results = arguments, applicationChild = [{text:'Select a Application',
                        value:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "application",
                        id:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "application",
                        disabled : true }];
                    var tierChild = [{text:'Select a Tier',
                        value:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "tier",
                        id:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "tier",
                        disabled : true }], deploymentChild = [{text:'Select a Deployment',
                            value:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "deployment",
                            id:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "deployment",
                            disabled : true }], siteChild = [{text:'Select a Site',
                                value:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "site",
                                id:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "site",
                                disabled : true }], addrFields = [];
                    var addressGrpChild = [{text:'Select Address Group',
                        value:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "address_group",
                        id:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "address_group",
                        disabled : true }];
                    var tagList = ['Application','Deployment','Site','Tier'];
                    var tags = results[0][0][0]['tags'];
                    var addressGrp = results[1][0][0]['address-groups'];
                    var virtualNet = results[2][0]['virtual-networks'];
                    var domain = contrail.getCookie(cowc.COOKIE_DOMAIN_DISPLAY_NAME);
                    var project = contrail.getCookie(cowc.COOKIE_PROJECT_DISPLAY_NAME);
                    if(tags.length > 0){
                    	for(var i = 0; i < tags.length; i++){
                    		var fqName = tags[i]['tag']['fq_name'].reverse()[0].split('-');
                    		var tagType = fqName[0];
                    		var val = tags[i]['tag'].fq_name.length === 1 ?
                                    'global:' + tags[i]['tag']['name'] : tags[i]['tag']['name'];                    		
                    		if(tagType === ctwc.APPLICATION_TAG_TYPE){
                    			applicationChild.push({text : tags[i]['tag']['tag_value'],
                                     value : val + cowc.DROPDOWN_VALUE_SEPARATOR + "application",
                                     id : val + cowc.DROPDOWN_VALUE_SEPARATOR + "application",
                                     parent : "application" })
                    		}else if(tagType === ctwc.TIER_TAG_TYPE){
                    			tierChild.push({text : tags[i]['tag']['tag_value'],
                                    value : val + cowc.DROPDOWN_VALUE_SEPARATOR + "tier",
                                    id : val + cowc.DROPDOWN_VALUE_SEPARATOR + "tier",
                                    parent : "tier" });
                    		}else if(tagType === ctwc.DEPLOYMENT_TAG_TYPE){
                    			deploymentChild.push({text : tags[i]['tag']['tag_value'],
                                    value : val + cowc.DROPDOWN_VALUE_SEPARATOR + "deployment",
                                    id : val + cowc.DROPDOWN_VALUE_SEPARATOR + "deployment",
                                    parent : "deployment" });
                    		}else if(tagType === ctwc.SITE_TAG_TYPE){
                    			siteChild.push({text : tags[i]['tag']['tag_value'],
                                    value : val + cowc.DROPDOWN_VALUE_SEPARATOR + "site",
                                    id : val + cowc.DROPDOWN_VALUE_SEPARATOR + "site",
                                    parent : "site" });
                    		}
                    		
                    	}
                    	for(var j = 0; j < tagList.length; j++){
                    		var tagVal, tagData;
                    		if(tagList[j] === 'Application'){
                    			tagVal = 'application';
                    			tagData = applicationChild;
                    		}else if(tagList[j] === 'Tier'){
                    			tagVal = 'tier';
                    			tagData = tierChild;
                    		}else if(tagList[j] === 'Deployment'){
                    			tagVal = 'deployment';
                    			tagData = deploymentChild;
                    		}else if(tagList[j] === 'Site'){
                    			tagVal = 'site';
                    			tagData = siteChild;
                    		}
                    		addrFields.push({text : tagList[j], value : tagVal, children : tagData});
                    	}
                    }
                    if(addressGrp.length > 0){
                        for(var a = 0; a< addressGrp.length; a++){
                            var address = addressGrp[a]['address-group'];
                            var fqNameTxt = address["fq_name"][address["fq_name"].length - 1];
                            var fqNameValue = address["fq_name"].join(":");
                            addressGrpChild.push({text : fqNameTxt,
                                 value : fqNameValue + cowc.DROPDOWN_VALUE_SEPARATOR + "address_group",
                                 id : fqNameValue + cowc.DROPDOWN_VALUE_SEPARATOR + "address_group",
                                 parent : "address_group" });
                        }                    	
                    	addrFields.push({text : 'Address Group', value : 'address_group', children : addressGrpChild});
                    }
                    if(virtualNet.length > 0){
                    	var virtualNetworkList = [{text:'Enter or Select a Virtual Network',
                            value:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "virtual_network",
                            id:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "virtual_network",
                            disabled : true }/*,
                          {text:"ANY (All Networks in Current Project)",
                            value:"any" + cowc.DROPDOWN_VALUE_SEPARATOR + "virtual_network",
                            id:"any" + cowc.DROPDOWN_VALUE_SEPARATOR + "virtual_network",
                            "parent": "virtual_network"}*/];
                    	  for(var i = 0; i< virtualNet.length; i++){
                    	      var vn = getValueByJsonPath(virtualNet[i],
                    	              'fq_name', [], false);
                              /*if(vn[2].toLowerCase() === "any" ||
                                      vn[2].toLowerCase() === "local"){*/
                                       var fqNameTxt = vn[2]; /*+' (' +
                                                       domain + ':' +
                                                       project +')';*/
                                       var fqNameValue = vn.join(":");
                                       virtualNetworkList.push({text : fqNameTxt,
                                            value : fqNameValue + cowc.DROPDOWN_VALUE_SEPARATOR + "virtual_network",
                                            id : fqNameValue + cowc.DROPDOWN_VALUE_SEPARATOR + "virtual_network",
                                            parent : "virtual_network" });
                              //}
                    	  }
                          addrFields.push({text : 'Virtual Networks', value : 'virtual_network', children : virtualNetworkList});
                    }
                    var anyList = [{text:'Select a Any',
                        value:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "any_workload",
                        id:"dummy" + cowc.DROPDOWN_VALUE_SEPARATOR + "any_workload",
                        disabled : true }];
                        anyList.push({text : 'ANY',
                        value : 'any' + cowc.DROPDOWN_VALUE_SEPARATOR + "any_workload",
                        id : 'any' + cowc.DROPDOWN_VALUE_SEPARATOR + "any_workload",
                        parent : "any_workload" });
                    addrFields.push({text : 'Any Workload', value : 'any_workload', children : anyList});
                    returnArr["addrFields"] = addrFields;
                    callback(returnArr);
                }
            )
        }
    });
    function tagDropDownFormatter(response){
        var matchList = [{text:'Application', id:'application' },
            {text:'Tier', id:'tier' },
            {text:'Deployment', id:'deployment' },
            {text:'Site', id:'site' }];
    	
        return matchList;
    };
    var getFwRuleViewConfig = function (isDisable, allData) {
    	var tagParam = {data: [{type: 'tags'}]};
    	return {
            elementId: ctwc.SEC_POLICY_SERVICE_GRP_PREFIX_ID,
            view: 'SectionView',
            title: "Firewall Rule",
            viewConfig: {
                rows: [
                    {
                        columns: [
                        	{
                                elementId: 'enable',
                                name:'Enable',
                                view: "FormCheckboxView",
                                viewConfig:
                                  {
                                       class: 'col-xs-6 no-label-input',
                                       label: 'Enable',
                                       path: "enable",
                                       dataBindValue: 'enable',
                                       templateId: cowc.TMPL_CHECKBOX_LABEL_RIGHT_VIEW,
                                       elementConfig : {
                                            label:'Enable',
                                            isChecked:false
                                        }
                                  }
                              }
                        ]
                    },
                    {
                        columns: [
                        	{
                                elementId: 'sequence',
                                name:'Order',
                                view: 'FormInputView',
                                viewConfig: {
                                    label: 'Order',
                                    placeholder: 'Enter Order',
                                    disabled: isDisable,
                                    path: 'sequence',
                                    class:'col-xs-6',
                                    dataBindValue: 'sequence'
                                }
                            },
                            {
                                elementId: 'simple_action',
                                name:'Action',
                                view: "FormDropdownView",
                                viewConfig: {
                                    label: 'Action',
                                    path: "simple_action",
                                    class:'col-xs-6',
                                    dataBindValue: "simple_action",
                                    elementConfig:{
                                        data:['pass','deny']
                                 }}
                             }
                        ]
                    },
                    {
                        columns: [
                        	  {
                                elementId: 'protocol',
                                name: 'Protocol',
                                view: "FormComboboxView",
                                class: "col-xs-6",
                                viewConfig: {
                                    label: 'Service',
                                    path: "protocol",
                                    class: "col-xs-6",
                                    dataBindValue: "protocol",
                                    elementConfig:{
                                        dataTextField: 'text',
                                        dataValueField: 'value',
                                        dataSource: {
                                            type: 'local',
                                            data:[{text:'tcp', value:'tcp' },
                                                  {text:'udp', value:'udp' },
                                                  {text:'icmp', value:'icmp' },
                                                  {text:'icmp6', value:'icmp6' }
                                                 ]
                                           }
                                       }
                                   }
                                },
                                {
                                    elementId: 'port',
                                    name:'Port',
                                    view: 'FormInputView',
                                    viewConfig: {
                                        label: 'Port',
                                        placeholder: '0-65535',
                                        path: 'port',
                                        class:'col-xs-6',
                                        dataBindValue: 'port'
                                    }
                                }
                        ]
                    },
                    {
                        columns: [
                        	{
                                elementId: 'endpoint_1',
                                view:"FormHierarchicalDropdownView",
                                name: 'End Point 1',
                                viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_MULTISELECT_VIEW,
                                    class:'col-xs-6',
                                    placeholder: 'Select Endpoint',
                                    path: 'endpoint_1',
                                    dataBindValue: 'endpoint_1',
                                    elementConfig: {
                                        //defaultValueId : 1,
                                        minimumResultsForSearch : 1,
                                        dataTextField: "text",
                                        dataValueField: "value",
                                        data: allData.addrFields,
                                        queryMap: [
                                            { name : 'Application',  value : 'application', iconClass:'fa fa-list-alt' },
                                            { name : 'Deployment',  value : 'deployment', iconClass:'fa fa-database' },
                                            { name : 'Site',  value : 'site', iconClass:'fa fa-life-ring' },
                                            { name : 'Tier',  value : 'tier', iconClass:'fa fa-clone' },
                                            { name : 'Address Group',  value : 'address_group', iconClass:'icon-contrail-network-ipam' },
                                            { name : 'Virtual Networks',  value : 'virtual_network', iconClass:'icon-contrail-virtual-network' },
                                            { name : 'Any Workload',  value : 'any_workload', iconClass:'fa fa-globe'}]
                                    }
                                }
                            }, {
                                elementId: 'direction',
                                name: 'Direction',
                                view: "FormDropdownView",
                                viewConfig: {
                                    label: 'Direction',
                                    class: "col-xs-6",
                                    path: "direction",
                                    dataBindValue: "direction",
                                    elementConfig:{
                                        data:['<>', '>']
                                    }}
                             }
                        ]
                    },
                    {
                        columns: [
                        	{
                                elementId: 'endpoint_2',
                                view:"FormHierarchicalDropdownView",
                                name: 'End Point 2',
                                viewConfig: {
                                    //templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                    class:'col-xs-6',
                                    placeholder: 'Select Endpoint',
                                    path: 'endpoint_1',
                                    dataBindValue: 'endpoint_2',
                                    elementConfig: {
                                        //defaultValueId : 1,
                                        minimumResultsForSearch : 1,
                                        dataTextField: "text",
                                        dataValueField: "value",
                                        data: allData.addrFields,
                                        queryMap: [
                                        	{ name : 'Application',  value : 'application', iconClass:'fa fa-list-alt' },
                                            { name : 'Deployment',  value : 'deployment', iconClass:'fa fa-database' },
                                            { name : 'Site',  value : 'site', iconClass:'fa fa-life-ring' },
                                            { name : 'Tier',  value : 'tier', iconClass:'fa fa-clone' },
                                            { name : 'Address Group',  value : 'address_group', iconClass:'icon-contrail-network-ipam' },
                                            { name : 'Virtual Networks',  value : 'virtual_network', iconClass:'icon-contrail-virtual-network' },
                                            { name : 'Any Workload',  value : 'any_workload', iconClass:'fa fa-globe' }]
                                    }
                                }
                            },
                            {
                                elementId: 'match_tags',
                                view: "FormMultiselectView",
                                viewConfig: {
                                    label: 'Match Tags',
                                    class: "col-xs-6",
                                    path: "match_tags",
                                    dataBindValue: "match_tags",
                                    elementConfig:{
                                        dataTextField: "text",
                                        placeholder:"Select Tag Type",
                                        dataValueField: "id",
                                        separator: cowc.DROPDOWN_VALUE_SEPARATOR,
                                        dataSource: {
                                            type: "remote",
                                            requestType: "POST",
                                            url: "/api/tenants/config/get-config-details",
                                            postData: JSON.stringify(tagParam),
                                            parse : tagDropDownFormatter
                                        }
                                     }
                                }
                           }                            
                        ]
                    }/*,
                    {
                        columns: [{
                            elementId: 'match_tags',
                            view: "FormMultiselectView",
                            viewConfig: {
                            	label: 'Match Tags',
                                class: "col-xs-12",
                                path: "match_tags",
                                dataBindValue: "match_tags",
                                elementConfig:{
                                    dataTextField: "text",
                                    placeholder:"Select Tag Type",
                                    dataValueField: "id",
                                    separator: cowc.DROPDOWN_VALUE_SEPARATOR,
                                    dataSource: {
                                        type: "remote",
                                        requestType: "POST",
                                        url: "/api/tenants/config/get-config-details",
                                        postData: JSON.stringify(tagParam),
                                        parse : tagDropDownFormatter
                                    }
                                 }
                            }
                       }]
                     }*/
                ]
            }
        }
    };

    return fwRuleEditView;
});