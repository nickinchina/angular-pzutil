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
    .factory("simpleGridSearchWorker",['$q',function($q){
        var worker;
        return {
            search : function(crit, fun){
                var defer = $q.defer();
                var blob = new Blob(["onmessage = " + fun.toString()]);
                var blobURL = window.URL.createObjectURL(blob);
                if (worker) worker.terminate();
                worker = new Worker(blobURL);
                worker.addEventListener('message', function(e) {
                    console.log('Worker said: ', e.data);
                    defer.resolve(e.data);
                }, false);
                worker.postMessage(crit); // Send data to our worker.
                return defer.promise;
            }
        };

    }])
    .directive('simpleGrid', ['sgColumn', 'breadcrumbs', 'localizedMessages','crudWait', '$modal','simpleGridExport', 'simpleGridSearchWorker',
        function (sgColumn, breadcrumbs, localizedMessages,crudWait,$modal,simpleGridExport,simpleGridSearchWorker) {
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

                    var pageSetting = $scope.pageSetting = {};
                    if ($scope.sgNoPager)
                        pageSetting.pageSize = 100;
                    else if ($scope.sgPageSize)
                        pageSetting.pageSize = parseInt($scope.sgPageSize);
                    else
                        pageSetting.pageSize = 20;
                    pageSetting.currentPage = 1;
                    pageSetting.totalItems = $scope.data.length;

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
                    function globalSearch(crit){
                        var data = null;
                        if (crit.listingSearch && crit.listingSearch!="")
                        {
                            var searchString = crit.listingSearch.toLowerCase();
                            var sc = crit.scope;
                            data = _.filter(crit.scopeData, function(i){
                                for (var c = 0; c< sc.columns.length; c++){
                                    var col =  sc.columns[c].name;
                                    var value = i[col];
                                    if (sc.myLookup)
                                        value = sc.myLookup({col: col, value:value, item:i});
                                    if (value) {
                                        if (value.toString().toLowerCase().indexOf(searchString)>-1)
                                            return true;
                                    }
                                }
                                if (sc.sgCustomSearch){
                                    return sc.sgCustomSearch({item: i, search: searchString});
                                }
                                return false;
                            });
                        }
                        else
                            data = crit.scopeData;
                        return data;
                    };
                    function loadSearch(page, data){
                        var ps = pageSetting.pageSize;
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
                        var data = globalSearch({
                            scopeData : scopeData,
                            listingSearch : breadcrumbs.listingSearch,
                            scope : $scope
                        });
                        if (data != scopeData)
                        {
                            pageSetting.totalItems = data.length;
                            var maxPages = Math.ceil(pageSetting.totalItems / ps);
                            if (page>maxPages){
                                page = 1;
                                pageSetting.currentPage = page;
                            }
                        }
                        loadSearch(page, data);

                    };

                    if ($scope.sgGlobalSearch) {
                        $scope.$watch(function() {
                            return breadcrumbs.listingSearch ;
                        }, function() {
                            var scopeData = $scope.data;
                            if ($scope.modalSearchCriteria){
                                scopeData = $scope.sgModalSearch({list:scopeData,c:$scope.modalSearchCriteria,lk:$scope.myLookup});
                            }
                            simpleGridSearchWorker.search({
                                scopeData : scopeData,
                                listingSearch : breadcrumbs.listingSearch,
                                scope : $scope
                            }, globalSearch).then(function(r){
                                loadSearch(pageSetting.currentPage, r);
                            })
                        });
                        breadcrumbs.setlistingSearchModel($scope.sgGlobalSearch);
                    }

                    $scope.$watchCollection(function() {
                        return $scope.data ;
                    }, function() {
                        $scope.changed(pageSetting.currentPage);
                    });

                    var initSort = $scope.sgSortField;
                    var initSortOrder = true;
                    if (initSort && initSort.substr(0,1)=="!"){
                        initSortOrder = false;
                        initSort = initSort.substr(1);
                    }
                    if ($scope.columns && $scope.columns.length>0) {
                        var col = _.find($scope.columns, {name: initSort}) || $scope.columns[0];
                        col.sortOrder = initSortOrder;
                        $scope.sorter(col);
                    }
                }
            };
    }]);