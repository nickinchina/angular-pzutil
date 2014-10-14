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