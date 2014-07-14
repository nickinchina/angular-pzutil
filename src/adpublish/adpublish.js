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