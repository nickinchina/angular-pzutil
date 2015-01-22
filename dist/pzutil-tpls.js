/*
 * pzutil
 * 

 * Version: 0.0.18 - 2015-01-22
 * License: MIT
 */
angular.module("pzutil", ["pzutil.tpls", "pzutil.aditem","pzutil.adpublish","pzutil.download","pzutil.image","pzutil.modal","pzutil.rest","pzutil.retailhelper","pzutil.services","pzutil.simplegrid","pzutil.tree","pzutil.ztemplate"]);
angular.module("pzutil.tpls", ["template/aditem/aditem.tpl.html","template/adpublish/adpublish_grid.tpl.html","template/adpublish/adpublish_list.tpl.html","template/adpublish/adpublish_slide.tpl.html","template/modal/modal-form.html","template/modal/modal.html","template/modal/wait.html","template/simplegrid/export.html","template/simplegrid/footer-virtual.html","template/simplegrid/footer.html","template/simplegrid/header.html","template/simplegrid/simpleGrid-dx.html","template/simplegrid/simpleGrid-normal.html","template/simplegrid/simpleGrid-simple.html","template/simplegrid/simpleGrid-virtual.html","template/simplegrid/simpleGrid.html"]);
/**
 * Created by gordon on 2014/5/26.
 */
angular.module('pzutil.aditem',[])
    .directive('adItem',['rest',function(rest) {
        return {
            restrict: 'E',
            // restrict and template attributes are the same as before.
            // we don't need anymore to bind the value to the external ngModel
            // as we require its controller and thus can access it directly

            scope: {item: '=',itemClass:'=',itemStyle:'='},
            templateUrl:  "template/aditem/aditem.tpl.html" ,
            link: function ($scope, iElement, iAttrs) {

                $scope.getItemTemplate = function() {
                    switch ($scope.item.type) {
                        case 0:
                            return "html.tpl.html";
                        case 1:
                            return "taxonImage.tpl.html";
                        case 2:
                            return 'productImagePrice.tpl.html';
                        case 3:
                            return "promotion.tpl.html";
                        case 4:
                            return "imageClickable.tpl.html";
                        case 5:
                            return 'imageNotClickable.tpl.html';
                    }
                }


                $scope.itemStyle = angular.fromJson($scope.itemStyle)||{};

                console.log( $scope.itemClass);


            }

        }
    }]);

/**
 * Created by gordon on 2014/5/26.
 {id:0, name:localizedMessages.get('adpublish.place.feature')},
 {id:1, name:localizedMessages.get('adpublish.place.new') },
 {id:2, name:localizedMessages.get('adpublish.place.staffPick') },
 {id:3, name:localizedMessages.get('adpublish.place.homeSlider') },
 {id:4, name:localizedMessages.get('adpublish.place.homeFixeTop') },
 {id:5, name:localizedMessages.get('adpublish.place.storeTV') }];
 */
angular.module('pzutil.adpublish',[])
    .directive('adPublish',['rest','retailHelper',function(rest,retailHelper) {
        return {
            restrict: 'E',
            scope: {place: '=',itemClass:'@',itemStyle:'@'},
            templateUrl: function($element, $attrs) {
                if ($attrs.template)
                    return 'template/adpublish/' + $attrs.template + '.tpl.html';
                else if ($attrs.place==3)
                    return 'template/adpublish/adpublish_slide.tpl.html';
                else
                    return 'template/adpublish/adpublish_grid.tpl.html';
            },
            link: function ($scope, iElement, iAttrs) {
                $scope.loading = true;
                rest.callApi('adpublish',{place:$scope.place}).then(function(r){
                    $scope.items = r.data[0];
                    switch ($scope.place) {
                        case 0:
                            $scope.placeText = "adpublish.place.feature";
                            break;
                        case 1:
                            $scope.placeText = "adpublish.place.new";
                            break;
                        case 2:
                            $scope.placeText = "adpublish.place.staffPick";
                            break;
                        case 50:
                            $scope.placeText = 'adpublish.place.adminHighlights';
                            break;
                    }
                    _($scope.items).forEach(function(i){
                        i.props = angular.fromJson(i.props) || {};

                        if (i.type==2){
                            rest.callApi('getProduct',{pid:i.props.product})
                                .then(function(r){
                                    i.product = r.data[0][0];
                                    var max = _.max(r.data[1], 'retail');
                                    var min = _.min(r.data[1], 'retail');

                                    i.product.retail = retailHelper.getRetail(min.retail, max.retail);

                                    var images = [];
                                    _(r.data[1]).forEach(function(v){
                                        if (v.images) {
                                            _(v.images.split(',')).forEach(function(img){
                                                images.push(img);
                                            });
                                        }
                                    });
                                    i.product.images = images;
                                    if (images.length>0)
                                        i.product.image = images[0];
                              });
                        }


                    });

                    $scope.loading = false;
                });

            }
        }
    }]);
/**
 * Created by gordon on 2014/11/3.
 */
angular.module('pzutil.download', []).
    factory('downloadHelper', ['$http','$q',
        function($http,$q){
            var service = { };
            service.downloadFile = function(httpPath,method,data) {
                var deferred = $q.defer();
                // Use an arraybuffer
                var params = { responseType: 'arraybuffer' };
                params.data = data;
                params.url = httpPath;
                params.method = method;
                $http(params)
                    .success( function(data, status, headers) {
                        var octetStreamMime = 'application/octet-stream';
                        var success = false;
                        // Get the headers
                        headers = headers();
                        // Get the filename from the x-filename header or default to "download.bin"
                        var filename = headers['x-filename'] || 'download.bin';
                        // Determine the content type from the header or default to "application/octet-stream"
                        var contentType = headers['content-type'] || octetStreamMime;
                        try
                        {
                            // Try using msSaveBlob if supported
                            console.log("Trying saveBlob method ...");
                            var blob = new Blob([data], { type: contentType });
                            if(navigator.msSaveBlob)
                                navigator.msSaveBlob(blob, filename);
                            else {
                                // Try using other saveBlob implementations, if available
                                var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
                                if(saveBlob){
                                    saveBlob(blob, filename);
                                    console.log("saveBlob succeeded");
                                    success = true;
                                    deferred.resolve(filename);
                                }
                            }
                        } catch(ex)
                        {
                            console.log("saveBlob method failed with the following exception:");
                            console.log(ex);
                        }

                        if(!success)
                        {
                            // Get the blob url creator
                            var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
                            if(urlCreator)
                            {
                                // Try to use a download link
                                var link = document.createElement('a');
                                if('download' in link)
                                {
                                    // Try to simulate a click
                                    try
                                    {
                                        // Prepare a blob URL
                                        console.log("Trying download link method with simulated click ...");
                                        var blob = new Blob([data], { type: contentType });
                                        var url = urlCreator.createObjectURL(blob);
                                        link.setAttribute('href', url);

                                        // Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
                                        link.setAttribute("download", filename);

                                        // Simulate clicking the download link
                                        var event = document.createEvent('MouseEvents');
                                        event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                                        link.dispatchEvent(event);
                                        console.log("Download link method with simulated click succeeded");
                                        success = true;
                                        deferred.resolve(filename);

                                    } catch(ex) {
                                        console.log("Download link method with simulated click failed with the following exception:");
                                        console.log(ex);
                                        deferred.reject( "Download link method with simulated click failed with the following exception:: " + ex);
                                    }
                                }

                            }
                        }
                    })
                    .error(function(data, status) {
                        console.log("Request failed with status: " + status);
                        console.log("Request failed with data: " , params.data);
                        deferred.reject( "Request failed with status: " + status);
                    });
                return deferred.promise;
            };
            return service;
        }])
/**
 * Created by s2k on 14-6-8.
 */
angular.module('pzutil.image', [])
    .factory('imageHelper', [
        function(){
            var imageService = {
                getUrl : function(image, container){
                    return "http://portalvhdsmzdfsgd15ll8f.blob.core.windows.net/" + (container ? container+ "/" : "") + image;
                }
            };
            return imageService;
        }])
    .filter('zImageUrl', ['imageHelper',
        function (imageHelper){
            return function(image, container){
                return imageHelper.getUrl(image, container);
            };
        }]);
/**
 * Created by gordon on 2014/4/25.
 */
angular.module('pzutil.modal', [])
    .directive('crudModal', function () {
        return {
            restrict:'E',
            replace: true,
            transclude: 'element',
            templateUrl: 'template/modal/modal.html'
        };
    })
    .directive('crudModalForm', function () {
        return {
            restrict:'E',
            replace: true,
            transclude: 'element',
            templateUrl: 'template/modal/modal-form.html'
        };
    })
    .factory('crudWait',['$http','$modal', function($http, $modal) {
        var arrSelected = [];
        var mixin = {
            doWork : function(msg, promise, cb) {
                 var modalInstance = $modal.open({
                    templateUrl: 'template/modal/wait.html',
                    controller: 'crudWaitCtrl',
                    resolve: {
                        msg: function () {
                            return msg;
                        }
                    }
                });

                modalInstance.result.then(function (r) {}, function () {});

                promise.then(function(r){
                    cb();
                    modalInstance.close();
                });
            }
        };
        return mixin;
    }])
    .controller('crudWaitCtrl', [ '$scope', '$modalInstance','msg',function( $scope, $modalInstance,msg) {
        $scope.msg = msg;
}]);
/**
 * Created by gordon on 2014/5/26.
 */
angular.module('pzutil.rest', []).
    factory('rest', ['$http',
        function($http){
            var url = '/api/public';
            var restService = {
                callApi : function(method, params){
                    params = params || {};
                    params.aid = 2;
                    return $http.post(url + '/' + method, params);
                }
            };
            return restService;
        }]);
/**
 * Created by s2k on 14-5-27.
 */
angular.module('pzutil.retailhelper', [])
    .factory('retailHelper', [
        function(){
            var retailService = {
                getRetail : function(retailmin, retailmax){
                    return retailmin == retailmax
                        ? accounting.formatMoney(retailmax)
                        : accounting.formatMoney(retailmin) + " ~ " + accounting.formatMoney(retailmax);
                }
            };
            return retailService;
        }]);
/**
 * Created by gordon on 2014/4/4.
 */
angular.module('pzutil.services', []).
    factory('attrHelper', [
        function(){
            var attrService = {
                parseIds : function(ids, taxons){
                    var r=[];
                    _(ids.split(',')).forEach(function(i){
                        var f = _.find(taxons, {id: i});
                        if (f)
                            r.push(f.name);
                    });
                    return r.join(", ");
                }
            };
            return attrService;
        }])
    .factory('localizedMessages', ['$interpolate', 'I18N.MESSAGES', function ($interpolate, i18nmessages) {

    var handleNotFound = function (msg, msgKey) {
        //return msg || '?' + msgKey + '?';
        return msg || msgKey;
    };

    return {
        get : function (msgKey, interpolateParams) {
            var msg =  i18nmessages[msgKey];
            if (msg) {
                return $interpolate(msg)(interpolateParams);
            } else {
                return handleNotFound(msg, msgKey);
            }
        },
        rawGet : function(msgKey){
            return  i18nmessages[msgKey];
        }
    };
}])
    // simple translation filter
    // usage {{ TOKEN | i18n }}
    .filter('i18n', ['localizedMessages', function (localizedMessages) {
        return function (input) {
            return localizedMessages.get(input);
        };
    }])
    // translation directive that can handle dynamic strings
    // updates the text value of the attached element
    // usage <span data-i18n="TOKEN" ></span>
    // or
    // <span data-i18n="TOKEN|VALUE1|VALUE2" ></span>
    .directive('i18n', ['localizedMessages', function(localizedMessages){
        var i18nDirective = {
            restrict:"EAC",
            updateText:function(elm, token){
                elm.text( localizedMessages.get(token, interpolateParams));
            },

            link:function (scope, elm, attrs) {
                attrs.$observe('i18n', function (value) {
                    i18nDirective.updateText(elm, attrs.i18n);
                });
            }
        };

        return i18nDirective;
    }])
    // translation directive that can handle dynamic strings
    // updates the attribute value of the attached element
    // usage <span data-i18n-attr="TOKEN|ATTRIBUTE" ></span>
    // or
    // <span data-i18n-attr="TOKEN|ATTRIBUTE|VALUE1|VALUE2" ></span>
    .directive('i18nAttr', ['localize', function (localizedMessages) {
        var i18NAttrDirective = {
            restrict: "EAC",
            updateText:function(elm, token){
                elm.text( localizedMessages.get(token, interpolateParams));
            },
            link: function (scope, elm, attrs) {

                attrs.$observe('i18nAttr', function (value) {
                    i18NAttrDirective.updateText(elm, value);
                });
            }
        };

        return i18NAttrDirective;
    }]);
/**
 * Created by gordon on 2014/4/14.
 */
angular.module('pzutil.simplegrid', ['pzutil.services','pzutil.modal'])
    .factory('sgColumn', ['localizedMessages', function (localizedMessages) {

        var factory = function($scope) {

            var sorter = $scope.sorter,
                lookup = $scope.myLookup,
                lookupTitle = $scope.myLookupTitle;
            var mixin = function (data) {
                data.checkbox = ($scope.sgCheckColumn == data.name);
                angular.extend(this, data);
            };
            mixin.sorter = sorter;
            mixin.New = function(o) { return new mixin(o);};
            mixin.Parse = function(attr) {
                if (attr) {
                    var data = angular.fromJson(attr);
                    var result = [];
                    for (var i = 0; i < data.length; i++) {
                        result.push(new mixin(data[i]));
                    }
                    return result;
                }
            };
            mixin.prototype.$getTitle = function()
            {
                if (this.res)
                    return localizedMessages.get(this.res);
                else {
                    var v = this.name;
                    if (lookupTitle)
                        v = lookupTitle({col: v});
                    return v || this.name;
                }
            };

            mixin.prototype.$getColumnClass = function(item){
                var w = this.width  ? this.width : 2;
                var checkbox = this.checkbox ? "checkbox checkbox-cell " :"";
                var inactive = (item && item.inactive);
                if (inactive) checkbox += " sg-deleted";
                if (this.align)
                    return checkbox + 'sg-gridrow-cell col-md-' + w + ' text-' + this.align;
                else
                    return checkbox + 'sg-gridrow-cell col-md-' + w;
            };
            mixin.prototype.$sort = function(){
                this.sortOrder = !this.sortOrder;
                mixin.sorter(this);
            }
            mixin.prototype.$getText = function(item){
                var v = item[this.name];
                if (this.bool)
                    return '';
                else {
                    if (lookup)
                        v = lookup({col: this.name, value:v, item: item});
                    return v ;
                }
            };
            mixin.prototype.$getValue = function(item){
                var v = item[this.name];
                if (lookup)
                    v = lookup({col: this.name, value:v, item: item});
                return v;
            };
            return mixin;
        }
        return factory;
    }])
    .factory('simpleGridExport', ['$modal', '$location','$q','zTreeHelper', function($modal,zrest,$q,zTreeHelper){
        var service = {

            export : function(columns, data, docTitle)
            {
                var deferred = $q.defer();
                var  modalInstance = $modal.open({
                    templateUrl: "template/simplegrid/export.html",
                    controller: "simpleGridExportCtrl",
                    resolve: {
                        docTitle: function(){return docTitle},
                        columns: function(){
                            var cols = [];
                            _(columns).forEach(function(i){
                                cols.push({
                                    name: i.name,
                                    title: i.$getTitle()
                                });
                            });
                            return cols;
                        },
                        data: function(){
                            var rows = [];
                            _(data).forEach(function(i){
                                var o = {};
                                _(columns).forEach(function(c){
                                    o[c.name] = c.$getValue(i);
                                });
                                rows.push(o);
                            });
                            return rows;
                        }
                    }
                });
                //{selectAllStores:false,selectedStores:[],allStores:stores};
                modalInstance.result.then(function (r) {
                    deferred.resolve(r);
                }, function () {
                    deferred.reject();
                });
                return deferred.promise;
            }
        };
        return service;
    }])
    .controller('simpleGridExportCtrl', [ '$scope', '$modalInstance','columns','data','docTitle','downloadHelper','localizedMessages','browser',
        function( $scope, $modalInstance,columns,data,docTitle,downloadHelper,localizedMessages,browser) {
            $scope.item = {};
            $scope.columns = columns;
            $scope.data = data;
            $scope.groupbys = [];
            _(columns).forEach(function(i){
                $scope.groupbys.push({
                    id: i.name,
                    name: i.title
                })
            })
            $scope.formats = [
                {id:"xlsx", name:"xlsx"}, //{id:"pdf", name:"pdf"},
                {id:"csv", name:"csv"}
            ];
            $scope.heading = function() {
                return localizedMessages.get('common.Export') + ' ' + (docTitle || '');
            };
            $scope.ok = function () {
                var p = {
                    columns : $scope.columns,
                    data : $scope.data,
                    format: $scope.item.format,
                    groupby: $scope.item.groupby,
                    title : docTitle
                };
                if (browser.s2kagent)
                    alert('__excel'+ JSON.stringify(p));
                else
                    downloadHelper.downloadFile("/pzobject/excel", "post", p)
                        .then(function(i){
                            $modalInstance.close();
                        },function(e){
                            console.log(e);
                            alert(e.message);
                        });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }])
    .directive('simpleGrid', ['sgColumn', 'breadcrumbs', 'localizedMessages','crudWait', '$modal','simpleGridExport','$timeout',
        function (sgColumn, breadcrumbs, localizedMessages,crudWait,$modal,simpleGridExport,$timeout) {
            return {
                restrict:'E',
                replace:true,
                scope: { data:"=sgData", listItems:"=",  sgAddObject:"&", sgSortOptions:"=", itemtemplate:"=sgTemplate",sgColumns:"@",sgDelObject:"&", sgAllowDel:"@",
                    sgNoPager:'=', sgOnClick:'&', sgLookup:"&", sgGlobalSearch:"@",sgPageSize:"@" ,sgOptions:"=", sgOnChange:"&", sgLookupTitle:"&",sgSortField:"=",sgVirtual:"@",
                    sgCheckColumn:"@", sgCustomSearch:"&", sgModalSearchTemplate:"=", sgModalSearchController:"=", sgModalSearchResolve:"=", sgModalSearch:"&", sgExportTitle:"@"},
                templateUrl: function($element, $attrs) {
                    var t = $attrs.sgTemplate;
                    if (t) {
                        var suffix = ".grid.tpl.html'";
                        if (t.indexOf(suffix, t.length - suffix.length) !== -1) {
                            return 'template/simplegrid/simpleGrid-simple.html';
                        }
                        else {
                            return 'template/simplegrid/simpleGrid.html';
                        }
                    }
                    else {
                        if ($attrs.sgVirtual)
                            return 'template/simplegrid/simpleGrid-virtual.html';
                        else
                            return 'template/simplegrid/simpleGrid-normal.html';
                    }
                },
                link: function($scope, $element, $attrs, $controller) {
                    var sortIt = function(fieldName, sortOrder, sortField, useLookup) {
                        var sortField = sortField || fieldName;
                        _($scope.columns).forEach(function(c){
                            if (c.name != fieldName)
                                c.sortOrder = undefined;
                        });
                        $scope.data.sort(function(a,b) {
                            var a1,b1;
                            if (!a.hasOwnProperty(sortField) || col.useLookup){
                                a1 = $scope.myLookup ?$scope.myLookup({col:sortField,item: a}):undefined;
                                b1 = $scope.myLookup ?$scope.myLookup({col:sortField,item: b}):undefined;
                            }
                            else {
                                a1 = a[sortField];
                                b1 = b[sortField];
                            };
                            var r;
                            if (a1==null)
                                r = -1;
                            else if (b1==null)
                                r = 1;
                            else {
                                if (angular.isString(a1))
                                    r = a1.localeCompare(b1);
                                else
                                    r = (a1 < b1 ? -1:1);
                            }

                            return r*(sortOrder? 1:-1);
                        });
                    }
                    $scope.sorter = function(col) {
                        pageSetting.initSort = col.name;
                        pageSetting.initSortOrder = col.sortOrder;
                        sortIt(col.name, col.sortOrder, col.sortField, col.useLookup);
                    };
                    $scope.AddObject = function(){
                        $scope.data.push(sgColumn.New($scope.sgAddObject()));
                    };
                    $scope.DelObject = function(item){
                        if (confirm(localizedMessages.get('common.del')))
                        {
                            var idx = $scope.data.indexOf(item);
                            $scope.data.splice(idx, 1);
                            if ($scope.sgDelObject)
                            {
                                $scope.sgDelObject(item);
                            }
                        }
                    };
                    $scope.myLookup = $attrs.sgLookup ? $scope.sgLookup : null;
                    $scope.myLookupTitle = $attrs.sgLookupTitle ? $scope.sgLookupTitle : null;
                    $scope.columns = sgColumn($scope).Parse($attrs.sgColumns);
                    $scope.sortGrid = function(sortOrder) {
                        if ($scope.sgSortOptions) {
                            var sortBy = _.find($scope.sgSortOptions, { 'selected': true });
                            if (sortBy) {
                                sortIt(sortBy.name, sortOrder);
                            }
                        }
                    };
                    //$scope.sortGrid(true);

                    $scope.export = function(){
                        var docTitle;
                        if ($scope.sgExportTitle)
                            docTitle = localizedMessages.get($scope.sgExportTitle);
                        else
                            docTitle = "Table";
                        var d = (!$scope.listItems || $scope.listItems.length == 0) ? $scope.data:$scope.listItems;
                        simpleGridExport.export($scope.columns, d,docTitle);
                    };
                    if ($attrs.gridHeight)
                        $scope.scrollStyle = "max-height:" + $attrs.gridHeight +";overflow-y:auto";
                    else
                        $scope.scrollStyle = "";

                    $scope.modalSearchReset = function(){
                        if ($scope.modalSearchCriteria) {
                            $scope.modalSearchCriteria = undefined;
                            $scope.changed(pageSetting.currentPage);
                        }
                    }
                    $scope.modalSearch = function() {
                        var s = $scope.sgModalSearchResolve;
                        s.item = function () {
                            return   $scope.modalSearchCriteria || {};
                        };
                        var  modalInstance = $modal.open({
                            templateUrl: $scope.sgModalSearchTemplate,
                            controller: $scope.sgModalSearchController,
                            resolve: $scope.sgModalSearchResolve
                        });

                        modalInstance.result.then(function (r) {
                            $scope.modalSearchCriteria = r;
                            $scope.changed(pageSetting.currentPage);
                        }, function () {
                        });

                    };

                    $scope.clickRow = function(row,e){
                        if (e.ctrlKey) {
                            row.$__selected = !row.$__selected;
                        }
                        else {
                            if (row.hasOwnProperty("id")){
                                if (angular.isFunction(row.$core) && row.$core() && row.hasOwnProperty("accountid"))
                                    $scope.sgOnClick({id: row});
                                else
                                    $scope.sgOnClick({id: row.id});
                            }
                            else
                                $scope.sgOnClick({id: row});
                        }

                    }
                    $scope.checkAll = function(){
                        $scope.checkedAll = !$scope.checkedAll;
                        _($scope.items).forEach(function(i){
                            i.$__selected = $scope.checkedAll;
                        });
                    };
                    $scope.resetChecks = function(){
                        var c = _.find($scope.columns, {name: $scope.sgCheckColumn});
                        if (c) c.checkedAll = false;
                        _($scope.items).forEach(function(i){
                            if (i.hasOwnProperty("$__selected"))
                                delete(i["$__selected"]);
                        });
                    };
                    $scope.getIndex = function(item){
                        return  $scope.items.indexOf(item)+1;
                    };
                    $scope.changed = function(page, reset) {
                        var ps = pageSetting.pageSize;
                        pageSetting.currentPage = page;
                        if (reset){
                            $scope.resetChecks();
                        }
                        var scopeData = $scope.data;
                        if ($scope.modalSearchCriteria){
                            scopeData = $scope.sgModalSearch({list:scopeData,c:$scope.modalSearchCriteria,lk:$scope.myLookup});
                        }
                        var data = null;
                        if ($scope.sgGlobalSearch && breadcrumbs.listingSearch && breadcrumbs.listingSearch!="")
                        {
                            var searchString = breadcrumbs.listingSearch.toLowerCase();
                            data = _.filter(scopeData, function(i){
                                for (var c = 0; c< $scope.columns.length; c++){
                                    var col =  $scope.columns[c].name;
                                    var value = i[col];
                                    if ($scope.myLookup)
                                        value = $scope.myLookup({col: col, value:value, item:i});
                                    if (value) {
                                        if (value.toString().toLowerCase().indexOf(searchString)>-1)
                                            return true;
                                    }
                                }
                                if ($scope.sgCustomSearch){
                                    return $scope.sgCustomSearch({item: i, search: searchString});
                                }
                                return false;
                            });
                            pageSetting.totalItems = data.length;
                            var maxPages = Math.ceil(pageSetting.totalItems / ps);
                            if (page>maxPages){
                                page = 1;
                                pageSetting.currentPage = page;
                            }
                        }
                        else
                            data =  scopeData;

                        if ($scope.listItems && angular.isArray($scope.listItems)){
                            $scope.listItems.length = 0;
                            $scope.listItems.push.apply($scope.listItems, data);
                        }

                        var l = $scope.sgVirtual ? angular.copy(data) : _.take(_.rest(data, (page - 1) * ps), ps);
                        var loader = function(){
                            if ($scope.items) {
                                $scope.items.length = 0;
                                $scope.items.push.apply($scope.items, l);
                            }
                            else
                                $scope.items = l;

                            pageSetting.totalItems = data.length;

                            $scope.footer = localizedMessages.get(pageSetting.totalItems<=pageSetting.pageSize?'common.totalcount1Page': 'common.totalcount',
                                {
                                    from: ps * (page - 1) + 1,
                                    to: Math.min(ps* page,pageSetting.totalItems) ,
                                    total: pageSetting.totalItems,
                                    size : pageSetting.pageSize
                                } );
                        };
                        if ($attrs.sgOnChange) {
                            crudWait.doWork("Please wait...", $scope.sgOnChange({items:l}), loader);
                        }
                        else {
                            loader();
                        }
                    };
                    if ($scope.sgGlobalSearch) {
                        $scope.$watch(function() {
                            return breadcrumbs.listingSearch ;
                        }, function() {
                            (function(x){
                                $timeout(function(){
                                    if (x==breadcrumbs.listingSearch) {
                                        $scope.changed(pageSetting.currentPage);
                                        console.log('search x:',x);
                                    }
                                }, 1000);
                            })(breadcrumbs.listingSearch);
                        });
                        breadcrumbs.setlistingSearchModel($scope.sgGlobalSearch);
                    }

                    if (!breadcrumbs.listingPageSetting) breadcrumbs.listingPageSetting = {};
                    var pageSetting = $scope.pageSetting = breadcrumbs.listingPageSetting;
                    if (!pageSetting.hasOwnProperty('pageSize')) {
                        if ($scope.sgNoPager)
                            pageSetting.pageSize = 100;
                        else if ($scope.sgPageSize)
                            pageSetting.pageSize = parseInt($scope.sgPageSize);
                        else
                            pageSetting.pageSize = 20;
                        pageSetting.currentPage = 1;
                    }
                    pageSetting.totalItems = $scope.data.length;

                    $scope.$watchCollection(function() {
                        return $scope.data ;
                    }, function() {
                        $scope.changed(pageSetting.currentPage);
                    });

                    if (!pageSetting.initSort) {
                        pageSetting.initSort = $scope.sgSortField;
                        pageSetting.initSortOrder = true;
                        if (pageSetting.initSort && pageSetting.initSort.substr(0,1)=="!"){
                            pageSetting.initSortOrder = false;
                            pageSetting.initSort = pageSetting.initSort.substr(1);
                        }
                    }
                    if ($scope.columns && $scope.columns.length>0) {
                        var col = _.find($scope.columns, {name: pageSetting.initSort}) || $scope.columns[0];
                        col.sortOrder = pageSetting.initSortOrder;
                        $scope.sorter(col);
                    }
                }
            };
        }]);
/**
 * Created by gordon on 2014/4/16.
 */
angular.module('pzutil.tree', [])
    .factory('zTreeHelper', [function () {
        var buildTreeHelper = function(items, parentItem, ForeignKeyValue, ForeignKey, recursive, pos) {
            var r = _.filter(items, function (i) {
                var pid = i.parentid ? i.parentid : 0;
                if (ForeignKey) {
                    if (parentItem == null)
                        return i[ForeignKey] == ForeignKeyValue && pid == 0;
                    else
                        return pid == parentItem.id && i[ForeignKey] == ForeignKeyValue;
                }
                else
                    return (parentItem == null ?pid == 0 :pid == parentItem.id);
            });
            r = _.sortBy(_.sortBy(r, 'name'), 'position');
            if (parentItem != null)
                parentItem.children = r;

            if (recursive || pos) {
                var pos = 1;
                _(r).forEach(function (i) {
                    if (pos)
                        i.position = pos;
                    if (recursive)
                        buildTreeHelper(items, i, ForeignKeyValue, ForeignKey, recursive, pos);
                    pos++;
                });
            }
            return r;
        };

        var buildDropdownListHelper = function(result, ForeignKey, breadcrumb, items) {
            _(items).forEach(function(i) {
                var text = breadcrumb + i.name;
                if (i[ForeignKey])
                    result.push({id : i.id, name: text});

                buildDropdownListHelper(result,ForeignKey, i.id ? text + " >> " :"", i.children);
            });
        }

        var findBuddy = function(primary, foreign, foreignKey, item, up) {
            var fk = item[foreignKey];
            var pid = 0;
            var col;
            if (fk) {
                pid =  item.parentid ? item.parentid : 0;
                col = (pid==0 ? _.find(primary, { id : fk }): _.find(foreign, { id : pid  })).children;
            }
            else
                col = primary;
            if (up)
                return _.findLast(col, function(i) {
                    var pid2 = i.parentid ? i.parentid : 0 ;
                    console.log(i.position.toString() + ':' + item.position.toString());
                    return (pid==pid2 && i.position<item.position) ;
                });
            else
                return _.find(col, function(i) {
                    var pid2 = i.parentid ? i.parentid : 0 ;
                    return (pid==pid2 && i.position>item.position) ;
                });
        };
        var getMaxId = function(array) {
            return uuid.v4();
        };
        var service = {
            updateTreeValue : function(o, propName, treeValue, replace){
                switch (replace){
                    case "2":
                        var v = o[propName];
                        if (v){
                            var vArray = v.split(',');
                            _(treeValue.split(',')).forEach(function(i){
                                var idx = vArray.indexOf(i);
                                if (idx>=0){
                                    vArray.splice(idx, 1);
                                }
                            });
                            o[propName] =  vArray.join(',');
                        }
                        break;
                    case "1":
                        o[propName] =  treeValue;
                        break;
                    default:
                        var v = o[propName];
                        if (v){
                            var vArray = v.split(',');
                            _(treeValue.split(',')).forEach(function(i){
                                if (vArray.indexOf(i)<0){
                                    vArray.push(i);
                                }
                            });
                            o[propName] =  vArray.join(',');
                        }
                        else
                            o[propName] =  treeValue;
                        break;
                }
            },
            buildTree : function(primary, foreign, foreignKey, recursive, pos)
            {
                if (foreignKey) {
                    var position = 1;
                    if (pos)
                        primary.sort(function(a,b){
                            return (a.position - b.position);
                        });
                    _(primary).forEach(function(obj){
                        if (pos)
                            obj.position = position;
                        obj.children = buildTreeHelper(foreign, null, obj.id, foreignKey, recursive, pos);
                        position++;
                    });
                }
                else
                    buildTreeHelper(foreign, null, null, foreignKey, recursive, pos);
            },

            addTreeItem : function(item, primary, foreign, foreignKey, primaryFactory, foreignFactory, cb)
            {
                if (item) {
                    if (item.root && primaryFactory) {
                        var i = primaryFactory();
                        i.children= [];
                        i.id = getMaxId(primary);
                        primary.push(i);
                    }
                    else {
                        var i = foreignFactory();
                        i.children= [];
                        i.id = getMaxId(foreign);
                        if (foreignKey) {
                            if (item[foreignKey])
                            {
                                i[foreignKey] = item[foreignKey];
                                i.parentid = item.id;
                            }
                            else {
                                i[foreignKey] =  item.id;
                            }
                        }
                        else
                        {
                            if (!item.root)
                                i.parentid = item.id;
                        }
                        foreign.push(i);
                    }
                    cb();
                }
            },

            moveTreeItem : function(primary, foreign, foreignKey, item, up, cb) {
                var buddy = findBuddy(primary, foreign, foreignKey, item, up);
                if (buddy)
                {
                    var pos = item.position;
                    item.position = buddy.position;
                    buddy.position = pos;
                    cb();
                }
            },
            buildDropdownList : function(foreignKey, items) {
                var r = [];
                buildDropdownListHelper(r, foreignKey, '', items);
                return r;
            }
        };
        return service;
    }]);
/**
 * Created by gordon on 2014/5/4.
 */
angular.module('pzutil.ztemplate', ['pzutil.services'])
    .directive('zTemplate',['localizedMessages', '$compile', function (localizedMessages,$compile) {
        return {
            restrict: 'A',
            scope: false,
            compile: function(element, attrs)
            {
                return function(scope, element, attrs) {
                    var sc = element.scope();
                    var template = sc.$eval(attrs.zTemplate);
                    element.append($compile(template)(sc));
                };
            }
        }
    }]);

angular.module("template/aditem/aditem.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/aditem/aditem.tpl.html",
    "<script type=\"text/ng-template\"  id=\"html.tpl.html\">\n" +
    "    <div ng-style=\"itemStyle\" ng-class=\"itemClass\"  >\n" +
    "        <span z-template=\"item.props.html\" ></span>\n" +
    "    </div>\n" +
    "</script>\n" +
    "<script type=\"text/ng-template\"  id=\"taxonImage.tpl.html\">\n" +
    "    <a href=\"#\" target=\"_blank\">\n" +
    "        <img ng-src=\"{{item.props.images | zImageUrl:'s2kcontainer'}}\" ng-style=\"itemStyle\" ng-class=\"itemClass\"  />\n" +
    "        <div class=\"carousel-caption\">\n" +
    "            <p>{{item.props.title}}</p>\n" +
    "        </div>\n" +
    "    </a>\n" +
    "\n" +
    "</script>\n" +
    "<script type=\"text/ng-template\"  id=\"productImagePrice.tpl.html\">\n" +
    "    <a href=\"product/{{item.product.productid}}\" target=\"_blank\">\n" +
    "        <img ng-src=\"{{item.product.image | zImageUrl:'s2kcontainer'}}\"  ng-style=\"itemStyle\" ng-class=\"itemClass\"  />\n" +
    "        <div class=\"carousel-caption\">\n" +
    "            <p>{{item.product.retail}}</p>\n" +
    "        </div>\n" +
    "    </a>\n" +
    "</script>\n" +
    "<script type=\"text/ng-template\"  id=\"promotion.tpl.html\">\n" +
    "    <a href=\"#\" target=\"_blank\">\n" +
    "        <img ng-src=\"{{item.props.images | zImageUrl:'s2kcontainer'}}\"  ng-style=\"itemStyle\"  ng-class=\"itemClass\" />\n" +
    "        <div class=\"carousel-caption\">\n" +
    "            <p>{{item.props.title}}</p>\n" +
    "        </div>\n" +
    "    </a>\n" +
    "\n" +
    "</script>\n" +
    "<script type=\"text/ng-template\"  id=\"imageClickable.tpl.html\">\n" +
    "    <a href=\"{{item.props.targetUrl}}\" target=\"_blank\">\n" +
    "        <img ng-src=\"{{item.props.images | zImageUrl:'s2kcontainer'}}\" ng-style=\"itemStyle\"  ng-class=\"itemClass\"/></a>\n" +
    "</script>\n" +
    "<script type=\"text/ng-template\"  id=\"imageNotClickable.tpl.html\">\n" +
    "    <img ng-src=\"{{item.props.images | zImageUrl:'s2kcontainer'}}\" ng-style=\"itemStyle\"  ng-class=\"itemClass\" />\n" +
    "</script>\n" +
    "<div ng-include=\"getItemTemplate()\">\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("template/adpublish/adpublish_grid.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/adpublish/adpublish_grid.tpl.html",
    "<div>\n" +
    "    <div  ng-if=\"!loading && items && items.length\">\n" +
    "        <div class=\"page-header\" >\n" +
    "            <h3>{{ placeText | i18n }}</h3>\n" +
    "        </div>\n" +
    "        <div ng-repeat=\"item in items\" class=\"col-md-4\" style=\"padding-top:10px;padding-bottom: 10px\">\n" +
    "            <ad-item item=\"item\" item-class=\"itemClass\" item-style=\"itemStyle\"></ad-item>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <i class=\"fa fa-spinner fa-spin fa-2x\" ng-if=\"loading\" style=\"position: absolute;left: 50%;top: 50%;\"/>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("template/adpublish/adpublish_list.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/adpublish/adpublish_list.tpl.html",
    "<div>\n" +
    "    <div  ng-if=\"!loading && items && items.length\">\n" +
    "        <div ng-repeat=\"item in items\" class=\"col-md-12\" style=\"padding-top:10px;padding-bottom: 10px\">\n" +
    "            <ad-item item=\"item\" item-class=\"itemClass\" item-style=\"itemStyle\"></ad-item>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <i class=\"fa fa-spinner fa-spin fa-2x\" ng-if=\"loading\" style=\"position: absolute;left: 50%;top: 50%;\"/>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("template/adpublish/adpublish_slide.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/adpublish/adpublish_slide.tpl.html",
    "<div>\n" +
    "    <div  ng-if=\"!loading\">\n" +
    "        <carousel interval=\"5000\">\n" +
    "            <slide ng-repeat=\"item in items\" active=\"item.active\">\n" +
    "                <ad-item item=\"item\" item-class=\"itemClass\" item-style=\"itemStyle\"></ad-item>\n" +
    "            </slide>\n" +
    "        </carousel>\n" +
    "    </div>\n" +
    "    <i class=\"fa fa-spinner fa-spin fa-2x\" ng-if=\"loading\" style=\"position: absolute;left: 50%;top: 50%;\"/>\n" +
    "</div>");
}]);

angular.module("template/modal/modal-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/modal-form.html",
    "<div>\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3>{{heading()}}</h3>\n" +
    "    </div>\n" +
    "    <div ng-transclude></div>\n" +
    "</div>");
}]);

angular.module("template/modal/modal.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/modal.html",
    "<div>\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3>{{heading()}}</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div ng-transclude></div>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <div class=\"btn-toolbar page-header-ztree\" role=\"toolbar\">\n" +
    "            <button type=\"button\" class=\"btn btn-default\"  ng-click=\"ok()\"><i class=\"fa fa-save\"></i> OK</button>\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"cancel()\"><i class=\"fa fa-undo\"></i> Cancel</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/modal/wait.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/wait.html",
    "<div class=\"modal-body\">\n" +
    "    <div class=\"progress progress-striped active\">\n" +
    "        <div class=\"progress-bar\"  role=\"progressbar\" aria-valuenow=\"100\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 100%\">\n" +
    "            {{msg}}\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/export.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/export.html",
    "<crud-modal>\n" +
    "    <form name=\"form\"  class=\"form-horizontal\">\n" +
    "        <div class=\"form-group\">\n" +
    "            <z-input res=\"common.Export.format\" cols=\"2,6\" for=\"format\" type=\"select\" z-options=\"t.id as t.name for t in formats| orderBy:'name'\" required></z-input>\n" +
    "        </div>\n" +
    "        <div class=\"form-group\">\n" +
    "            <z-input res=\"common.Export.groupby\" cols=\"2,6\" for=\"groupby\" type=\"mselect\" data=\"groupbys\"></z-input>\n" +
    "        </div>\n" +
    "    </form>\n" +
    "</crud-modal>\n" +
    "");
}]);

angular.module("template/simplegrid/footer-virtual.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/footer-virtual.html",
    "<div class=\"row\">\n" +
    "    <div class=\"col-md-9\">\n" +
    "        Total # Of Records: <strong>{{pageSetting.totalItems}}</strong>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/footer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/footer.html",
    "<div class=\"row\">\n" +
    "    <div class=\"col-md-9\">\n" +
    "        <pagination ng-if=\"!sgNoPager && pageSetting.totalItems>pageSetting.pageSize\"\n" +
    "                    total-items=\"pageSetting.totalItems\" page=\"pageSetting.currentPage\" items-per-page=\"pageSetting.pageSize\" rotate=\"false\"\n" +
    "                    max-size=\"5\" class=\"pagination-sm\" boundary-links=\"true\"  on-select-page=\"changed(page, true)\" />\n" +
    "    </div>\n" +
    "    <div class=\"col-md-3 sg-footer\">\n" +
    "        <strong><a href=\"#\" editable-number=\"pageSetting.pageSize\" e-min=\"20\" e-max=\"400\" onaftersave=\"changed(1)\">\n" +
    "            {{footer}}</a> </strong>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/header.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/header.html",
    "<div class=\"row well well-sm sg-gridSearch\"  ng-if=\"sgModalSearchTemplate || sgExportTitle\" >\n" +
    "    <button type=\"button\" class=\"btn btn-success\"  ng-click=\"modalSearch()\" ng-if=\"sgModalSearchTemplate\"><i class=\"fa fa-search\"></i> {{'common.searchAdv' | i18n}}</button>\n" +
    "    <button type=\"button\" class=\"btn btn-default\"  ng-click=\"modalSearchReset()\" ng-if=\"sgModalSearchTemplate\"><i class=\"fa fa-undo\"></i> {{'common.Reset' | i18n}}</button>\n" +
    "    <button type=\"button\" class=\"btn btn-default\"  ng-click=\"export()\"><i class=\"fa fa-file-excel-o\"></i> {{'common.Export' | i18n}}</button>\n" +
    "    <button type=\"button\" class=\"btn btn-default pull-right\"  ng-click=\"checkAll()\" ng-if=\"sgModalSearchTemplate\"><i class=\"fa fa-check\"></i> {{'common.checkAll' | i18n}}</button>\n" +
    "    <span class=\"pull-right\" style=\"margin-right: 10px\"  ng-if=\"sgModalSearchTemplate\"><small>To select, press <kbd>CTRL</kbd> key to click</small></span>\n" +
    "</div>\n" +
    "<div class=\"row sg-gridheader\" >\n" +
    "    <div class=\"{{col.$getColumnClass()}}\" ng-click=\"col.$sort()\" ng-repeat=\"col in columns\">\n" +
    "        <span>{{col.$getTitle()}}</span>\n" +
    "        <i class=\"fa fa-long-arrow-down pull-right sg_gridIcon\" ng-show=\"!col.sortOrder && col.sortOrder!=undefined\" style=\"top:50%;\"></i>\n" +
    "        <i class=\"fa fa-long-arrow-up pull-right sg_gridIcon\" ng-show=\"col.sortOrder\" style=\"top:50%;\"></i>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid-dx.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid-dx.html",
    "<div class=\"sg-grid\">\n" +
    "    <ng-include src=\"'template/simplegrid/header.html'\"></ng-include>\n" +
    "    <div style=\"{{scrollStyle}}\">\n" +
    "        <div ng-repeat=\"item in items\" class=\"row sg-gridrow\" ng-click=\"clickRow(item,$event)\" ng-class=\"{true: 'sg-gridrow-active'}[item.$__selected]\" >\n" +
    "            <div class=\"{{col.$getColumnClass(item)}}\" ng-repeat=\"col in columns\">\n" +
    "                <i ng-if=\"$first && item.$__selected\" class=\"fa fa-circle\"></i>\n" +
    "                <i ng-if=\"col.bool\" ng-class=\"{true: 'fa fa-check'}[col.$getValue(item)]\"></i>\n" +
    "                <a href ng-if=\"$first && sgAllowDel\" ng-click=\"DelObject(item)\"><i class= 'glyphicon glyphicon-remove'></i></a>\n" +
    "                <ng-include  ng-if=\"col.template && (col.template.substr(0,9)=='readonly_' || !item.$core || !item.$core())\" src=\"col.template\"></ng-include>\n" +
    "                <span ng-if=\"!col.template || (item.$core && item.$core() && col.template.substr(0,9)!='readonly_')\">{{col.$getText(item)}}</span>\n" +
    "                <i ng-if=\"$last && item.$core && item.$core()\" class=\"fa fa-lock pull-right sg_gridIcon\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <ng-include src=\"'template/simplegrid/footer.html'\"></ng-include>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid-normal.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid-normal.html",
    "<div class=\"sg-grid\">\n" +
    "    <ng-include src=\"'template/simplegrid/header.html'\"></ng-include>\n" +
    "    <div style=\"{{scrollStyle}}\">\n" +
    "        <div ng-repeat=\"item in items\" class=\"row sg-gridrow\" ng-click=\"clickRow(item,$event)\" ng-class=\"{true: 'sg-gridrow-active'}[item.$__selected]\" >\n" +
    "            <div class=\"{{col.$getColumnClass(item)}}\" ng-repeat=\"col in columns\">\n" +
    "                <i ng-if=\"$first && item.$__selected\" class=\"fa fa-circle\"></i>\n" +
    "                <i ng-if=\"col.bool\" ng-class=\"{true: 'fa fa-check'}[col.$getValue(item)]\"></i>\n" +
    "                <a href ng-if=\"$first && sgAllowDel\" ng-click=\"DelObject(item)\"><i class= 'glyphicon glyphicon-remove'></i></a>\n" +
    "                <ng-include  ng-if=\"col.template && (col.template.substr(0,9)=='readonly_' || !item.$core || !item.$core())\" src=\"col.template\"></ng-include>\n" +
    "                <span ng-if=\"!col.template || (item.$core && item.$core() && col.template.substr(0,9)!='readonly_')\">{{col.$getText(item)}}</span>\n" +
    "                <i ng-if=\"$last && item.$core && item.$core()\" class=\"fa fa-lock pull-right sg_gridIcon\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <ng-include src=\"'template/simplegrid/footer.html'\"></ng-include>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid-simple.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid-simple.html",
    "<div class=\"sg-grid\">\n" +
    "    <ng-include src=\"itemtemplate\"></ng-include>\n" +
    "    <ng-include src=\"'template/simplegrid/footer.html'\"></ng-include>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid-virtual.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid-virtual.html",
    "<div class=\"sg-grid\" style=\"overflow: hidden\">\n" +
    "    <ng-include src=\"'template/simplegrid/header.html'\"></ng-include>\n" +
    "    <div style=\"{{scrollStyle}}\">\n" +
    "        <div sf-virtual-repeat=\"item in items\" class=\"row sg-gridrow\" ng-click=\"clickRow(item,$event)\" ng-class=\"{true: 'sg-gridrow-active'}[item.$__selected]\" >\n" +
    "            <div class=\"{{col.$getColumnClass()}}\" ng-repeat=\"col in columns\">\n" +
    "                <i ng-if=\"$first && item.$__selected\" class=\"fa fa-circle\"></i>\n" +
    "                <i ng-if=\"col.bool\" ng-class=\"{true: 'fa fa-check'}[col.$getValue(item)]\"></i>\n" +
    "                <a href ng-if=\"$first && sgAllowDel\" ng-click=\"DelObject(item)\"><i class= 'glyphicon glyphicon-remove'></i></a>\n" +
    "                <ng-include  ng-if=\"col.template && (!item.$core || !item.$core())\" src=\"col.template\"></ng-include>\n" +
    "                <span ng-if=\"!col.template || (item.$core && item.$core())\">{{col.$getText(item)}}</span>\n" +
    "                <i ng-if=\"$last && item.$core && item.$core()\" class=\"fa fa-lock pull-right sg_gridIcon\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <ng-include src=\"'template/simplegrid/footer-virtual.html'\"></ng-include>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid.html",
    "<div class=\"form-horizontal sg-grid\">\n" +
    "    <div>\n" +
    "        <button type=\"button\" class=\"btn btn-default\"  ng-click=\"sgAddObject()\"  ng-if=\"sgAddObject\"><i class=\"fa fa-plus\"></i> New</button>\n" +
    "    </div>\n" +
    "    <ng-include src=\"'template/simplegrid/header.html'\" ng-if=\"sgColumns\"></ng-include>\n" +
    "    <div style=\"{{scrollStyle}}\">\n" +
    "        <div ng-repeat=\"item in items\" style=\"padding: 3px 0px 3px\">\n" +
    "            <ng-include src=\"itemtemplate\"></ng-include>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <ng-include src=\"'template/simplegrid/footer.html'\"></ng-include>\n" +
    "</div>");
}]);
