/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 *
 */

define([
    'underscore'
], function (_) {
    var lbCfgFormatters = function() {
        var self = this;

        this.setPostUrlData = function (options) {
            var type = options.type;
            var fields = options.fields;
            var parent_id = options.parentId;
            var postData = {
               "data" : [ {
                   "type" : type
               } ]
            }
            if(fields != null && fields.length > 0) {
                postData['data'][0]['fields'] = fields;
            }
            if(parent_id != null && parent_id.length > 0) {
                postData['data'][0]['parent_id'] = parent_id;
            }
            return JSON.stringify(postData);
        };

        this.descriptionFormatter = function(d, c, v, cd, dc) {
            var description = getValueByJsonPath(dc, 'loadbalancer;id_perms;description', '');
            if (description !== '') {
                return description;
            }else{
                return '-'; 
            } 
        };

        this.operatingStatusFormatter = function(d, c, v, cd, dc) {
            var status = getValueByJsonPath(dc, 'loadbalancer;loadbalancer_properties;operating_status', '');
            if (status !== '') {
                if(status === 'ONLINE'){
                    return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                    'ONLINE'); 
                }else{
                    return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                    'OFFLINE');
                }
            }else{
                return '-'; 
            } 
        };

        this.provisioningStatusFormatter = function(d, c, v, cd, dc) {
            var status = getValueByJsonPath(dc, 'loadbalancer;loadbalancer_properties;provisioning_status', '');
            if (status !== '') {
                if(status === 'ACTIVE'){
                    return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                    'ACTIVE');
                }else{
                    return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                    'INACTIVE');
                }
            }else{
                return '-'; 
            } 
        };

        this.ipAddressFormatter = function(d, c, v, cd, dc) {
            var ip = getValueByJsonPath(dc, 'loadbalancer;loadbalancer_properties;vip_address', '');
            if (ip !== '') {
                return ip;
            }else{
                return '-'; 
            } 
        };
        
        this.listenersCountFormatter = function(d, c, v, cd, dc) {
            var listener = getValueByJsonPath(dc, 'loadbalancer;loadbalancer-listener', []);
            if (listener.length > 0) {
                return listener.length.toString();
            }else{
                return '0'; 
            } 
        };
        
        this.nameFormatter = function(d, c, v, cd, dc) {
            var name = getValueByJsonPath(dc, 'loadbalancer;name', '');
            if (name !== '') {
                return name;
            }else{
                return '-'; 
            } 
        };
        
        this.displayNameFormatter = function(d, c, v, cd, dc) {
            var name = getValueByJsonPath(dc, 'loadbalancer;display_name', '');
            if (name !== '') {
                return name;
            }else{
                return '-'; 
            } 
        };
        
        this.loadbalancerProviderFormatter = function(d, c, v, cd, dc) {
            var provider = getValueByJsonPath(dc, 'loadbalancer;loadbalancer_provider', '');
            if (provider !== '') {
                return provider;
            }else{
                return '-'; 
            } 
        };
        
        this.floatingIpFormatter = function(d, c, v, cd, dc) {
            var vmi = getValueByJsonPath(dc, 'loadbalancer;virtual_machine_interface_refs', []),
            fixedIpList = [], returnString = '';
            if(vmi.length > 0){
              _.each(vmi, function(ref) {
                    var ip = getValueByJsonPath(ref, 'floating-ip;ip', '');
                    if(ip != ''){
                        var floatingIp = '<span>'+ ip +'</span>';
                        fixedIpList.push(floatingIp); 
                    }
               });
            }
            if(fixedIpList.length > 0){
                for(var j = 0; j< fixedIpList.length,j < 2; j++){
                    if(fixedIpList[j]) {
                        returnString += fixedIpList[j] + "<br>";
                    }
                }
                if (fixedIpList.length > 2) {
                    returnString += '<span class="moredataText">(' +
                        (fixedIpList.length-2) + ' more)</span> \
                        <span class="moredata" style="display:none;" ></span>';
                }else{
                    return returnString;
                }
            }else{
                return '-';
            }
        };
        
        this.adminStatusFormatter = function(d, c, v, cd, dc){
            var adminStatus = getValueByJsonPath(dc, 'loadbalancer;loadbalancer_properties;admin_state', false);
            if(adminStatus){
                return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                'Yes');
            }else{
                return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                'No');
            }
        };
        
        this.subnetFormatter = function(d, c, v, cd, dc){
            var vmiref = getValueByJsonPath(dc, 'loadbalancer;virtual_machine_interface_refs', []),
            subnetList = [], returnString = '';
            if(vmiref.length > 0){
                _.each(vmiref, function(vmi) {
                    var vn = getValueByJsonPath(vmi, 'virtual-network', {});
                    if(Object.keys(vn).length > 0){
                       var ipamRef = getValueByJsonPath(vn, 'network_ipam_refs', []);
                       _.each(ipamRef, function(ipam) {
                           var attr = getValueByJsonPath(ipam, 'attr;ipam_subnets', []);
                           if(attr.length > 0){
                               _.each(attr, function(obj) {
                                   var subnet = getValueByJsonPath(obj, 'subnet',{});
                                   var text = subnet.ip_prefix + '/' + subnet.ip_prefix_len;
                                   var prefix_ip = '<span>'+ text +'</span>';
                                   subnetList.push(prefix_ip);
                               });
                           }else{
                              return '-';  
                           }
                       });
                    }else{
                       return '-'; 
                    }
                 });
                if(subnetList.length > 0){
                    for(var j = 0; j< subnetList.length,j < 2; j++){
                        if(subnetList[j]) {
                            returnString += subnetList[j] + "<br>";
                        }
                    }
                    if (subnetList.length > 2) {
                        returnString += '<span class="moredataText">(' +
                            (subnetList.length-2) + ' more)</span> \
                            <span class="moredata" style="display:none;" ></span>';
                    }else{
                        return returnString;
                    }
                }else{
                    return '-'; 
                }
            }else{
                return '-';
            }
        };
        
        var validateFlatSubnetIPAM = function (ipam) {
            var isFlatSubnetIPAM = getValueByJsonPath(ipam,
                    'attr;ipam_subnets;0;subnet', null, false) ? false : true;
            if(isFlatSubnetIPAM){
                return true;
            } else {
                return false;
            }
        };
        
        var flatSubnetIPAMsFormatter = function(d, c, v, cd, dc) {
            var ipamString,
                ipamObjs = getValueByJsonPath(dc,"network_ipam_refs", [], false),
                domain  = contrail.getCookie(cowc.COOKIE_DOMAIN),
                project = contrail.getCookie(cowc.COOKIE_PROJECT),
                flatSubnetIpams = [];
            _.each(ipamObjs, function(ipamObj) {
                var isFlatSubnetIPAM = getValueByJsonPath(ipamObj,
                        'attr;ipam_subnets;0;subnet', null, false) ? false : true;
                if(isFlatSubnetIPAM) {
                    ipamFqn = ipamObj.to;
                    if (domain != ipamFqn[0] ||
                            project != ipamFqn[1]) {
                        ipamString = ipamFqn[2] + ' (' + ipamFqn[0] +
                                            ':' + ipamFqn[1] + ')';
                    } else {
                        ipamString = ipamFqn[2];
                    }
                    flatSubnetIpams.push(ipamString);
                }
            });
            return flatSubnetIpams;
        };

        this.getSubnetDNSStatus = function(subnetObj) {
            var dhcpOpts = getValueByJsonPath(subnetObj,
                                'dhcp_option_list;dhcp_option', []);
            if (dhcpOpts.length) {
                return this.getdhcpValuesByOption(dhcpOpts, 6).indexOf("0.0.0.0")
                        == -1 ? true : false;
            }
             return true;
        };
        this.listenerDescriptionFormatter = function(d, c, v, cd, dc) {
            var description = getValueByJsonPath(dc,
                                'id_perms;description', '');
            if (description != '') {
                return description;
            }else{
                return '-';
            }
        };
        
        this.listenersFormatterList = function(d, c, v, cd, dc){
            var subnetString = "", protocol, port, state, returnString = '',
            listeners = getValueByJsonPath(dc, 'loadbalancer;loadbalancer-listener', []);
            if(listeners.length > 0){
                _.each(listeners, function(listener) {
                    var listenerProp = getValueByJsonPath(listener, 'loadbalancer_listener_properties', {});
                    if(listenerProp.protocol != undefined){
                        protocol = listenerProp.protocol;
                    }else{
                        protocol = '-';
                    }
                    if(listenerProp.protocol_port != undefined){
                        port = listenerProp.protocol_port;
                    }else{
                        port = '-';
                    }
                    if(listenerProp.admin_state != undefined){
                        status = listenerProp.admin_state;
                        if(status){
                           state = '<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;Yes';
                        }else{
                           state = '<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;No';
                        }
                    }else{
                        state = '-';
                    }
                    subnetString += "<tr style='vertical-align:top'><td>";
                    subnetString += protocol + "</td><td>";
                    subnetString += port + "</td><td>";
                    subnetString += state + "</td>";
                    subnetString += "</tr>";
                });
                returnString =
                    "<table style='width:100%'><thead><tr>\
                    <th style='width:30%'>Protocol</th>\
                    <th style='width:30%'>Port</th>\
                    <th style='width:30%'>Admin State</th>\
                    </tr></thead><tbody>";
                returnString += subnetString;
                returnString += "</tbody></table>";
                return returnString;
            }else{
               return '-'; 
            }
        };

        this.subnetTmplFormatterList =  function(d, c, v, cd, dc) {
            var subnetString = "", flatSubnetIPAMs, ipamObjs = [];
            var count = 0,subnetCnt = 0, returnStr = '';
            var vmiref = getValueByJsonPath(dc, 'loadbalancer;virtual_machine_interface_refs', []);
            _.each(vmiref, function(ref) {
                var ipamRef = getValueByJsonPath(ref, 'virtual-network;network_ipam_refs', []);
                ipamObjs = ipamObjs.concat(ipamRef);
            });
            var len = ipamObjs.length;
            if (!len) {
                if (cd == -1) {
                    return [];
                } else {
                    return '-';
                }
            }
            for(var i = 0; i < len; i++) {
                var ipam = ipamObjs[i];
                var field = 'ipam_subnets';
                var subnet = ipam['attr'][field];
                var subnetLen = ipam['attr'][field].length;
                if(validateFlatSubnetIPAM(ipam)){
                    continue;
                }
                for(var j = 0; j < subnetLen; j++) {
                    var ip_block = ipam['attr'][field][j];
                    var ipam_block= ipam['to'];
                    var ipamto = ipam_block[2] + ' ( ' + ipam_block[0] + ':' +ipam_block[1] + ')';
                    var cidr = getValueByJsonPath(ip_block,"subnet;ip_prefix", null, false);
                    var cidrlen = getValueByJsonPath(ip_block,"subnet;ip_prefix_len", null, false);
                    if(cidr){
                        cidr = cidr + '/' + cidrlen ;
                    } else {
                        continue;
                    }
                    var gw   = ip_block.default_gateway ? ip_block.default_gateway: "-";
                    var dhcp = ip_block.enable_dhcp ? 'Enabled' : 'Disabled'; 
                    var dns  = this.getSubnetDNSStatus(ip_block) ? 'Enabled' : 'Disabled';
                    var gwStatus =  (gw == null || gw == "" || gw == "0.0.0.0") ?
                                        'Disabled' : gw;

                    var allocPools = [];
                    if ('allocation_pools' in ip_block &&
                                ip_block.allocation_pools.length) {
                        allocPools = getValueByJsonPath(ip_block,"allocation_pools", []);
                    }
                    var allocPoolStr = "-";
                    _.each(allocPools, function(pool, index) {
                        pool = pool.start + ' - ' + pool.end;
                        if(index === 0) {
                            allocPoolStr = pool;
                        } else {
                            allocPoolStr += "<br/>" + pool;
                        }
                    });
                    subnetString += "<tr style='vertical-align:top'><td>";
                    subnetString += cidr + "</td><td>";
                    subnetString += gw + "</td><td>";
                    subnetString += dns + "</td><td>";
                    subnetString += dhcp + "</td><td>";
                    subnetString += allocPoolStr+ "</td>";
                    subnetString += "</tr>";
                }
            }

            //flat subnet ipams
            flatSubnetIPAMs = flatSubnetIPAMsFormatter(d, c, v, -1, dc);
            _.each(flatSubnetIPAMs, function(ipam) {
                subnetString += "<tr style='vertical-align:top'><td>";
                subnetString += ipam + "</td><td>";
                subnetString += '-' + "</td><td>";
                subnetString += '-' + "</td><td>";
                subnetString += '-' + "</td><td>";
                subnetString += '-' + "</td>";
                subnetString += "</tr>";
            });
            var returnString = "";
            if(subnetString != ""){
                returnString =
                    "<table style='width:100%'><thead><tr>\
                    <th style='width:25%'>CIDR</th>\
                    <th style='width:25%'>Gateway</th>\
                    <th style='width:10%'>DNS</th>\
                    <th style='width:10%'>DHCP</th>\
                    <th style='width:30%'>Allocation Pools</th>\
                    </tr></thead><tbody>";
                returnString += subnetString;
                returnString += "</tbody></table>";
            } else {
                returnString += "";
            }
            return returnString ? returnString : "-";
        };
        
        this.lbOwnerPermissionFormatter = function(d, c, v, cd, dc){
            var ownerAccess = getValueByJsonPath(dc, 'loadbalancer;perms2;owner_access', 0);
            return this.PermissionFormatter(ownerAccess);
        };
        
        this.lbGlobalPermissionFormatter = function(d, c, v, cd, dc){
            var globalAccess = getValueByJsonPath(dc, 'loadbalancer;perms2;global_access', 0);
            return this.PermissionFormatter(globalAccess);
        };
        
        this.lbOwnerFormatter = function(d, c, v, cd, dc){
            var owner = getValueByJsonPath(dc, 'loadbalancer;perms2;owner', '');
            if(owner != ''){
                return owner;
            }else{
                return '-';
            }
        };
        
        this.lbSharedPermissionFormatter = function(d, c, v, cd, dc) {
            var formattedSharedPerms = "", sharedPermsStr = "",
                sharedPerms =  getValueByJsonPath(dc, "loadbalancer;perms2;share", []),
                i, sharedPermsCnt = sharedPerms.length;
            if(sharedPermsCnt) {
                for(i = 0; i < sharedPermsCnt; i++) {
                    if(sharedPerms[i]) {
                        sharedPermsStr += "<tr style='vertical-align:top'><td>";
                        sharedPermsStr += sharedPerms[i].tenant + "</td><td>";
                        sharedPermsStr +=
                            permissionFormatter(sharedPerms[i].tenant_access) +
                            "</td><td>";
                        sharedPermsStr += "</tr>";
                    }
                }
                if(sharedPermsStr) {
                    formattedSharedPerms =
                        "<table class='sharedlist_permission' style='width:100%'><thead><tr>" +
                        "<th style='width:70%'>Project</th>" +
                        "<th style='width:30%'>Permissions</th>" +
                        "</tr></thead><tbody>";
                    formattedSharedPerms += sharedPermsStr;
                    formattedSharedPerms += "</tbody></table>";
                }
            } else {
                formattedSharedPerms = "-";
            }
            return formattedSharedPerms;
        };
        
        this.PermissionFormatter =  function(v) {
            var retStr = "";
            switch (Number(v)) {
                case 1:
                    retStr = "Refer";
                    break;
                case 2:
                    retStr = "Write";
                    break;
                case 3:
                    retStr = "Write, Refer";
                    break;
                case 4:
                    retStr = "Read";
                    break;
                case 5:
                    retStr = "Read, Refer";
                    break;
                case 6:
                    retStr = "Read, Write";
                    break;
                case 7:
                    retStr = "Read, Write, Refer";
                    break;
                default:
                    retStr = "-";
                    break;
            };
            return retStr;
        };
        
        this.listenerProtocolFormatter = function(d, c, v, cd, dc){
            var protocol = getValueByJsonPath(dc, 'loadbalancer_listener_properties;protocol', '');
            if(protocol !== ''){
                return protocol;
            }else{
                return '-';
            }
        };
        
        this.listenerPortFormatter = function(d, c, v, cd, dc){
            var port = getValueByJsonPath(dc, 'loadbalancer_listener_properties;protocol_port', '');
            if(port !== ''){
                return port;
            }else{
                return '-';
            }
        };
        
        this.listenerPoolCountFormatter = function(d, c, v, cd, dc){
            var poolCount = getValueByJsonPath(dc, 'loadbalancer-pool', []);
            if(poolCount.length > 0){
                return poolCount.length;
            }else{
                return '0';
            }
        };
        
        this.listenerAdminStateFormatter = function(d, c, v, cd, dc){
            var adminStatus = getValueByJsonPath(dc, 'loadbalancer_listener_properties;admin_state', false);
            if(adminStatus){
                return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                'Yes');
            }else{
                return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                'No');
            }
        };
        
        this.poolProtocolFormatter = function(d, c, v, cd, dc){
            var protocol = getValueByJsonPath(dc, 'loadbalancer_pool_properties;protocol', '');
            if(protocol !== ''){
                return protocol;
            }else{
                return '-';
            }
        };
        
        this.poolLbMethodFormatter = function(d, c, v, cd, dc){
            var method = getValueByJsonPath(dc, 'loadbalancer_pool_properties;loadbalancer_method', '');
            if(method !== ''){
                var splitedMethod = method.split('_'), textList = [];
                _.each(splitedMethod, function(text) {
                    var mText = text.toLocaleLowerCase();
                    textList.push(cowl.getFirstCharUpperCase(mText));
                 });
                return textList.join(' ');
            }else{
                return '-';
            }
        };
        
        this.poolMemberCountFormatter = function(d, c, v, cd, dc){
            var poolMemberCount = getValueByJsonPath(dc, 'loadbalancer-members', []);
            if(poolMemberCount.length > 0){
                return poolMemberCount.length;
            }else{
                return '0';
            }
        };
        
        this.healthMonitorCountFormatter = function(d, c, v, cd, dc){
            var healthMonitorCount = getValueByJsonPath(dc, 'loadbalancer-healthmonitor', []);
            if(healthMonitorCount.length > 0){
                return healthMonitorCount.length;
            }else{
                return '0';
            }
        };
        
        this.poolAdminStateFormatter = function(d, c, v, cd, dc){
            var adminStatus = getValueByJsonPath(dc, 'loadbalancer_pool_properties;admin_state', false);
            if(adminStatus){
                return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                'Yes');
            }else{
                return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                'No');
            }
        };
        
        this.poolMemberPortFormatter = function(d, c, v, cd, dc){
            var port = getValueByJsonPath(dc, 'loadbalancer_member_properties;protocol_port', 0);
            if(port !== 0){
                return port;
            }else{
                return '0';
            }
        };
        
        this.poolMemberAddressFormatter = function(d, c, v, cd, dc){
            var address = getValueByJsonPath(dc, 'loadbalancer_member_properties;address', '');
            if(address !== ''){
               return address;
            }else{
                return '-';
            }
        };
        
        this.poolMemberWeightFormatter = function(d, c, v, cd, dc){
            var weight = getValueByJsonPath(dc, 'loadbalancer_member_properties;weight', 0);
            if(weight !== 0){
                return weight;
            }else{
                return '0';
            }
        };
        
        this.poolMemberAdminStateFormatter = function(d, c, v, cd, dc){
            var adminStatus = getValueByJsonPath(dc, 'loadbalancer_member_properties;admin_state', false);
            if(adminStatus){
                return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                'Yes');
            }else{
                return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                'No');
            }
        };
        ///
        this.monitorTypeFormatter = function(d, c, v, cd, dc){
            var type = getValueByJsonPath(dc, 'loadbalancer_healthmonitor_properties;monitor_type', '');
            if(type !== ''){
                return type;
            }else{
                return '-';
            }
        };
        
        this.monitorExpectedCodesFormatter = function(d, c, v, cd, dc){
            var codes = getValueByJsonPath(dc, 'loadbalancer_healthmonitor_properties;expected_codes', '');
            if(codes !== ''){
               return codes;
            }else{
                return '-';
            }
        };
        
        this.monitorMaxRetriesFormatter = function(d, c, v, cd, dc){
            var retries = getValueByJsonPath(dc, 'loadbalancer_healthmonitor_properties;max_retries', 0);
            if(retries !== 0){
                return retries;
            }else{
                return '0';
            }
        };
        
        this.monitorDelayFormatter = function(d, c, v, cd, dc){
            var delay = getValueByJsonPath(dc, 'loadbalancer_healthmonitor_properties;delay', 0);
            if(delay !== 0){
               return delay;
            }else{
                return '0';
            }
        };
        
        this.monitorTimeoutFormatter = function(d, c, v, cd, dc){
            var timeout = getValueByJsonPath(dc, 'loadbalancer_healthmonitor_properties;timeout', 0);
            if(timeout !== 0){
                return timeout;
            }else{
                return '0';
            }
        };
        
        this.monitorAdminStateFormatter = function(d, c, v, cd, dc){
            var adminStatus = getValueByJsonPath(dc, 'loadbalancer_healthmonitor_properties;admin_state', false);
            if(adminStatus){
                return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                'Yes');
            }else{
                return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                'No');
            }
        };

        this.valueFormatter = function(row, col, val, d, rowData) {
               if ('name' == rowData['key']) {
                   return val;
               }
               if('display_name' === rowData['key']) {
                   if(val == '' || val == null){
                       return '-';
                   }else{
                       return val; 
                   }
               }
               if('id_perms' === rowData['key']) {
                   if(val.description == '' || val.description == null){
                       return '-';
                   }else{
                       return val.description; 
                   }
               }
               if('loadbalancer_provider' === rowData['key']) {
                   if(val == '' || val == null){
                       return '-';
                   }else{
                       return val; 
                   }
               }
               if('loadbalancer_properties' === rowData['key']){
                  if(rowData['name'] === 'Provisioning Status'){
                      if(val.provisioning_status == '' || val.provisioning_status == null){
                          return '-';
                      }else{
                          if(val.provisioning_status === 'ACTIVE'){
                              return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                              'ACTIVE');
                          }else{
                              return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                              'INACTIVE');
                          }
                      }
                  }
                  if(rowData['name'] === 'Admin State'){
                      if(val.admin_state == '' || val.admin_state == null){
                          return '-';
                      }else{
                          if(val.admin_state == true){
                              return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                              'Yes');
                          }else{
                              return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                              'No');
                          }
                      }
                  }
                  if(rowData['name'] === 'Fixed IPs'){
                      if(val.vip_address == '' || val.vip_address == null){
                          return '-';
                      }else{
                          return val.vip_address;
                      }
                  }
                  if(rowData['name'] === 'Operating Status'){
                      if(val.operating_status == '' || val.operating_status == null){
                          return '-';
                      }else{
                          if(val.operating_status === 'ONLINE'){
                              return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                              'ONLINE'); 
                          }else{
                              return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                              'OFFLINE'); 
                          }
                      }
                  }
              }
              if('loadbalancer-listener' === rowData['key']) {
                   if(val.length == 0 || val == null || val == undefined){
                       return '-';
                   }else{
                       return val.length; 
                   }
              }
              if('service_instance_refs' === rowData['key']) {
                  var toList = [];
                  if(val.length == 0 || val == null || val == undefined){
                      return '-';
                  }else{
                      for(var i = 0; i < val.length; i++){
                          var to = val[i].to;
                          toList.push(to[to.length -1]);
                      } 
                      var siUuid = toList.join(',');
                      var siHash = '/#p=config_sc_svcInstances';
                      var siUrl = window.location.origin + siHash;
                      return ( '<a href="'+ siUrl + '" style="color: #3184c5">' + siUuid + '</a>');
                  }
             }
              if('virtual_machine_interface_refs' === rowData['key']) {
                  if(rowData['name'] === 'Floating IPs'){
                      var vmi = val,
                      fixedIpList = [], returnString = '';
                      if(vmi.length > 0){
                        _.each(vmi, function(ref) {
                              var ip = getValueByJsonPath(ref, 'floating-ip;ip', '');
                              if(ip != ''){
                                  var floatingIp = '<span>'+ ip +'</span>';
                                  fixedIpList.push(floatingIp); 
                              }
                         });
                      }
                      if(fixedIpList.length > 0){
                          for(var j = 0; j < fixedIpList.length; j++){
                              if(fixedIpList[j]) {
                                  returnString += fixedIpList[j] + "<br>";
                              }
                          }
                          return returnString;
                      }else{
                          return '-';
                      }
                  }
                  if(rowData['name'] === 'Subnet'){
                      var vmiref = val,
                      subnetList = [], returnString = '';
                      if(vmiref.length > 0){
                          _.each(vmiref, function(vmi) {
                              var vn = getValueByJsonPath(vmi, 'virtual-network', {});
                              if(Object.keys(vn).length > 0){
                                 var ipamRef = getValueByJsonPath(vn, 'network_ipam_refs', []);
                                 _.each(ipamRef, function(ipam) {
                                     var attr = getValueByJsonPath(ipam, 'attr;ipam_subnets', []);
                                     if(attr.length > 0){
                                         _.each(attr, function(obj) {
                                             var subnet = getValueByJsonPath(obj, 'subnet',{});
                                             var text = subnet.ip_prefix + '/' + subnet.ip_prefix_len;
                                             var prefix_ip = '<span>'+ text +'</span>';
                                             subnetList.push(prefix_ip);
                                         });
                                     }else{
                                        return '-';  
                                     }
                                 });
                              }else{
                                 return '-'; 
                              }
                           });
                          if(subnetList.length > 0){
                              for(var j = 0; j < subnetList.length; j++){
                                  if(subnetList[j]) {
                                      returnString += subnetList[j] + "<br>";
                                  }
                              }
                              return returnString;
                          }else{
                              return '-'; 
                          }
                      }else{
                          return '-';
                      }
                  }
                  if(rowData['name'] === 'Virtual Machine Interface'){
                      var toList = [];
                      if(val.length == 0 || val == null || val == undefined){
                          return '-';
                      }else{
                          for(var i = 0; i < val.length; i++){
                              var to = val[i].to;
                              toList.push(to[to.length -1]);
                          } 
                          var vmiUuid = toList.join(',');
                          var vmiHash = '/#p=config_net_ports';
                          var vmiUrl = window.location.origin + vmiHash;
                          return ( '<a href="'+ vmiUrl+ '" style="color: #3184c5">' + vmiUuid + '</a>');
                      } 
                  }
             }
              return val;
         };
         
         this.listenerValueFormatter = function(row, col, val, d, rowData) {
             if ('name' == rowData['key']) {
                 return val;
             }
             if('display_name' === rowData['key']) {
                 if(val == '' || val == null){
                     return '-';
                 }else{
                     return val; 
                 }
             }
             if('id_perms' === rowData['key']) {
                 if(val.description == '' || val.description == null){
                     return '-';
                 }else{
                     return val.description; 
                 }
             }
             if('loadbalancer_listener_properties' === rowData['key']){
                if(rowData['name'] === 'Protocol'){
                    if(val.protocol == '' || val.protocol == null){
                        return '-';
                    }else{
                        return val.protocol;
                    }
                }
                if(rowData['name'] === 'Admin State'){
                    if(val.admin_state == '' || val.admin_state == null){
                        return '-';
                    }else{
                        if(val.admin_state == true){
                            return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                            'Yes');
                        }else{
                            return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                            'No');
                        }
                    }
                }
                if(rowData['name'] === 'Connection Limit'){
                    if(val.connection_limit == '' || val.connection_limit == null){
                        return '-';
                    }else{
                        return val.connection_limit;
                    }
                }
                if(rowData['name'] === 'Protocol Port'){
                    if(val.protocol_port == '' || val.protocol_port == null){
                        return '-';
                    }else{
                        return val.protocol_port;
                    }
                }
            }
            if('loadbalancer-pool' === rowData['key']) {
                 if(val.length == 0 || val == null || val == undefined){
                     return '-';
                 }else{
                     return val.length; 
                 }
            }
            return val;
       };
       
       this.poolValueFormatter = function(row, col, val, d, rowData) {
           if ('name' == rowData['key']) {
               return val;
           }
           if('display_name' === rowData['key']) {
               if(val == '' || val == null){
                   return '-';
               }else{
                   return val; 
               }
           }
           if('id_perms' === rowData['key']) {
               if(val.description == '' || val.description == null){
                   return '-';
               }else{
                   return val.description; 
               }
           }
           if('loadbalancer_pool_properties' === rowData['key']){
              if(rowData['name'] === 'Protocol'){
                  if(val.protocol == '' || val.protocol == null){
                      return '-';
                  }else{
                      return val.protocol;
                  }
              }
              if(rowData['name'] === 'Admin State'){
                  if(val.admin_state == '' || val.admin_state == null){
                      return '-';
                  }else{
                      if(val.admin_state == true){
                          return ('<div class="status-badge-rounded status-active"></div>&nbsp;&nbsp;' +
                          'Yes');
                      }else{
                          return ('<div class="status-badge-rounded status-inactive"></div>&nbsp;&nbsp;' +
                          'No');
                      }
                  }
              }
              if(rowData['name'] === 'Session Persistence'){
                  if(val.session_persistence == '' || val.session_persistence == null){
                      return '-';
                  }else{
                      return val.session_persistence;
                  }
              }
              
              if(rowData['name'] === 'Persistence Cookie Name'){
                  if(val.persistence_cookie_name == '' || val.persistence_cookie_name == null){
                      return '-';
                  }else{
                      return val.persistence_cookie_name;
                  }
              }
              if(rowData['name'] === 'Status Description'){
                  if(val.status_description == '' || val.status_description == null){
                      return '-';
                  }else{
                      return val.status_description;
                  }
              }
              if(rowData['name'] === 'Loadbalancer Method'){
                  if(val.loadbalancer_method == '' || val.loadbalancer_method == null){
                      return '-';
                  }else{
                      return val.loadbalancer_method;
                  }
              }
          }
          if('loadbalancer-healthmonitor' === rowData['key']) {
               if(val.length == 0 || val == null || val == undefined){
                   return '-';
               }else{
                   return val.length; 
               }
          }
          if('loadbalancer-members' === rowData['key']) {
              if(val == undefined){
                  return '0';
              }else{
                  return val.length; 
              }
         }
          return val;
     };
    }
    return lbCfgFormatters;
});