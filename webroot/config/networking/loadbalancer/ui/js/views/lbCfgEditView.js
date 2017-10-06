/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'knockback',
    'config/networking/loadbalancer/ui/js/views/lbCfgFormatters'],
    function (_, ContrailView, Knockback, LbCfgFormatters) {
    var lbCfgFormatters = new LbCfgFormatters();
    var gridElId = '#' + ctwl.CFG_LB_GRID_ID;
    var prefixId = ctwl.CFG_LB_PREFIX_ID;
    var modalId = 'configure-' + prefixId;

    var lbCfgEditView = ContrailView.extend({
        renderAddLb: function (options) {
            var editTemplate =
                contrail.getTemplate4Id(cowc.TMPL_EDIT_FORM);
            var editLayout = editTemplate({prefixId: prefixId}),
                self = this;

            cowu.createModal({'modalId': modalId, 'className': 'modal-980',
                             'title': options['title'], 'body': editLayout,
                             'onSave': function () {
                                 var wizardId = cowu.formatElementId([prefixId, ctwl.TITLE_CREATE_FW_POLICY]),
                                 wizardDataContrailWizard = $("#" + wizardId).data("contrailWizard"),
                                 currentStepIndex = wizardDataContrailWizard.getCurrentIndex(),
                                 stepsLength = wizardDataContrailWizard.getStepsLength();

                                 if(currentStepIndex == (stepsLength - 1)) {
                                     wizardDataContrailWizard.finish();
                                 } else {
                                     wizardDataContrailWizard.next();
                                 }
            }, 'onCancel': function () {
                Knockback.release(self.model,
                                    document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).find(".contrailWizard").data("contrailWizard").destroy();
                $("#" + modalId).modal("hide");
            }});
            self.renderView4Config($("#" + modalId).find("#" + prefixId + "-form"),
                        self.model, getLoadBalancerViewConfig(self.model, options),
                        '', null, null,
                        function() {
                    if (!contrail.checkIfKnockoutBindingExist(modalId)) {
                        self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID, false);
                        Knockback.applyBindings(self.model, document.getElementById(modalId));
                        kbValidation.bind(self);
                    }
             });
        }
    });
    function getLoadBalancerControl(options){
        return {
                rows: [
                    {
                        columns: [
                            {
                                elementId: "name",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "name",
                                    dataBindValue: "name",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: "description",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "description",
                                    dataBindValue: "description",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    }, {
                        columns: [
                                  {
                                      elementId: "ip_address",
                                      view: "FormInputView",
                                      viewConfig: {
                                          path: "ip_address",
                                          dataBindValue: "ip_address",
                                          class: "col-xs-6"
                                      }
                                  },
                                  {
                                      elementId: 'lb_subnet',
                                      view: "FormDropdownView",
                                      viewConfig: {
                                          label: 'Subnet',
                                          path : 'lb_subnet',
                                          class: 'col-xs-6',
                                          dataBindValue :
                                              'lb_subnet',
                                          elementConfig : {
                                              dataTextField : "text",
                                              dataValueField : "id",
                                              placeholder : 'Select Subnet',
                                              data : [{id: 'c4b529b7-87ae-4ec3-8c17-a592c3a45dcb', text:'c4b529b7-87ae-4ec3-8c17-a592c3a45dcb'},
                                                      {id: 'd800a8fb-3d7e-4ecf-a0a6-e19f6701dfc5', text:'d800a8fb-3d7e-4ecf-a0a6-e19f6701dfc5'}]
                                          }
                                      }
                                  }
                              ]
                      }
                ]
            }
    }
    
    function getListenerControl(options){
       return {
                rows: [
                    {
                        columns: [
                            {
                                elementId: "listener_name",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "listener_name",
                                    label: 'Name',
                                    dataBindValue: "listener_name",
                                    class: "col-xs-6"
                                }
                            },
                            {
                                elementId: "listener_description",
                                view: "FormInputView",
                                viewConfig: {
                                    path: "listener_description",
                                    label: 'Description',
                                    dataBindValue: "listener_description",
                                    class: "col-xs-6"
                                }
                            }
                        ]
                    }, {
                        columns: [
                                {
                                    elementId: 'listener_protocol',
                                    view: "FormDropdownView",
                                    viewConfig: {
                                        label: 'Protocol',
                                        path : 'listener_protocol',
                                        class: 'col-xs-6',
                                        dataBindValue :
                                            'listener_protocol',
                                        elementConfig : {
                                            dataTextField : "text",
                                            dataValueField : "id",
                                            placeholder : 'Select Subnet',
                                            data : [{id: 'HTTP', text:'HTTP'},
                                                    {id: 'TCP', text:'TCP'}]
                                        }
                                    }
                                },
                                {
                                    elementId: "listener_port",
                                    view: "FormInputView",
                                    viewConfig: {
                                        path: "listener_port",
                                        label: 'Port',
                                        dataBindValue: "listener_port",
                                        class: "col-xs-6"
                                    }
                                }
                              ]
                      }
                ]
            }
    }
    function getPoolControl(options){
        return {
                 rows: [
                     {
                         columns: [
                             {
                                 elementId: "pool_name",
                                 view: "FormInputView",
                                 viewConfig: {
                                     path: "pool_name",
                                     label: 'Name',
                                     dataBindValue: "pool_name",
                                     class: "col-xs-6"
                                 }
                             },
                             {
                                 elementId: "pool_description",
                                 view: "FormInputView",
                                 viewConfig: {
                                     path: "pool_description",
                                     label: 'Description',
                                     dataBindValue: "pool_description",
                                     class: "col-xs-6"
                                 }
                             }
                         ]
                     }, {
                         columns: [
                                 {
                                     elementId: 'pool_method',
                                     view: "FormDropdownView",
                                     viewConfig: {
                                         label: 'Method',
                                         path : 'pool_method',
                                         class: 'col-xs-6',
                                         dataBindValue :
                                             'pool_method',
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
                       }
                 ]
             }
     }
    function getMonitorControl(options){
        return {
                 rows: [
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
                                         placeholder : 'Select Method',
                                         data : [{id: 'HTTP', text:'HTTP'},
                                                 {id: 'PING', text:'PING'},{id: 'TCP', text:'TCP'}]
                                     }
                                 }
                             },
                             {
                                 elementId: "health_check_interval",
                                 view: "FormInputView",
                                 viewConfig: {
                                     path: "health_check_interval",
                                     label: 'Health check interval (sec)',
                                     dataBindValue: "health_check_interval",
                                     class: "col-xs-6"
                                 }
                             }
                         ]
                     },
                     {
                         columns: [
                             {
                                 elementId: "retry_count",
                                 view: "FormInputView",
                                 viewConfig: {
                                     path: "retry_count",
                                     label: 'Retry count before markdown',
                                     dataBindValue: "retry_count",
                                     class: "col-xs-6"
                                 }
                             },
                             {
                                 elementId: "timeout",
                                 view: "FormInputView",
                                 viewConfig: {
                                     path: "timeout",
                                     label: 'Timeout (sec)',
                                     dataBindValue: "timeout",
                                     class: "col-xs-6"
                                 }
                             }
                         ]
                     }
                 ]
             }
     }
    function getPoolMemberControl(options){
        return {
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
                                    elementId: "pool_member_ip_address",
                                    view: "FormInputView",
                                    name: 'IP Address',
                                    width: 200,
                                    viewConfig: {
                                        path: "pool_member_ip_address",
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
                                            data : [{id: 'c4b529b7-87ae-4ec3-8c17-a592c3a45dcb', text:'c4b529b7-87ae-4ec3-8c17-a592c3a45dcb'},
                                                    {id: 'd800a8fb-3d7e-4ecf-a0a6-e19f6701dfc5', text:'d800a8fb-3d7e-4ecf-a0a6-e19f6701dfc5'}]
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
            };
     }
    function getCreateLBViewConfig(lbModel, options) {
        var gridPrefix = "add-loadbalancer",
            addLBViewConfig = {
            elementId:  cowu.formatElementId([prefixId, ctwl.CFG_LB_TITLE]),
            view: "WizardView",
            viewConfig: {
                steps: [
                    {
                        elementId:  cowu.formatElementId([prefixId, ctwl.CFG_LB_TITLE]),
                        title: ctwl.CFG_LB_TITLE,
                        view: "SectionView",
                        viewConfig: getLoadBalancerControl(options),
                        stepType: "step",
                        onInitRender: true,
                        buttons: {
                            previous: {
                                visible: false
                            }
                        },
                        onNext: function(params) {
                            return true;
                        }
                    }
                ]
            }
        };
        return addLBViewConfig;
    }
    
    function getCreateListenerViewConfig(lbModel, options) {
        var gridPrefix = "add-listener",
            addListenerViewConfig = {
            elementId:  cowu.formatElementId([prefixId, 'listener']),
            view: "WizardView",
            viewConfig: {
                steps: [
                    {
                        elementId:  cowu.formatElementId([prefixId, 'listener']),
                        title: 'listener',
                        view: "SectionView",
                        viewConfig: getListenerControl(options),
                        stepType: "step",
                        onInitRender: true,
                        buttons: {
                            previous: {
                                visible: true
                            }
                        },
                        onNext: function(params) {
                            return true;
                        },
                        onPrevious: function(params) {
                            return true;
                        }
                    }
                ]
            }
        };
        return addListenerViewConfig;
    }
    
    function getCreatePoolViewConfig(lbModel, options) {
        var gridPrefix = "add-pool",
            addPoolViewConfig = {
            elementId:  cowu.formatElementId([prefixId, 'pool']),
            view: "WizardView",
            viewConfig: {
                steps: [
                    {
                        elementId:  cowu.formatElementId([prefixId, 'pool']),
                        title: 'pool',
                        view: "SectionView",
                        viewConfig: getPoolControl(options),
                        stepType: "step",
                        onInitRender: true,
                        buttons: {
                            previous: {
                                visible: true
                            }
                        },
                        onNext: function(params) {
                            return true;
                        },
                        onPrevious: function(params) {
                            return true;
                        }
                    }
                ]
            }
        };
        return addPoolViewConfig;
    }
    
    function getCreatePoolMemberViewConfig(lbModel, options) {
        var gridPrefix = "add-poolmember",
            addPoolViewConfig = {
            elementId:  cowu.formatElementId([prefixId, 'poolmember']),
            view: "WizardView",
            viewConfig: {
                steps: [
                    {
                        elementId:  cowu.formatElementId([prefixId, 'poolmember']),
                        title: 'pool Member',
                        view: "SectionView",
                        viewConfig: getPoolMemberControl(options),
                        stepType: "step",
                        onInitRender: true,
                        buttons: {
                            previous: {
                                visible: true
                            }
                        },
                        onNext: function(params) {
                            return true;
                        },
                        onPrevious: function(params) {
                            return true;
                        }
                    }
                ]
            }
        };
        return addPoolViewConfig;
    }
    function getCreateMonitorViewConfig(lbModel, options) {
        var gridPrefix = "add-monitor",
            addPoolViewConfig = {
            elementId:  cowu.formatElementId([prefixId, 'monitor']),
            view: "WizardView",
            viewConfig: {
                steps: [
                    {
                        elementId:  cowu.formatElementId([prefixId, 'monitor']),
                        title: 'Monitor',
                        view: "SectionView",
                        viewConfig: getMonitorControl(options),
                        stepType: "step",
                        onInitRender: true,
                        buttons: {
                            previous: {
                                visible: true
                            }
                        },
                        onNext: function(params) {
                            return true;
                        },
                        onPrevious: function(params) {
                            return true;
                        }
                    }
                ]
            }
        };
        return addPoolViewConfig;
    }
    function getLoadBalancerViewConfig(lbModel, options) {
        var addLB1ViewConfig = {
                elementId: cowu.formatElementId([prefixId, 'loadbalancer_wizard']),
                view: "WizardView",
                viewConfig: {
                    steps: []
                }
            },
            steps = [],
            createLB = null,
            createListener = null,
            createPool = null,
            createPoolMembers = null,
            createMoniter = null;

        
        /*
            Appending create LB Steps
         */
        createLB = $.extend(true, {}, getCreateLBViewConfig(lbModel, options).viewConfig).steps;

        createLB[0].title = 'Load Balancer';
        createLB[0].onPrevious = function() {
            return false;
        };
        createLB[0].buttons = {
            next: {
                label:'Next'
            },
            previous: {
                visible: false,
                label:'Previous'
            }
        };
        steps = steps.concat(createLB);
        
        /*
           Appending create Listener Steps
        */
        createListener = $.extend(true, {}, getCreateListenerViewConfig(lbModel, options).viewConfig).steps;
    
        createListener[0].title = 'Listener';
        createListener[0].onPrevious = function() {
            return true;
        };
        createListener[0].buttons = {
            next: {
                label:'Next'
            },
            previous: {
                visible: true,
                label:'Previous'
            }
        };
        steps = steps.concat(createListener);
        
        /*
          Appending create Pool Steps
        */
         createPool = $.extend(true, {}, getCreatePoolViewConfig(lbModel, options).viewConfig).steps;
 
         createPool[0].title = 'Pool';
         createPool[0].onPrevious = function() {
           return true;
         };
         createPool[0].buttons = {
             next: {
                 label:'Next'
             },
             previous: {
                 visible: true,
                 label:'Previous'
             }
         };
         steps = steps.concat(createPool);
         
         /*
          Appending create Pool Steps
         */
         createPoolMembers = $.extend(true, {}, getCreatePoolMemberViewConfig(lbModel, options).viewConfig).steps;

         createPoolMembers[0].title = 'Pool Member';
         createPoolMembers[0].onPrevious = function() {
          return true;
        };
        createPoolMembers[0].buttons = {
            next: {
                label:'Next'
            },
            previous: {
                visible: true,
                label:'Previous'
            }
        };
        steps = steps.concat(createPoolMembers);

        /*
        Appending create Pool Steps
       */
        createMoniter = $.extend(true, {}, getCreateMonitorViewConfig(lbModel, options).viewConfig).steps;

        createMoniter[0].title = 'Monitor';
        createMoniter[0].onPrevious = function() {
        return true;
      };
      createMoniter[0].buttons = {
          next: {
              label:'Next'
          },
          previous: {
              visible: true,
              label:'Previous'
          }
      };
      steps = steps.concat(createMoniter);
      addLB1ViewConfig.viewConfig.steps = steps;

      return addLB1ViewConfig;
    }
    return lbCfgEditView;
});
