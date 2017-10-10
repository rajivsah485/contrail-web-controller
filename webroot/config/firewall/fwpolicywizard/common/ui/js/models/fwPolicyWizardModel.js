/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-config-model',
    'config/firewall/fwpolicywizard/common/ui/js/views/fwPolicyWizard.utils',
    'core-basedir/js/models/RBACPermsShareModel',
    'config/firewall/common/fwpolicy/ui/js/models/fwRuleCollectionModel',
    'config/networking/policy/ui/js/views/policyFormatters'
], function (_, ContrailConfigModel, FWZUtils, RBACPermsShareModel, RuleModel, PolicyFormatters) {
    var self;
    var fwzUtils = new FWZUtils();
    var policyFormatters = new PolicyFormatters();
    var fwPolicyWizardModel = ContrailConfigModel.extend({
        defaultConfig: {
            'name': '',
            'Application': '',
            'description': '',
            'policy_name': '',
            'policy_description': '',
            "firewall_rules": [],
            "perms2": {
                "owner": "",
                "owner_access": "",
                "global_access": "",
                "share": []
            }, 
            'onNext': false
        },
        formatModelConfig: function(modelConfig) {
            self = this;
            var shareModel, shareModelCol = [], share, fwRuleModel, fwRuleModelCol = [];
            modelConfig["firewall_rules"] = new Backbone.Collection(fwRuleModelCol);
            var tagRef = getValueByJsonPath(modelConfig, 'tag_refs', []), tagList = [],
            description = getValueByJsonPath(modelConfig, 'id_perms;description', '');
            if((modelConfig["perms2"]["owner_access"] != "") || (modelConfig["perms2"]["global_access"] != "")) {
                modelConfig["perms2"]["owner_access"] =
                    fwzUtils.formatAccessList(modelConfig["perms2"]["owner_access"]);
                modelConfig["perms2"]["global_access"] =
                    fwzUtils.formatAccessList(modelConfig["perms2"]["global_access"]);
                modelConfig["owner_visible"] = true;
            } else {//required for create case
                modelConfig["perms2"] = {};
                modelConfig["perms2"]["owner_access"] = "4,2,1";
                modelConfig["perms2"]["global_access"] = "";
                modelConfig["owner_visible"] = false;
            }
            share = getValueByJsonPath(modelConfig,
                    "perms2;share", []);
            _.each(share, function(s){
                shareModel = new RBACPermsShareModel({
                    tenant : s.tenant,
                    tenant_access: self.formatAccessList(s.tenant_access)
                });
                shareModelCol.push(shareModel);
            });
            modelConfig["share_list"] =
                new Backbone.Collection(shareModelCol);
            _.each(tagRef, function(tag) {
                var to = tag.to.join(':');
                tagList.push(to);;
            });
            if(tagList.length > 0){
                modelConfig['Application'] = tagList.join(',');
            }
            if(description !== ''){
                modelConfig['description'] = description;
            }
            return modelConfig;
        },
        addRule: function() {
            var rulesList = this.model().attributes['firewall_rules'],
                newRuleModel = new RuleModel();
            this.showHideServiceInstance(newRuleModel);
            rulesList.add([newRuleModel]);
        },
        addRuleByIndex: function(data,rules) {
            var selectedRuleIndex = data.model().collection.indexOf(rules.model());
            var rulesList = this.model().attributes['firewall_rules'],
                newRuleModel = new RuleModel();
            this.showHideServiceInstance(newRuleModel);

            rulesList.add([newRuleModel],{at: selectedRuleIndex+1});
        },
        deleteRules: function(data, rules) {
            var rulesCollection = data.model().collection,
                delRule = rules.model();
            rulesCollection.remove(delRule);
        },
        showHideServiceInstance: function(ruleModels) {
            ruleModels.showService = ko.computed((function() {
                if (this.apply_service_check() == true) {
                        this.direction("<>");
                        this.simple_action("PASS");
                        return true;
                } else {
                    return false;
                }
            }), ruleModels);
            ruleModels.showMirror = ko.computed((function(){
                if (this.mirror_to_check() == true) {
                    this.protocol("ANY");
                    this.src_ports_text("ANY");
                    this.dst_ports_text("ANY");
                    return (this.mirror_to_check);
                } else {
                    return false;
                }
            }), ruleModels);
        },
        validations: {
            applicationPolicyValidation: {
                'name': {
                    required: true,
                    msg: 'Enter a valid Application Policy Set.'
                }
            },
            policyValidation: {
                'policy_name': {
                    required: true,
                    msg: 'Enter Firewall Policy Name.'
                }
            }
        },
        getFormatedService : function(selectedData, list){
            var svcListRef = [], service = {};
            for(var i = 0; i < list.length; i++){
                if(list[i].text === selectedData){
                    svcListRef.push(list[i].fq_name);
                    break;
                }
            }
            if(svcListRef.length > 0){
                service['service_group_refs'] = [{to:svcListRef[svcListRef.length - 1]}];
                service['isServiceGroup'] = true;
            }else{
                var ports = selectedData.split(':');
                if(ports.length === 2) {
                    service['service'] = {};
                    service['service']['protocol'] = ports[0];
                    service['service']['dst_ports'] =
                        policyFormatters.formatPort(ports[1])[0];
                    service['service']['src_ports'] =
                        policyFormatters.formatPort('0-65535')[0];
                    service['isServiceGroup'] = false;
                }else{
                    service['isServiceGroup'] = false;
                }
            }
        return service;
        },
        populateEndpointData : function(inputAddress) {
            var self = this;
            var selectedDomain = contrail.getCookie(cowc.COOKIE_DOMAIN_DISPLAY_NAME);
            var selectedProject = contrail.getCookie(cowc.COOKIE_PROJECT_DISPLAY_NAME);
            var srcArrs = inputAddress.split(',');//If multiple selected.
            endpoint  = {};
            endpoint["virtual_network"] = null;
            //endpoint["security_group"] = null;
            endpoint["address_group"] = null;
            endpoint["any"] = null;
            endpoint["tags"] = [];
            for(var i = 0 ; i < srcArrs.length; i++) {
                var srcArr = srcArrs[i].split(cowc.DROPDOWN_VALUE_SEPARATOR),
                    vnSubnetObj, subnet, endpoint;
                //tags
                if(srcArr.length == 2 && (srcArr[1] === 'Application' ||
                        srcArr[1] === 'Deployment' ||  srcArr[1] === 'Site' ||
                        srcArr[1] === 'Tier'|| srcArr[1] === 'label')) {
                    endpoint["tags"].push(srcArr[0]);
                } else if(srcArr.length == 2 && srcArr[1] === 'address_group'){
                    endpoint[srcArr[1]] = srcArr[0];
                } else if(srcArr.length == 2 && srcArr[1] === 'virtual_network'){
                    endpoint[srcArr[1]] = self.getPostAddressFormat(srcArr[0], selectedDomain, selectedProject)
                } else if(srcArr.length == 2 && srcArr[1] === 'any_workload') {
                    endpoint["any"] = true;
                }
            }
            return endpoint;
        },
        getPostAddressFormat: function(arr, selectedDomain, selectedProject) {
            var array = arr.split(":");
            var returnval = null;
            if (array.length == 1) {
                if (String(array[0]).toLowerCase() != "any" &&
                    String(array[0]).toLowerCase() != "local") {
                    returnval = selectedDomain + ":" +
                                selectedProject + ":" +
                                array[0];
                } else {
                    returnval = array[0].toLowerCase();
                }
            } else if(array.length == 3) {
                returnval = arr;
            }
            return returnval;
        },
        addEditApplicationSet: function (callbackObj, options, firstStep, serviceGroupList) {
            var ajaxConfig = {}, returnFlag = true,updatedVal = {}, postFWRuleData = {};
            var postFWPolicyData = {}, newFWPolicyData, attr;
            var updatedModel = {},policyList = [];
            var self = this;
            var firstStepValidations = [
                {
                    key : null,
                    type : cowc.OBJECT_TYPE_MODEL,
                    getValidation : "applicationPolicyValidation"
                }];
            if(firstStep){
                if (self.isDeepValid(firstStepValidations)) {
                    var model = $.extend(true,{},this.model().attributes);
                    var gridElId = '#' + ctwc.FW_WZ_POLICY_GRID_ID;
                    var selectedRows = $(gridElId).data("contrailGrid")._dataView.getItems();
                    for(var j = 0; j < selectedRows.length;j++){
                                var obj = {};
                                var to = selectedRows[j].fq_name;
                                obj.to = to;
                                obj.attr = {};
                                obj.attr.sequence = j.toString();
                                policyList.push(obj);
                            }
                        updatedModel.fq_name = [];
                        if(options.viewConfig.isGlobal) {
                            updatedModel.fq_name.push('default-policy-management');
                            updatedModel.fq_name.push(model.name);
                            updatedModel.parent_type = 'policy-management';
                        } else {
                            updatedModel.fq_name.push(
                                    contrail.getCookie(cowc.COOKIE_DOMAIN_DISPLAY_NAME));
                            updatedModel.fq_name.push(
                                    contrail.getCookie(cowc.COOKIE_PROJECT_DISPLAY_NAME));
                            updatedModel.fq_name.push(model.name);
                            updatedModel.parent_type = 'project';
                        }
                        updatedModel.name = model.name;
                        this.updateRBACPermsAttrs(model);
                        updatedModel.tag_refs = model.tag_refs;
                        updatedModel.firewall_policy_refs = policyList;
                        if (options.viewConfig.mode == 'add') {
                            var obj = {};
                            obj.description = model.description;
                            updatedModel.id_perms = obj;
                            var postData = {"data":[{"data":{"application-policy-set": updatedModel},
                                        "reqUrl": "/application-policy-sets"}]};
                            ajaxConfig.url = ctwc.URL_CREATE_CONFIG_OBJECT;
                        } else {
                            delete(updatedModel.name);
                            model.id_perms.description = model.description;
                            updatedModel['id_perms'] = model.id_perms;
                            var postData = {"data":[{"data":{"application-policy-set": updatedModel},
                                        "reqUrl": "/application-policy-set/" +
                                        model.uuid}]};
                            ajaxConfig.url = ctwc.URL_UPDATE_CONFIG_OBJECT;
                        }
                        ajaxConfig.type  = 'POST';
                        ajaxConfig.data  = JSON.stringify(postData);
                        contrail.ajaxHandler(ajaxConfig, function () {
                            if (contrail.checkIfFunction(callbackObj.init)) {
                                callbackObj.init();
                            }
                        }, function (response) {
                            if (contrail.checkIfFunction(callbackObj.success)) {
                                callbackObj.success();
                            }
                            returnFlag = true;
                        }, function (error) {
                            if (contrail.checkIfFunction(callbackObj.error)) {
                                callbackObj.error(error);
                            }
                            returnFlag = false;
                        });
                      return returnFlag;
                }else{
                    if (contrail.checkIfFunction(callbackObj.error)) {
                        callbackObj.error(this.getFormErrorText(ctwc.FIREWALL_APPLICATION_POLICY_PREFIX_ID));
                    }
                }
            }else{
               var fwRules = this.model().attributes.firewall_rules ?
                        this.model().attributes.firewall_rules.toJSON(): [],
                postFWRules = [];
                _.each(fwRules, function(rule) {
                        var attr = $.extend(true, {}, rule.model().attributes),
                            newFWRuleData = {};
                        attr.name = UUIDjs.create().hex;
                        if(options.viewConfig.isGlobal) {
                            newFWRuleData["fq_name"] =
                                [
                                  "default-policy-management",
                                  attr.name
                                ];
                            newFWRuleData['parent_type'] = "policy-management";
                        } else {
                            newFWRuleData["fq_name"] =
                                [
                                  contrail.getCookie(cowc.COOKIE_DOMAIN_DISPLAY_NAME),
                                  contrail.getCookie(cowc.COOKIE_PROJECT_DISPLAY_NAME),
                                  attr.name
                                ];
                            newFWRuleData['parent_type'] = "project";
                        }
                        newFWRuleData['name'] = attr.name;
                        newFWRuleData['uuid'] = attr.name;
                        newFWRuleData['endpoint_1'] = self.populateEndpointData(attr['endpoint_1']);
                        newFWRuleData['endpoint_2'] = self.populateEndpointData(attr['endpoint_2']);
                        if(attr['user_created_service'] !== ''){
                            var getSelectedService = self.getFormatedService(attr['user_created_service'], serviceGroupList);
                            if(getSelectedService.isServiceGroup){
                                newFWRuleData['service_group_refs'] = getSelectedService['service_group_refs'];
                            }else{
                                if(getSelectedService['service'] !== undefined){
                                    newFWRuleData['service'] = getSelectedService['service'];
                                }
                            }
                        }
                        newFWRuleData['action_list'] = {};
                        newFWRuleData['action_list']['simple_action'] = attr['simple_action'];
                        newFWRuleData['direction'] = attr['direction'];
                        newFWRuleData['match_tags'] = {};
                        newFWRuleData['id_perms'] = {};
                        newFWRuleData['id_perms']["enable"] = attr["status"];
                        newFWRuleData['match_tags']['tag_list'] =
                            attr.match_tags ? attr.match_tags.split(',') : [];
                        postFWRules.push({'firewall-rule': $.extend(true, {}, newFWRuleData)});
                    });

                    postFWRuleData['firewall-rules'] = postFWRules;
                    
                    attr = this.model().attributes;
                    newFWPolicyData = $.extend(true, {}, attr);

                    if(options.viewConfig.isGlobal) {
                        newFWPolicyData["fq_name"] =
                            [
                              "default-policy-management",
                               newFWPolicyData["policy_name"]
                            ];
                        newFWPolicyData['parent_type'] = "policy-management";
                    } else {
                        newFWPolicyData["fq_name"] =
                            [
                              contrail.getCookie(cowc.COOKIE_DOMAIN_DISPLAY_NAME),
                              contrail.getCookie(cowc.COOKIE_PROJECT_DISPLAY_NAME),
                              newFWPolicyData["policy_name"]
                            ];
                        newFWPolicyData['parent_type'] = "project";
                    }
                    this.updateRBACPermsAttrs(newFWPolicyData);

                    ctwu.deleteCGridData(newFWPolicyData);
                    var obj = {};
                    obj.description = newFWPolicyData.policy_description;
                    newFWPolicyData['id_perms'] = obj;
                    newFWPolicyData['firewall_rules'] = [];
                    newFWPolicyData['name'] =  newFWPolicyData["policy_name"];
                    newFWPolicyData["display_name"] = newFWPolicyData["policy_name"];
                    delete newFWPolicyData.policy_description;
                    delete newFWPolicyData.policy_name;
                    delete newFWPolicyData.description;
                    delete newFWPolicyData.onNext;
                    postFWPolicyData['firewall-policy'] = newFWPolicyData;

                    postFWPolicyData = {"data":[{"data": postFWPolicyData,
                                    "reqUrl": ctwc.URL_CREATE_FW_POLICY}]};
                        ajaxConfig.url = ctwc.URL_CREATE_CONFIG_OBJECT;
                    
                    ajaxConfig.async = false;
                    ajaxConfig.type  = "POST";
                    ajaxConfig.data  = JSON.stringify(postFWPolicyData);
                    
                    contrail.ajaxHandler(ajaxConfig, function () {
                        if (contrail.checkIfFunction(callbackObj.init)) {
                            callbackObj.init();
                        }
                    }, function (response) {
                        var fwPolicyId = getValueByJsonPath(response,
                                '0;firewall-policy;uuid', '');
                        self.addPolicyRules(fwPolicyId, postFWRuleData, callbackObj, options);
                        
                        
                    }, function (error) {
                        if (contrail.checkIfFunction(callbackObj.error)) {
                            callbackObj.error(error);
                        }
                        returnFlag = false;
                    });
            }
        },
        addPolicyRules: function (fwPolicyId, postFWRuleData, callbackObj, options){
            var ajaxConfig = {};
            postFWRuleData['fwPolicyId'] = fwPolicyId;
            ajaxConfig.async = false;
            ajaxConfig.url = ctwc.URL_CREATE_POLICY_RULES;
            ajaxConfig.type  = "POST";
            ajaxConfig.data  = JSON.stringify(postFWRuleData);

            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function (response) {
                if(Object.keys(newApplicationSet).length > 0){
                    if(response == null){
                        self.callPolicyList(fwPolicyId, self, callbackObj, options);
                    }else{
                        self.callPolicyList(response[0].uuid, self, callbackObj, options); 
                    }
                }else{
                    if (contrail.checkIfFunction(callbackObj.success)) {
                        callbackObj.success();
                    }
                }
            }, function (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
                returnFlag = false;
            })
        },
        callPolicyList : function(policyUUID, self, callbackObj, options){
            var getAjaxs = [];
            getAjaxs[0] = $.ajax({
                url:"/api/tenants/config/get-config-details",
                type:"POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(
                        {data: [{type: 'firewall-policys',
                            fields: ['application_policy_set_back_refs']}]})
            });
            $.when.apply($, getAjaxs).then(function(){
                var fwPolicyData = getValueByJsonPath(arguments, "0;0;firewall-policys", []);
                var policyList = [], sequenceCount = '0';
                if(newApplicationSet.existingRows.length > 0){
                    sequenceCount = newApplicationSet.existingRows.length.toString();
                }
                _.each(fwPolicyData, function(val){
                        if('firewall-policy' in val){
                            if(val['firewall-policy'].uuid === policyUUID){
                                var obj = {};
                                var to = val['firewall-policy'].fq_name;
                                obj.to = to;
                                obj.attr = {};
                                obj.attr.sequence = sequenceCount;
                                policyList.push(obj);
                            }
                       }
                });
                if(newApplicationSet.existingRows.length > 0){
                    var existingRows = newApplicationSet.existingRows;
                    var existingPolicy = [];
                    for(var m = 0; m < existingRows.length; m++){
                        var obj = {};
                        var to = existingRows[m].fq_name;
                        obj.to = to;
                        obj.attr = {};
                        obj.attr.sequence = m.toString();
                        existingPolicy.push(obj);
                    }
                    var newPolicyList = existingPolicy.concat(policyList);
                    self.addApplicationPolicySet(newPolicyList, callbackObj, options);
                }else{
                    self.addApplicationPolicySet(policyList, callbackObj, options);
                }
            })
        },
        deleteApplicationPolicy: function (checkedRows, callbackObj) {
            var ajaxConfig = {};
            var uuidList = [];

            $.each(checkedRows, function (checkedRowsKey, checkedRowsValue) {
                uuidList.push(checkedRowsValue.uuid);
            });

            ajaxConfig.type = "POST";
            ajaxConfig.data = JSON.stringify([{'type': 'application-policy-set',
                                              'deleteIDs': uuidList}]);

            ajaxConfig.url = '/api/tenants/config/delete';
            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function (response) {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
            }, function (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
            });
        },
        addApplicationPolicySet : function(policyList, callbackObj, options){
            var updatedModel = {}, ajaxConfig = {};
            var model = newApplicationSet;
            updatedModel.fq_name = [];
            if(options.viewConfig.isGlobal) {
                updatedModel.fq_name.push('default-policy-management');
                updatedModel.fq_name.push(model.name);
                updatedModel.parent_type = 'policy-management';
            } else {
                updatedModel.fq_name.push(
                        contrail.getCookie(cowc.COOKIE_DOMAIN_DISPLAY_NAME));
                updatedModel.fq_name.push(
                        contrail.getCookie(cowc.COOKIE_PROJECT_DISPLAY_NAME));
                updatedModel.fq_name.push(model.name);
                updatedModel.parent_type = 'project';
            }
            updatedModel.name = model.name;
            this.updateRBACPermsAttrs(model);
            updatedModel.tag_refs = model.tag_refs;
            updatedModel.firewall_policy_refs = policyList;
            if (model.uuid === undefined) {
                var obj = {};
                obj.description = model.description;
                updatedModel.id_perms = obj;
                var postData = {"data":[{"data":{"application-policy-set": updatedModel},
                            "reqUrl": "/application-policy-sets"}]};
                ajaxConfig.url = ctwc.URL_CREATE_CONFIG_OBJECT;
            } else {
                delete(updatedModel.name);
                model.id_perms.description =  model.description;
                updatedModel['id_perms'] = model.id_perms;
                var postData = {"data":[{"data":{"application-policy-set": updatedModel},
                            "reqUrl": "/application-policy-set/" +
                            model.uuid}]};
                ajaxConfig.url = ctwc.URL_UPDATE_CONFIG_OBJECT;
            }
            ajaxConfig.type  = 'POST';
            ajaxConfig.data  = JSON.stringify(postData);
            contrail.ajaxHandler(ajaxConfig, function () {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
            }, function (response) {
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
                returnFlag = true;
            }, function (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(error);
                }
                returnFlag = false;
            });
        }
    });
    function polRefFormatter (dc) {
        var polArr = [];
        var pols   =
            getValueByJsonPath(dc, 'firewall_policy_refs', []);

        if (!pols.length) {
            return '-';
        }

        var sortedPols =
         _.sortBy(pols, function (pol) {
             var sequence =
                Number(getValueByJsonPath(pol, 'attr;sequence', 0));
             return ((1 + sequence) * 100000 ) - sequence;
        });

        pLen = pols.length;

        $.each(sortedPols,
            function (i, obj) {
                polArr.push(obj.to.join(':'));
            }
        );

        return polArr;
    };
    return fwPolicyWizardModel;
});
