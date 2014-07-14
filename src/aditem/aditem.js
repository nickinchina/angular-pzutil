/**
 * Created by gordon on 2014/5/26.
 */
angular.module('pzutil.aditem')
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
