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
                console.info(image, imageHelper.getUrl(image, container));
                return imageHelper.getUrl(image, container);
            };
        }]);