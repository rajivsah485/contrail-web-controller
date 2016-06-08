/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */

define(['contrail-list-model'], function(ContrailListModel) {
    var configJsonListModel = function() {
        var modelConfig = {
                remote: {
                    ajaxConfig: {
                        url: 'https://nodeb11.englab.juniper.net:7143/proxy?proxyURL=http://10.204.216.40:9100',
                        type: "GET"
                    },
                    dataParser: configParseData
                }
        };

        function configParseData(result) {
            var configData = [],
            data = getValueByJsonPath(result, "links", []);
           _.each(data, function(config){
               var currObj = getValueByJsonPath(config, "link", {});
               if(currObj.rel === 'collection'){
                   configData.push(currObj);
               }
            });
        return configData;
        };
        return ContrailListModel(modelConfig);
    };
    return configJsonListModel;
});
