/**
 * Created by s2k on 14-5-25.
 */
angular.module('pzutil.globalSearch').
    factory('globalSearch', [
        function(){
            var breadcrumbsService = {};
            breadcrumbsService.listingSearch = null;
            return breadcrumbsService;
        }]);