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
                console.info(data.name,$scope.sgCheckColumn);
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

            mixin.prototype.$getColumnClass = function(){
                var w = this.width  ? this.width : 2;
                var checkbox = this.checkbox ? "checkbox checkbox-cell " :"";
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
            return mixin;
        }
        return factory;
    }])
    .directive('simpleGrid', ['sgColumn', 'breadcrumbs', 'localizedMessages','crudWait',
        function (sgColumn, breadcrumbs, localizedMessages,crudWait) {
            return {
                restrict:'E',
                replace:true,
                scope: { data:"=sgData",  sgAddObject:"&", sgSortOptions:"=", itemtemplate:"=sgTemplate",sgColumns:"@",sgDelObject:"&", sgAllowDel:"@",
                    sgNoPager:'=', sgOnClick:'&', sgLookup:"&", sgGlobalSearch:"@",sgPageSize:"@" ,sgOptions:"=", sgOnChange:"&", sgLookupTitle:"&",
                    sgCheckColumn:"@", sgCustomSearch:"&"},
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
                    else
                        return 'template/simplegrid/simpleGrid-normal.html';
                },
                link: function($scope, $element, $attrs, $controller) {
                   var sortIt = function(fieldName, sortOrder, sortField) {
                       var sortField = sortField || fieldName;
                       _($scope.columns).forEach(function(c){
                           if (c.name != fieldName)
                               c.sortOrder = undefined;
                       });
                       $scope.data.sort(function(a,b) {
                           var a1 = a[sortField];
                           var b1 = b[sortField];
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
                       sortIt(col.name, col.sortOrder, col.sortField);
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
                    $scope.sortGrid(true);

                    if ($attrs.gridHeight)
                        $scope.scrollStyle = "height:" + $attrs.gridHeight +";overflow-y:auto";
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

                    $scope.clickRow = function(row,e){
                        if (e.ctrlKey) {
                            row.$__selected = !row.$__selected;
                        }
                        else
                            $scope.sgOnClick({id: row.id});
                    }
                    $scope.checkAll = function(v){
                        $scope.checkedAll = !$scope.checkedAll;
                        _($scope.items).forEach(function(i){
                            i.$__selected = v;
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
                        console.log(page)
                        var data = null;
                        if ($scope.sgGlobalSearch && breadcrumbs.listingSearch && breadcrumbs.listingSearch!="")
                        {
                            var searchString = breadcrumbs.listingSearch.toLowerCase();
                            data = _.filter($scope.data, function(i){
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
                            data =  $scope.data;
                        var l = _.take(_.rest(data, (page - 1) * ps), ps);
                        var loader = function(){
                            if ($scope.items) {
                                $scope.items.length = 0;
                                $scope.items.push.apply($scope.items, l);
                            }
                            else
                                $scope.items = l;

                            pageSetting.totalItems = data.length;
                            $scope.footer = localizedMessages.get('common.totalcount',
                                {
                                    from: ps * (page - 1) + 1,
                                    to: Math.min(ps* page,pageSetting.totalItems) ,
                                    total: pageSetting.totalItems
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
                            $scope.changed(pageSetting.currentPage);
                        });
                    }

                    $scope.$watchCollection(function() {
                        return $scope.data ;
                    }, function() {
                        $scope.changed(pageSetting.currentPage);
                    });


                }
            };
    }]);