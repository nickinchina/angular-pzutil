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

angular.module("template/simplegrid/chart.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/chart.html",
    "<canvas height=\"140\" id=\"bar\" class=\"chart chart-bar\"\n" +
    "       chart-data=\"chart.data\" chart-series=\"chart.series\" chart-labels=\"chart.labels\"\n" +
    "       chart-dataset-override=\"barOverride\"> ");
}]);

angular.module("template/simplegrid/combo-edit.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/simplegrid/combo-edit.html",
    "<ul class=\"dropdown-menu zscrollable-menu\" role=\"menu\" ng-style=\"{top: position.top+'px', left: position.left+'px', width: '200px'}\" style=\"display: block;position:absolute;z-index: 100000\" aria-hidden=\"{{!isopen}}\" ng-show=\"isopen\">\n" +
    "    <li ng-repeat=\"item in items track by $index\" role=\"presentation\">\n" +
    "        <a href ng-click=\"selectMatch($index);$event.stopPropagation();\" role=\"menuitem\">\n" +
    "            <i ng-class=\"{true: 'fa fa-circle', false: 'fa fa-circle-o'}[isActive($index)]\"></i> {{item.name}}\n" +
    "        </a>\n" +
    "    </li>\n" +
    "</ul>");
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
    "<div class=\"row sg-gridrow\" ng-if=\"hasSummary\">\n" +
    "    <div class=\"col-sg-1\" ng-if=\"sgAllowDel && !sgReadonly\" ></div>\n" +
    "    <div class=\"{{col.$getColumnClass({})}}\" ng-repeat=\"col in columns\">\n" +
    "        <span class=\"text-success\">{{col.$aggregate()|picker:col.format}} <i class=\"fa fa-bar-chart sg_gridIcon text-info\" ng-if=\"!!col.chartSeries\" ng-click=\"col.$chart()\" style=\"top:50%;\"></i></span>\n" +
    "    </div>\n" +
    "</div>\n" +
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
    "    <button type=\"button\" class=\"btn btn-default pull-right\"  ng-click=\"checkAll()\" ng-if=\"sgModalSearchTemplate||sgSelectOnly\"><i class=\"fa fa-check\"></i> {{'common.checkAll' | i18n}}</button>\n" +
    "    <span class=\"pull-right\" style=\"margin-right: 10px\"  ng-if=\"sgModalSearchTemplate\"><small>To select, press <kbd>CTRL</kbd> key to click</small></span>\n" +
    "    <input type=\"text\" placeholder=\"Search\" class=\"pull-right form-control\" ng-model=\"searchService.listingSearch\" ng-if=\"sgLocalSearch\" style=\"width: auto;margin-left:2px\">\n" +
    "</div>\n" +
    "<div class=\"row sg-gridheader\" >\n" +
    "    <div class=\"col-sg-1\" ng-if=\"sgAllowDel && !sgReadonly\" ></div>\n" +
    "    <div class=\"{{col.$getColumnClass()}}\" style=\"{{col.$getColumnStyle()}}\" ng-click=\"col.$sort()\" ng-repeat=\"col in columns\">\n" +
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
    "    <div>\n" +
    "        <div style=\"{{scrollStyle}}\">\n" +
    "            <div ng-repeat=\"item in items\" class=\"row sg-gridrow\" ng-class=\"{true: 'sg-gridrow-active'}[item.$__selected]\" ng-click=\"clickRow(item,$event)\" context-menu=\"sgMenu\" >\n" +
    "                <a href ng-if=\"sgAllowDel && !sgReadonly\" ng-click=\"DelObject(item)\" class=\"col-sg-1\"><i class= 'fa fa-minus-circle fa-lg sg_gridIcon text-danger'></i></a>\n" +
    "                <div class=\"{{col.$getColumnClass(item)}}\" style=\"{{col.$getColumnStyle()}}\" ng-repeat=\"col in columns\" title=\"{{col.$getText(item)}}\">\n" +
    "                    <i ng-if=\"$first && item.$__selected\" class=\"fa fa-circle\"></i>\n" +
    "                    <i ng-if=\"col.bool\" ng-class=\"{true: 'fa fa-check'}[col.$getValue(item)]\"></i>\n" +
    "                    <ng-include  ng-if=\"!sgReadonly && col.template && (col.template.substr(0,9)=='readonly_' || !item.$core || !item.$core())\" src=\"col.template\" ng-init=\"col=col\"></ng-include>\n" +
    "                    <span ng-if=\"!sgReadonly && col.editTemplate\" z-template=\"col.editTemplate\"></span>\n" +
    "                    <span ng-click=\"col.$modalEdit(item,$event)\" ng-class=\"{true:'editable-click'}[col.modalEdit && !sgReadonly]\" ng-if=\"col.showSpan(item)\">{{col.$getText(item)| picker:col.format}}</span>\n" +
    "                    <i ng-if=\"$last && item.$core && item.$core()\" class=\"fa fa-lock pull-right sg_gridIcon\"></i>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <ng-include src=\"'template/simplegrid/footer.html'\"></ng-include>\n" +
    "        <simple-grid-chart ng-if=\"!!chartCategory\"  sc-data=\"data\" sc-category=\"chartCategory\" sc-keylookup='chartLookup(col,value)' sc-series='chartSeries' sc-chart-type=\"'area'\" sc-instance=\"scInstance\"></simple-grid-chart>\n" +
    "    </div>\n" +
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
    "    <div style=\"box-sizing: border-box; direction: ltr; position: relative; will-change: transform; overflow: auto;\">\n" +
    "        <sg-react items='items' columns='columns' row-click='clickRow' watch-depth=\"collection\" ></sg-react>\n" +
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
