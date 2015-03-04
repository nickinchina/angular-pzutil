/**
 * Created by gordon on 2014/4/14.
 */
angular.module('pzutil.simplegrid', ['pzutil.services','pzutil.modal'])
    .factory('sgColumn', ['localizedMessages', function (localizedMessages) {

        var factory = function($scope) {

            var sorter = $scope.sorter,
                lookup = $scope.myLookup,
                lookupTitle = $scope.myLookupTitle,
                agg = $scope.sgAgg,
                charter = $scope.charter,
                modalEditor = $scope.modalEdit,
                clickRow = $scope.clickRow,
                showDel = $scope.sgAllowDel && !$scope.sgReadonly;

            var mixin = function (data, idx) {
                data.checkbox = ($scope.sgCheckColumn == data.name);
                if (showDel && idx==0) {
                    data.width=(data.width||2) - 0.5;
                }
                angular.extend(this, data);
            };
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

            mixin.prototype.$getColumnClass = function(item){
                var w = this.width  ? this.width : 2;
                var checkbox = this.checkbox ? "checkbox checkbox-cell " :"";
                var inactive = (item && item.inactive);
                if (inactive) checkbox += " sg-deleted";
                w = w * 2;
                if (this.align)
                    return checkbox + 'sg-gridrow-cell col-sg-' + w + ' text-' + this.align;
                else
                    return checkbox + 'sg-gridrow-cell col-sg-' + w;
            };
            mixin.prototype.$modalEdit = function(item, e){
                console.log(e.target);
                if (this.modalEdit)
                    modalEditor(item,this, $(e.target));
                else
                    clickRow(item,e);
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
                            console.log(e);
                            alert(e.message);
                        });
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }])
    .directive('contextMenu', function ($parse) {
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
    })
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
    .directive('simpleGrid', ['sgColumn', 'breadcrumbs', 'localizedMessages','crudWait', '$modal','simpleGridExport','$timeout', '$position','$compile','$document',
        function (sgColumn, breadcrumbs, localizedMessages,crudWait,$modal,simpleGridExport,$timeout,$position,$compile,$document) {
            return {
                restrict:'E',
                replace:true,
                scope: { data:"=sgData", listItems:"=",  sgAddObject:"&", sgSortOptions:"=", itemtemplate:"=sgTemplate",sgColumns:"@",sgDelObject:"&", sgAllowDel:"@",
                    sgNoPager:'=', sgOnClick:'&', sgLookup:"&", sgGlobalSearch:"@", sgLocalSearch:"@",sgPageSize:"@" ,sgOptions:"=", sgOnChange:"&", sgLookupTitle:"&",sgSortField:"=",sgVirtual:"@",
                    sgCheckColumn:"@", sgCustomSearch:"&", sgModalSearchTemplate:"=", sgModalSearchController:"=", sgModalSearchResolve:"=", sgModalSearch:"&", sgExportTitle:"@",
                    sgPublic:"=", sgAgg:"&", sgReadonly:"=", sgMenu:"=", sgModalEdit:"&"},
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
                        $scope.currentRow = item;
                        comboScope[col.$getComboKey(2)]=true;
                        e.attr('aria-expanded', true);
                    }
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
                    $scope.columns = sgColumn($scope).Parse($attrs.sgColumns);

                    var $popups = [];
                    _($scope.columns).forEach(function(c){
                        if (c.modalEdit){
                            var keyActive = c.$getComboKey(1);
                            var key = c.$getComboKey(0);
                            var keySelect = c.$getComboKey(3);
                            comboScope[keySelect] = (function(col, listKey){
                                return function(activeIdx){
                                    $scope.activeRow[col] = comboScope[listKey][activeIdx].id;
                                };
                            })(c.name,c.$getComboKey(0));
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
                                    var list = $scope[key];
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
                        var d = (!$scope.listItems || $scope.listItems.length == 0) ? $scope.data:$scope.listItems;
                        simpleGridExport.export($scope.columns, d,docTitle);
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
                    $scope.public.refresh = $scope.changed = function(page, reset) {
                        var ps = pageSetting.pageSize;
                        page = page || pageSetting.currentPage;
                        pageSetting.currentPage = page;
                        if (reset){
                            $scope.resetChecks();
                        }
                        var scopeData = $scope.data;
                        if (pageSetting.modalSearchCriteria && $scope.sgModalSearchTemplate){
                            scopeData = $scope.sgModalSearch({list:scopeData,c:pageSetting.modalSearchCriteria,lk:$scope.myLookup});
                        }
                        var data = null;
                        if (($scope.sgGlobalSearch || $scope.sgLocalSearch) && $scope.searchService.listingSearch && $scope.searchService.listingSearch!="")
                        {
                            var searchString = $scope.searchService.listingSearch.toLowerCase();
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
                    if ($scope.sgGlobalSearch || $scope.sgLocalSearch) {
                        $scope.$watch(function() {
                            return $scope.searchService.listingSearch ;
                        }, function() {
                            (function(x){
                                $timeout(function(){
                                    if (x==$scope.searchService.listingSearch) {
                                        $scope.changed(pageSetting.currentPage);
                                    }
                                }, 1000);
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