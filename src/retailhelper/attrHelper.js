/**
 * Created by s2k on 14-5-27.
 */
angular.module('pzutil.retailhelper')
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