/*
 * pzutil
 * 

 * Version: 0.0.3 - 2014-05-25
 * License: MIT
 */
angular.module("pzutil", ["pzutil.tpls", "pzutil.modal","pzutil.services","pzutil.simplegrid"]);
angular.module("pzutil.tpls", ["template/modal/modal.tpl.html","template/modal/wait.tpl.html","template/simplegrid/footer.tpl.html","template/simplegrid/header.tpl.html","template/simplegrid/simpleGrid-normal.tpl.html","template/simplegrid/simpleGrid-simple.tpl.html","template/simplegrid/simpleGrid.tpl.html"]);
/**
 * Created by gordon on 2014/4/25.
 */
angular.module('pzutil.modal', [])
    .directive('crudModal', function () {
        return {
            restrict:'E',
            replace: true,
            transclude: 'element',
            templateUrl: 'template/modal/modal.tpl.html'
        };
    })
    .factory('crudWait',['$http','$modal', function($http, $modal) {
        var arrSelected = [];
        var mixin = {
            doWork : function(msg, promise, cb) {
                 var modalInstance = $modal.open({
                    templateUrl: 'template/modal/wait.tpl.html',
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
 * Created by gordon on 2014/4/4.
 */
angular.module('pzutil.services', [])
    ,factory('globalSearch', [
    function(){
        var breadcrumbsService = {};
        breadcrumbsService.listingSearch = null;
        return breadcrumbsService;
    }])
    .factory('localizedMessages', ['$interpolate', 'I18N.MESSAGES', function ($interpolate, i18nmessages) {

    var handleNotFound = function (msg, msgKey) {
        return msg || '?' + msgKey + '?';
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
angular.module('pzutil.simpleGrid', ['pzutil.services','pzutil.modal'])
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
                if (this.align)
                    return 'sg-gridrow-cell col-md-' + w + ' text-' + this.align;
                else
                    return 'sg-gridrow-cell col-md-' + w;
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
    .directive('simpleGrid', ['sgColumn', 'globalSearch', 'localizedMessages','crudWait',
        function (sgColumn, globalSearch, localizedMessages,crudWait) {
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
                            return 'template/simplegrid/simpleGrid-simple.tpl.html';
                        }
                        else {
                            return 'template/simplegrid/simpleGrid.tpl.html';
                        }
                    }
                    else
                        return 'template/simplegrid/simpleGrid-normal.tpl.html';
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
                        $scope.scrollStyle = "height:" + $attrs.gridHeight +";overflow-y:scroll";
                    else
                        $scope.scrollStyle = "";

                    if ($scope.sgNoPager)
                        $scope.pageSize = 100;
                    else if ($scope.sgPageSize)
                        $scope.pageSize = parseInt($scope.sgPageSize);
                    else
                        $scope.pageSize = 15;

                    $scope.getIndex = function(item){
                        return  $scope.items.indexOf(item)+1;
                    };
                    $scope.changed = function(page) {
                        $scope.currentPage = page;
                        var data = null;
                        if ($scope.sgGlobalSearch && globalSearch.listingSearch && globalSearch.listingSearch!="")
                        {
                            data = _.filter($scope.data, function(i){
                                for (var c = 0; c< $scope.columns.length; c++){
                                    var col =  $scope.columns[c].name;
                                    var value = i[col];
                                    if ($scope.myLookup)
                                        value = $scope.myLookup({col: col, value:value});
                                    if (value) {
                                        if (value.toString().indexOf(globalSearch.listingSearch)>-1)
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

                            $scope.totalItems = $scope.data.length;
                            $scope.footer = localizedMessages.get('common.totalcount',
                                {
                                    from: $scope.pageSize * ($scope.currentPage - 1) + 1,
                                    to: Math.min($scope.pageSize * $scope.currentPage,$scope.totalItems) ,
                                    total: $scope.totalItems
                                } );
                            console.info('footer',$scope.footer);
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
                            return globalSearch.listingSearch ;
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
angular.module("template/modal/modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/modal.tpl.html",
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

angular.module("template/modal/wait.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/wait.tpl.html",
    "<div class=\"modal-body\">\n" +
    "    <div class=\"progress progress-striped active\">\n" +
    "        <div class=\"progress-bar\"  role=\"progressbar\" aria-valuenow=\"100\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 100%\">\n" +
    "            {{msg}}\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/footer.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/footer.tpl.html",
    "<div class=\"row\">\n" +
    "    <div class=\"col-md-9\">\n" +
    "        <pagination ng-if=\"!sgNoPager\" ng-show=\"totalItems>pageSize\"\n" +
    "                    total-items=\"totalItems\" page=\"currentPage\" items-per-page=\"pageSize\"\n" +
    "                    max-size=\"5\" class=\"pagination-sm\" boundary-links=\"true\"  on-select-page=\"changed(page)\" />\n" +
    "    </div>\n" +
    "    <div class=\"col-md-3 sg-footer\">\n" +
    "        <strong>{{footer}}</strong>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/header.tpl.html",
    "<div class=\"row well well-sm sg-gridheader\" >\n" +
    "    <div class=\"{{col.$getColumnClass()}}\" ng-repeat=\"col in columns\">\n" +
    "        <a href ng-click=\"col.$sort()\" class=\"btn-header\">{{col.$getTitle()}}</a>\n" +
    "        <i class=\"fa fa-sort-desc\" ng-show=\"col.sortOrder\"></i>\n" +
    "        <i class=\"fa fa-sort-asc\" ng-show=\"!col.sortOrder && col.sortOrder!=undefined\"></i>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid-normal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid-normal.tpl.html",
    "<div class=\"sg-grid\">\n" +
    "    <ng-include src=\"'template/simplegrid/header.tpl.html'\"></ng-include>\n" +
    "    <div style=\"{{scrollStyle}}\">\n" +
    "        <div ng-repeat=\"item in items\" class=\"row sg-gridrow\" ng-click=\"sgOnClick({id: item.id})\">\n" +
    "            <div class=\"{{col.$getColumnClass()}}\" ng-repeat=\"col in columns\">\n" +
    "                <i ng-if=\"col.bool\" ng-class=\"{true: 'fa fa-check'}[item[col.name]]\"></i>\n" +
    "                <a href ng-if=\"$first && sgAllowDel\" ng-click=\"DelObject(item)\"><i class= 'glyphicon glyphicon-remove'></i></a>\n" +
    "                <ng-include  ng-if=\"col.template\" src=\"col.template\"></ng-include>\n" +
    "                <span ng-if=\"!col.template\">{{col.$getText(item)}}</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <ng-include src=\"'template/simplegrid/footer.tpl.html'\"></ng-include>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid-simple.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid-simple.tpl.html",
    "<div class=\"sg-grid\">\n" +
    "    <ng-include src=\"itemtemplate\"></ng-include>\n" +
    "    <ng-include src=\"'template/simplegrid/footer.tpl.html'\"></ng-include>\n" +
    "</div>");
}]);

angular.module("template/simplegrid/simpleGrid.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/simpleGrid.tpl.html",
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
    "    <ng-include src=\"'template/simplegrid/header.tpl.html'\" ng-if=\"sgColumns\"></ng-include>\n" +
    "    <div style=\"{{scrollStyle}}\">\n" +
    "        <div ng-repeat=\"item in items\" style=\"padding: 3px 0px 3px\">\n" +
    "            <ng-include src=\"itemtemplate\"></ng-include>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <ng-include src=\"'template/simplegrid/footer.tpl.html'\"></ng-include>\n" +
    "</div>");
}]);
