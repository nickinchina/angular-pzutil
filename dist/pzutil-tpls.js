/*
 * pzutil
 * 

 * Version: 0.0.18 - 2014-08-07
 * License: MIT
 */
angular.module("pzutil", ["pzutil.tpls", "pzutil.aditem","pzutil.adpublish","pzutil.image","pzutil.modal","pzutil.rest","pzutil.retailhelper","pzutil.services","pzutil.simplegrid","pzutil.tree","pzutil.ztemplate"]);
angular.module("pzutil.tpls", ["template/aditem/aditem.tpl.html","template/adpublish/adpublish_grid.tpl.html","template/adpublish/adpublish_list.tpl.html","template/adpublish/adpublish_slide.tpl.html","template/modal/modal.html","template/modal/wait.html","template/simplegrid/footer.html","template/simplegrid/header.html","template/simplegrid/simpleGrid-normal.html","template/simplegrid/simpleGrid-simple.html","template/simplegrid/simpleGrid.html"]);
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
                    params.aid = 401;
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
    .directive('simpleGrid', ['sgColumn', 'breadcrumbs', 'localizedMessages','crudWait', '$modal',
        function (sgColumn, breadcrumbs, localizedMessages,crudWait,$modal) {
            return {
                restrict:'E',
                replace:true,
                scope: { data:"=sgData",  sgAddObject:"&", sgSortOptions:"=", itemtemplate:"=sgTemplate",sgColumns:"@",sgDelObject:"&", sgAllowDel:"@",
                    sgNoPager:'=', sgOnClick:'&', sgLookup:"&", sgGlobalSearch:"@",sgPageSize:"@" ,sgOptions:"=", sgOnChange:"&", sgLookupTitle:"&",
                    sgCheckColumn:"@", sgCustomSearch:"&", sgModalSearchTemplate:"=", sgModalSearchController:"=", sgModalSearchResolve:"=", sgModalSearch:"&"},
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

                    $scope.modalSearchReset = function(){
                        $scope.modalSearchCriteria = undefined;
                        $scope.changed(pageSetting.currentPage);
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
                        var scopeData = $scope.data;
                        if ($scope.modalSearchCriteria){
                            scopeData = $scope.sgModalSearch({list:scopeData,c:$scope.modalSearchCriteria});
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
                        var l = _.take(_.rest(data, (page - 1) * ps), ps);
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

angular.module("template/modal/modal.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/modal.html",
    "<div>\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3>Edit {{heading()}}</h3>\n" +
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

angular.module("template/simplegrid/footer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/footer.html",
    "<div class=\"row\">\n" +
    "    <div class=\"col-md-9\">\n" +
    "        <pagination ng-if=\"!sgNoPager && pageSetting.totalItems>pageSetting.pageSize\"\n" +
    "                    total-items=\"pageSetting.totalItems\" page=\"pageSetting.currentPage\" items-per-page=\"pageSetting.pageSize\" rotate=\"false\"\n" +
    "                    max-size=\"5\" class=\"pagination-sm\" boundary-links=\"true\"  on-select-page=\"changed(page, true)\" />\n" +
    "    </div>\n" +
    "    <div class=\"col-md-3 sg-footer\">\n" +
    "        <strong><a href=\"#\" editable-number=\"pageSetting.pageSize\" e-min=\"20\" e-max=\"200\" onaftersave=\"changed(1)\">\n" +
    "            {{footer}}</a> </strong>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/header.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/header.html",
    "<div class=\"row well well-sm sg-gridSearch\"  ng-if=\"sgModalSearchTemplate\">\n" +
    "    <button type=\"button\" class=\"btn btn-success\"  ng-click=\"modalSearch()\"><i class=\"fa fa-search\"></i> {{'common.searchAdv' | i18n}}</button>\n" +
    "    <button type=\"button\" class=\"btn btn-default\"  ng-click=\"modalSearchReset()\"><i class=\"fa fa-undo\"></i> {{'common.Reset' | i18n}}<</button>\n" +
    "</div>\n" +
    "<div class=\"row well well-sm sg-gridheader\" >\n" +
    "    <div class=\"{{col.$getColumnClass()}}\" ng-repeat=\"col in columns\">\n" +
    "        <input type=\"checkbox\" ng-if=\"col.checkbox\" ng-model=\"col.checkedAll\" ng-change=\"checkAll(col.checkedAll)\"\n" +
    "               style=\"margin-top: 8px;margin-left: -10px\">\n" +
    "        <a href ng-click=\"col.$sort()\" class=\"btn-header\">{{col.$getTitle()}}</a>\n" +
    "        <i class=\"fa fa-sort-desc\" ng-show=\"col.sortOrder\"></i>\n" +
    "        <i class=\"fa fa-sort-asc\" ng-show=\"!col.sortOrder && col.sortOrder!=undefined\"></i>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid-normal.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid-normal.html",
    "<div class=\"sg-grid\">\n" +
    "    <ng-include src=\"'template/simplegrid/header.html'\"></ng-include>\n" +
    "    <div style=\"{{scrollStyle}}\">\n" +
    "        <div ng-repeat=\"item in items\" class=\"row sg-gridrow\" ng-click=\"clickRow(item,$event)\" ng-class=\"{true: 'sg-gridrow-active'}[item.$__selected]\" >\n" +
    "            <div class=\"{{col.$getColumnClass()}}\" ng-repeat=\"col in columns\">\n" +
    "                <i ng-if=\"col.bool\" ng-class=\"{true: 'fa fa-check'}[item[col.name]]\"></i>\n" +
    "                <a href ng-if=\"$first && sgAllowDel\" ng-click=\"DelObject(item)\"><i class= 'glyphicon glyphicon-remove'></i></a>\n" +
    "                <ng-include  ng-if=\"col.template\" src=\"col.template\"></ng-include>\n" +
    "                <span ng-if=\"!col.template && !col.checkbox\">{{col.$getText(item)}}</span>\n" +
    "                <label ng-if=\"col.checkbox\" ng-click=\"$event.stopPropagation()\">{{col.$getText(item)}}<input type=\"checkbox\" ng-model=\"item.__selected\"></label>\n" +
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

angular.module("template/simplegrid/simpleGrid.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid.html",
    "<div class=\"form-horizontal sg-grid\">\n" +
    "    <div class=\"input-group\" style=\"width: 320px;margin-bottom: 15px\" ng-if=\"sgAddObject && sgSortOptions\">\n" +
    "        <span class=\"input-group-addon\"><i class=\"fa fa-check-circle\"></i></span>\n" +
    "        <select class=\"form-control\">\n" +
    "            <option ng-repeat=\"item in sgSortOptions\" ng-selected=\"item.selected\" value=\"item.name\">{{item.text}}</option>\n" +
    "        </select>\n" +
    "        <div class=\"input-group-btn\">\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"sortGrid(true)\"><i class=\"fa fa-sort-amount-asc\"></i></button>\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"sortGrid(false)\"><i class=\"fa fa-sort-amount-desc\"></i></button>\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"sgAddObject()\" ng-if=\"sgAddObject\"><span class=\"glyphicon glyphicon-plus\"></span></button>\n" +
    "        </div>\n" +
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
