/**
 * Created by gordon on 2014/4/14.
 */

var sgReactFunc = function( reactDirective ) {
      return reactDirective( 'sgReact' );
    };
sgReactFunc.$inject = ['reactDirective'];

angular.module('pzutil.simplegrid', ['pzutil.services','pzutil.modal'])
    .factory('sgColumn', ['localizedMessages', function (localizedMessages) {

        var factory = function($scope, sgFlexWidth) {

            var sorter = $scope.sorter,
                lookup = $scope.myLookup,
                lookupTitle = $scope.myLookupTitle,
                agg = $scope.sgAgg,
                charter = $scope.charter,
                modalEditor = $scope.modalEdit,
                clickRow = $scope.clickRow;

            var mixin = function (data, idx) {
                data.checkbox = ($scope.sgCheckColumn == data.name);
                data._width = data.width||2;
                data._index = idx;
                delete data.width;
                angular.extend(this, data);
            };
            Object.defineProperty(mixin.prototype, "width", {
                get: function() {
                    if (this._index==0 && $scope.sgAllowDel && !$scope.sgReadonly)
                        return this._width - 0.5;
                    else
                        return this._width;
                }
            });
            mixin.sorter = sorter;
            mixin.charter = charter;
            mixin.New = function(o) { return new mixin(o);};
            mixin.Parse = function(attr) {
                if (attr) {
                    var data = angular.fromJson(attr);
                    var result = [];
                    for (var i = 0; i < data.length; i++) {
                        result.push(new mixin(data[i], i));
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

            mixin.prototype.showSpan = function(item)
            {
                if ($scope.sgReadonly) return true;
                if (!this.template&&!this.editTemplate) return true;
                if (this.template && item.$core && item.$core() && this.template.substr(0,9)!='readonly_') return true;
                return false;
            };

            mixin.prototype.$getColumnStyle = function(item){
                var w = this.width ;
                if (sgFlexWidth)
                    return 'width:' + w + 'px;float:left';
                else
                    return '';
            };
            
            mixin.prototype.$getColumnStyleReact = function(){
                var w = this.width ;
                if (sgFlexWidth)
                    return {width: w + 'px', float:'left'};
                else
                    return {};
            };

            mixin.prototype.$getColumnClass = function(item){
                var w = this.width  ? this.width : 2;
                var checkbox = this.checkbox ? "checkbox checkbox-cell " :"";
                var inactive = (item && item.inactive);
                if (inactive) checkbox += "sg-deleted ";
                if ($scope.hasEditInput()) checkbox += "sg-gridrow-cell-edit ";
                if (sgFlexWidth)
                    w = "";
                else
                    w = 'col-sg-' +  w * 2;
                if (this.align && !!item)
                    return checkbox + 'sg-gridrow-cell ' + w + ' text-' + this.align;
                else
                    return checkbox + 'sg-gridrow-cell ' + w;
            };
            mixin.prototype.$modalEdit = function(item, e){
                if (this.modalEdit){
                    modalEditor(item,this, $(e.target));
                }
            };
            mixin.prototype.$getComboKey=function(type){
                switch (type){
                    case 1:
                        return "comboActiveIdx_" + this.name;
                    case 2:
                        return "comboIsOpen_" + this.name;
                    case 3:
                        return "comboSelect_" + this.name;
                    case 4:
                        return "comboPosition_" + this.name;
                    default:
                        return 'comboList_' + this.name;
                }
            }
            mixin.prototype.$sort = function(){
                this.sortOrder = !this.sortOrder;
                mixin.sorter(this);
            };
            mixin.prototype.$chart = function(){
                mixin.charter(this);
            };
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
            mixin.prototype.$aggregate = function(item){
                return agg({col:this.name});
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
                            alert(e.message);
                        });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }])
    .directive('contextMenu', ['$parse',function ($parse) {
        var renderContextMenu = function ($scope, event, options) {
            if (!$) { var $ = angular.element; }
            $(event.currentTarget).addClass('context');
            var $contextMenu = $('<div>');
            $contextMenu.addClass('dropdown clearfix');
            var $ul = $('<ul>');
            $ul.addClass('dropdown-menu');
            $ul.attr({ 'role': 'menu' });
            $ul.css({
                display: 'block',
                position: 'absolute',
                left: event.pageX + 'px',
                top: event.pageY + 'px'
            });
            angular.forEach(options, function (item, i) {
                var $li = $('<li>');
                if (item === null) {
                    $li.addClass('divider');
                } else {
                    $a = $('<a>');
                    $a.attr({ tabindex: '-1', href: '#' });
                    $a.text(typeof item[0] == 'string' ? item[0] : item[0].call($scope, $scope));
                    $li.append($a);
                    $li.on('click', function ($event) {
                        $event.preventDefault();
                        $scope.$apply(function () {
                            $(event.currentTarget).removeClass('context');
                            $contextMenu.remove();
                            item[1].call($scope, $scope);
                        });
                    });
                }
                $ul.append($li);
            });
            $contextMenu.append($ul);
            var height = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            $contextMenu.css({
                width: '100%',
                height: height + 'px',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 9999
            });
            $(document).find('body').append($contextMenu);
            $contextMenu.on("mousedown", function (e) {
                if ($(e.target).hasClass('dropdown')) {
                    $(event.currentTarget).removeClass('context');
                    $contextMenu.remove();
                }
            }).on('contextmenu', function (event) {
                $(event.currentTarget).removeClass('context');
                event.preventDefault();
                $contextMenu.remove();
            });
        };
        return function ($scope, element, attrs) {
            var options = $scope.$eval(attrs.contextMenu);
            if (options instanceof Array) {
                element.on('contextmenu', function (event) {
                    $scope.$apply(function () {
                        event.preventDefault();
                        renderContextMenu($scope, event, options);
                    });
                });
            }
        };
    }])
    .directive('comboEditPopup', function () {
        return {
            restrict:'EA',
            scope:{
                items:'=',
                active:'=',
                isopen:'=',
                position:'=',
                select:'&'
            },
            replace:true,
            templateUrl:'template/simplegrid/combo-edit.html',
            link:function (scope, element, attrs) {
                scope.isActive = function (matchIdx) {
                    return scope.active == matchIdx;
                };

                scope.selectActive = function (matchIdx) {
                    scope.active = matchIdx;
                };

                scope.selectMatch = function (activeIdx) {
                    scope.select({activeIdx:activeIdx});
                };
            }
        };
    })
    .directive('simpleGridChart', [ function() {
        return {
            restrict:'E',
            replace: true,
            scope: {
                scChartType:"=",scCategory:"=",scSeries:"=", scData:"=",scSeriesClick:"&",scKeylookup:"&",scInstance:"="
            },
            templateUrl: 'template/simplegrid/chart.html',
            link: function(scope, iElement, iAttrs ) {
                scope.items_chart = [];
                scope.items = new kendo.data.DataSource({data: []});
                scope.scChartInstance = scope.scChartInstance ||{};
                var chartIt = function(){
                    scope.items_chart.length = 0;
                    if (scope.scData.length>0){
                        var g;
                        if (scope.scData[0].hasOwnProperty(scope.scCategory))
                            g = _.groupBy(scope.scData, scope.scCategory);
                        else {
                            var lines = [];
                            _(scope.scData).forEach(function(i){
                                lines.push.apply(lines, i.lines);
                            });
                            g = _.groupBy(lines, scope.scCategory);
                        }
                        for (var key in g){
                            var item = {category : scope.scKeylookup({col: scope.scCategory, value:g[key][0][scope.scCategory]})};
                            scope.items_chart.push(item);
                            _(g[key]).forEach(function(i){
                                _(scope.scSeries).forEach(function(j){
                                    var s = j.field;
                                    var o = item[s] || 0;
                                    item[s] = o + (i[s] || 0);
                                })
                            })
                        }
                    }
                    if (scope.items_chart.length>0){
                        var i = scope.items_chart[0][scope.scCategory];
                        if (!angular.isString(i) || !moment(i).isValid()){
                            var f = scope.scSeries[0].field;
                            scope.items_chart.sort(function(a,b){
                                return b[f]-a[f];
                            });
                            if (scope.items_chart.length>10){
                                var other = {};
                                other[scope.scCategory] = '(Other)';
                                var toRemove = scope.items_chart.length-10;
                                var count = 0;
                                while (count<toRemove){
                                    var pi = scope.items_chart.pop();
                                    _(scope.scSeries).forEach(function(j){
                                        var s = j.field;
                                        var o = other[s] || 0;
                                        other[s] = o + (pi[s] || 0);
                                    })
                                    count ++;
                                }
                                scope.items_chart.push(other);
                            }
                        }
                    }
                    scope.items.data(scope.items_chart);
                    if (scope.kendoInstance){
                        var chartOptions = scope.kendoInstance.options;
                        chartOptions.series.length = 0;
                        _(scope.scSeries).forEach(function(s){
                            chartOptions.series.push(new Object());
                            chartOptions.series[chartOptions.series.length-1].field = s.field;
                            chartOptions.series[chartOptions.series.length-1].name = s.name;
                        });
                        scope.kendoInstance.refresh();
                    }
                }
                scope.scInstance = scope.scInstance ||{};
                scope.scInstance.refresh = chartIt;
                scope.$watchCollection(function() {
                    return scope.scData ;
                }, chartIt);
            }
        };
    } ])
    .directive('simpleGrid', ['sgColumn', 'breadcrumbs', 'localizedMessages','crudWait', '$modal','simpleGridExport','$timeout', '$position','$compile','$document','httpRequestTracker',
        function (sgColumn, breadcrumbs, localizedMessages,crudWait,$modal,simpleGridExport,$timeout,$position,$compile,$document,httpRequestTracker) {
            return {
                restrict:'E',
                replace:true,
                scope: { data:"=sgData", listItems:"=",  sgAddObject:"&", sgSortOptions:"=", itemtemplate:"=sgTemplate",sgColumns:"@",sgDelObject:"&", sgAllowDel:"@",
                    sgNoPager:'=', sgOnClick:'&', sgLookup:"&", sgGlobalSearch:"@", sgLocalSearch:"@",sgPageSize:"@" ,sgOptions:"=", sgOnChange:"&", sgLookupTitle:"&",sgSortField:"=",sgVirtual:"@",
                    sgCheckColumn:"@", sgCustomSearch:"&", sgModalSearchTemplate:"=", sgModalSearchController:"=", sgModalSearchResolve:"=", sgModalSearch:"&", sgExportTitle:"@",
                    sgPublic:"=", sgAgg:"&", sgReadonly:"=", sgMenu:"=", sgModalEdit:"&", sgFlexWidth:"=",sgExportColumns:"@"},
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
                    $scope.hasSummary = !!$attrs.sgAgg;
                    var comboScope = $scope.$new();
                    $element.on('$destroy', function(){
                        $scope.$destroy();
                    });
                    $scope.$on('$destroy', function(){
                        while ($popups.length>0)
                            $popups.pop().remove();
                        comboScope.$destroy();
                    });
                    $scope.modalEdit = function(item, col, e){
                        var keyPos = col.$getComboKey(4);
                        comboScope[keyPos] = $position.offset(e);
                        comboScope[keyPos].top = comboScope[keyPos].top + e.prop('offsetHeight');
                        $scope.activeRow = item;
                        comboScope[col.$getComboKey(2)]=true;
                        e.attr('aria-expanded', true);
                    }
                    var sortIt = function(fieldName, sortOrder, sortField, useLookup) {
                        var d = new Date();
                        var sortField = sortField || fieldName;
                        _($scope.columns).forEach(function(c){
                            if (c.name != fieldName)
                                c.sortOrder = undefined;
                        });
                        var sortByFoo = crossfilter.quicksort.by(function(a) {
                            var r ;
                            if (!a.hasOwnProperty(sortField) || useLookup)
                                r = $scope.myLookup ?$scope.myLookup({col:sortField,item: a}):undefined;
                            else
                                r = a[sortField];
                            if (angular.isString(r)) r = r.toLowerCase();
                            return r;
                        });
                        sortByFoo($scope.gridData, 0, $scope.gridData.length);
                        if (!sortOrder) $scope.gridData.reverse();
                        loader();
                        console.log("sort",new Date()-d);
                        /*
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
                         */
                    }
                    $scope.scInstance = {};
                    $scope.chartSeries = [];
                    $scope.charter = function(col) {
                        var s = $scope.chartSeries;
                        var f = _.find(s, {field:col.name});
                        if (f) {
                            var index = s.indexOf(f);
                            s.splice(index, 1);
                        }
                        else {
                            s.push({
                                field : col.name,name: col.$getTitle()
                            });
                        }
                        if (s.length==0)
                            $scope.chartCategory = undefined;
                        else {
                            var c = _.find($scope.columns, {chartCategory:true});
                            if (c) {
                                if ($scope.chartCategory == c.name)
                                    $scope.scInstance.refresh();
                                else
                                    $scope.chartCategory = c.name;
                            }
                        };
                    };
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
                    $scope.chartLookup=function(col,value){
                        if ($scope.myLookup)
                            return $scope.myLookup({col:col, value:value});
                        return value;
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
                    $scope.myLookup = $attrs.sgLookup ? $scope.sgLookup : null;
                    $scope.myLookupTitle = $attrs.sgLookupTitle ? $scope.sgLookupTitle : null;
                    $scope.columns = sgColumn($scope, $scope.sgFlexWidth).Parse($attrs.sgColumns);
                    if ($attrs.sgExportColumns) $scope.exportColumns = sgColumn($scope).Parse($attrs.sgExportColumns);

                    var $popups = [];
                    $scope.hasEditInput = function(){
                        if ($scope.sgReadonly) return false;
                        return !!_.find($scope.columns, function(c){
                            return c.template && c.template.substr(0,9)!='readonly_';
                        });
                    };
                    _($scope.columns).forEach(function(c){
                        if (c.modalEdit){
                            var keyActive = c.$getComboKey(1);
                            var key = c.$getComboKey(0);
                            var keySelect = c.$getComboKey(3);
                            comboScope[keySelect] = (function(col, listKey, openKey){
                                return function(activeIdx){
                                    $scope.activeRow[col] = comboScope[listKey][activeIdx].id;
                                    comboScope[openKey]=false;
                                };
                            })(c.name,c.$getComboKey(0),c.$getComboKey(2));
                            comboScope[key] = $scope.sgModalEdit({col: c.name});
                            var popUpEl = angular.element('<div combo-edit-popup></div>');
                            popUpEl.attr({
                                items: key,
                                active: keyActive,
                                select: keySelect +'(activeIdx)',
                                position: c.$getComboKey(4),
                                isopen : c.$getComboKey(2)
                            });
                            var $popup = $compile(popUpEl)(comboScope);
                            popUpEl.remove();
                            $document.find('body').append($popup);
                            $popups.push($popup);
                        }
                    });
                    Object.defineProperty($scope, 'activeRow', {
                        get: function() {
                            return $scope.__activeRow;
                        },
                        set : function(row){
                            $scope.__activeRow = row;
                            _($scope.columns).forEach(function(c){
                                if (c.modalEdit){
                                    var keyActive = c.$getComboKey(1);
                                    var key = c.$getComboKey(0);
                                    var id = row[c.name];
                                    var list = comboScope[key];
                                    var s = _.find(list, {id:id});
                                    comboScope[keyActive] = list.indexOf(s);
                                }
                            });
                        }
                    });

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
                        var d = (!$scope.listItems || $scope.listItems.length == 0) ? $scope.gridData:$scope.listItems;
                        simpleGridExport.export($scope.exportColumns || $scope.columns, d,docTitle);
                    };
                    if ($attrs.gridHeight)
                        $scope.scrollStyle = "max-height:" + $attrs.gridHeight +";overflow-y:auto";
                    else
                        $scope.scrollStyle = "";

                    $scope.modalSearchReset = function(){
                        if (pageSetting.modalSearchCriteria) {
                            pageSetting.modalSearchCriteria = undefined;
                            $scope.changed(pageSetting.currentPage);
                        }
                    }
                    $scope.modalSearch = function() {
                        var s = $scope.sgModalSearchResolve;
                        s.item = function () {
                            return   pageSetting.modalSearchCriteria || {};
                        };
                        var  modalInstance = $modal.open({
                            templateUrl: $scope.sgModalSearchTemplate,
                            controller: $scope.sgModalSearchController,
                            resolve: $scope.sgModalSearchResolve
                        });

                        modalInstance.result.then(function (r) {
                            pageSetting.modalSearchCriteria = r;
                            $scope.changed(pageSetting.currentPage);
                        }, function () {
                        });

                    };
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
                    $scope.public = $scope.sgPublic || {};
                    $scope.public.resetSearch = function(){
                        breadcrumbs.listingSearchModel = $scope.sgGlobalSearch;
                    };
                    $scope.public.columns = $scope.columns;
                    $scope.public.refresh = $scope.changed = function(page, reset) {
                        var ps = pageSetting.pageSize;
                        page = page || pageSetting.currentPage;
                        pageSetting.currentPage = page;
                        if (reset){
                            $scope.resetChecks();
                        }
                        var scopeData = $scope.data;
                        var data = null;
                        if (($scope.sgGlobalSearch || $scope.sgLocalSearch) && $scope.searchService.listingSearch && $scope.searchService.listingSearch!="")
                        {
                            var searchString = $scope.searchService.listingSearch.toLowerCase();
                            data = $scope.crossfilter.filterFunction(function(i){
                                return i.toLowerCase().indexOf(searchString)>-1;
                            }).top(Infinity);
                            pageSetting.totalItems = data.length;
                            var maxPages = Math.ceil(pageSetting.totalItems / ps);
                            if (page>maxPages){
                                page = 1;
                                pageSetting.currentPage = page;
                            }
                        }
                        else {
                            data = $scope.crossfilter.filterAll().top(Infinity);
                        }

                        if (pageSetting.modalSearchCriteria && $scope.sgModalSearchTemplate){
                            data = $scope.sgModalSearch({list:data,c:pageSetting.modalSearchCriteria,lk:$scope.myLookup});
                        }

                        if ($scope.listItems && angular.isArray($scope.listItems)){
                            $scope.listItems.length = 0;
                            $scope.listItems.push.apply($scope.listItems, data);
                        }
                        $scope.gridData = data;
                        runSort();
                    };
                    if ($scope.public.cb) $scope.public.cb();
                    function runSort(){
                        if ($scope.columns && $scope.columns.length>0) {
                            var col = _.find($scope.columns, {name: pageSetting.initSort}) || $scope.columns[0];
                            col.sortOrder = pageSetting.initSortOrder;
                            $scope.sorter(col);
                        }
                        else
                            loader();
                    }
                    function loader(){
                        var ps = pageSetting.pageSize;
                        var data = $scope.gridData;
                        var page = pageSetting.currentPage;
                        if ($scope.sgVirtual){
                            $scope.items = data;
                        }
                        else {
                            var l =  _.take(_.rest(data, (page - 1) * ps), ps);
                            if ($scope.items) {
                                $scope.items.length = 0;
                                $scope.items.push.apply($scope.items, l);
                            }
                            else
                                $scope.items = l;
                        }
                        pageSetting.totalItems = data.length;

                        $scope.footer = localizedMessages.get(pageSetting.totalItems<=pageSetting.pageSize?'common.totalcount1Page': 'common.totalcount',
                            {
                                from: ps * (page - 1) + 1,
                                to: Math.min(ps* page,pageSetting.totalItems) ,
                                total: pageSetting.totalItems,
                                size : pageSetting.pageSize
                            } );
                    };
                    if ($scope.sgGlobalSearch || $scope.sgLocalSearch) {
                        $scope.$watch(function() {
                            return $scope.searchService.listingSearch ;
                        }, function() {
                            (function(x){
                                $timeout(function(){
                                    if (x==$scope.searchService.listingSearch) {
                                        $scope.changed(pageSetting.currentPage);
                                    }
                                }, 500);
                            })($scope.searchService.listingSearch);
                        });
                        if ($scope.sgGlobalSearch) {
                            var rm = breadcrumbs.setlistingSearchModel($scope.sgGlobalSearch);
                            if (!rm.listingPageSetting) rm.listingPageSetting = {};
                            $scope.pageSetting = rm.listingPageSetting;
                            $scope.searchService = breadcrumbs;
                        }
                        else {
                            $scope.pageSetting = {};
                            $scope.searchService = {};
                        }
                    }
                    else {
                        $scope.pageSetting = {};
                        $scope.searchService = {};
                    }

                    var pageSetting = $scope.pageSetting;
                    if (!pageSetting.hasOwnProperty('pageSize')) {
                        if ($scope.sgNoPager)
                            pageSetting.pageSize = 100;
                        else if ($scope.sgPageSize)
                            pageSetting.pageSize = parseInt($scope.sgPageSize);
                        else
                            pageSetting.pageSize = 20;
                        pageSetting.currentPage = 1;
                    }
                    if (!!$scope.data) pageSetting.totalItems = $scope.data.length;

                    if (!pageSetting.initSort) {
                        pageSetting.initSort = $scope.sgSortField;
                        pageSetting.initSortOrder = true;
                        if (pageSetting.initSort && pageSetting.initSort.substr(0,1)=="!"){
                            pageSetting.initSortOrder = false;
                            pageSetting.initSort = pageSetting.initSort.substr(1);
                        }
                    }
                    $scope.$watchCollection(function() {
                        return $scope.data ;
                    }, function() {
                        var d = new Date();
                        $scope.crossfilter = crossfilter($scope.data).dimension(
                            function(i) {
                                var ret = '';
                                if (!!$scope.columns){
                                    for (var c = 0; c< $scope.columns.length; c++){
                                        var col =  $scope.columns[c].name;
                                        var value = i[col];
                                        if ($scope.myLookup)
                                            value = $scope.myLookup({col: col, value:value, item:i});
                                        if (value) ret+='|' + value;
                                    }
                                }
                                return ret;
                            });
                        console.log('crossfilter',new Date()-d);
                        $scope.changed(pageSetting.currentPage);
                    });

                }
            };
        }])
    .value("sgReact", sgReact)
    .directive( 'sgReact',  sgReactFunc);