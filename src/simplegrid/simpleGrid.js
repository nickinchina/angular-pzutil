/**
 * Created by gordon on 2014/4/14.
 */
angular.module('pzutil.simplegrid', ['pzutil.services','pzutil.modal'])
    .factory('sgColumn', ['localizedMessages', function (localizedMessages) {

        var factory = function($scope) {

            var sorter = $scope.sorter, lookup = $scope.myLookup,lookupTitle = $scope.myLookupTitle;
            var mixin = function (data) {
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
                mixin.sorter(this.name, this.sortOrder)
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
                    sgNoPager:'=', sgOnClick:'&', sgLookup:"&", sgGlobalSearch:"@",sgPageSize:"@" ,sgOptions:"=", sgOnChange:"&", sgLookupTitle:"&"},
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
                   $scope.sorter = function(sortField, sortOrder) {
                        _($scope.columns).forEach(function(c){
                            if (c.name != sortField)
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
                            else
                                r = (a1 < b1 ? -1:1);
                            return r*(sortOrder? 1:-1);
                        });
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
                                $scope.sorter(sortBy.name, sortOrder);
                            }
                        }
                    };
                    $scope.sortGrid(true);
                    $scope.currentPage = 1;
                    $scope.totalItems = $scope.data.length;

                    if ($attrs.gridHeight)
                        $scope.scrollStyle = "height:" + $attrs.gridHeight +";overflow-y:auto";
                    else
                        $scope.scrollStyle = "";

                    if ($scope.pageSize ==undefined) {
                        if ($scope.sgNoPager)
                            $scope.pageSize = 100;
                        else if ($scope.sgPageSize)
                            $scope.pageSize = parseInt($scope.sgPageSize);
                        else
                            $scope.pageSize = 20;
                    }
                    $scope.checkedAll = false;
                    $scope.checkAll = function(v){
                        _($scope.items).forEach(function(i){
                            i.__selected = v;
                        });
                    };
                    $scope.getIndex = function(item){
                        return  $scope.items.indexOf(item)+1;
                    };
                    $scope.changed = function(page) {
                        if ($scope.currentPage != page){
                            $scope.currentPage = page;
                            $scope.checkedAll = false;
                        }
                        console.info('$scope.pageSize',$scope.pageSize);
                        var data = null;
                        if ($scope.sgGlobalSearch && breadcrumbs.listingSearch && breadcrumbs.listingSearch!="")
                        {
                            data = _.filter($scope.data, function(i){
                                for (var c = 0; c< $scope.columns.length; c++){
                                    var col =  $scope.columns[c].name;
                                    var value = i[col];
                                    if ($scope.myLookup)
                                        value = $scope.myLookup({col: col, value:value});
                                    if (value) {
                                        if (value.toString().toLowerCase().indexOf(breadcrumbs.listingSearch.toLowerCase())>-1)
                                            return true;
                                    }
                                }
                                return false;
                            });
                            $scope.totalItems = data.length;
                        }
                        else
                            data =  $scope.data;
                        var l = _.take(_.rest(data, (page - 1) * $scope.pageSize), $scope.pageSize);
                        var loader = function(){
                            if ($scope.items) {
                                $scope.items.length = 0;
                                $scope.items.push.apply($scope.items, l);
                            }
                            else
                                $scope.items = l;

                            $scope.totalItems = data.length;
                            $scope.footer = localizedMessages.get('common.totalcount',
                                {
                                    from: $scope.pageSize * ($scope.currentPage - 1) + 1,
                                    to: Math.min($scope.pageSize * $scope.currentPage,$scope.totalItems) ,
                                    total: $scope.totalItems
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
                            $scope.changed($scope.currentPage);
                        });
                    }

                    $scope.$watchCollection(function() {
                        return $scope.data ;
                    }, function() {
                        $scope.changed($scope.currentPage);
                    });


                }
            };
    }]);