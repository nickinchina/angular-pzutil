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
