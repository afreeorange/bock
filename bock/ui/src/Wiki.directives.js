angular.module('Wiki')

.directive('autoFocus', function($timeout) {
    return {
        restrict: 'AC',
        link: function($scope, element, attributes) {
            $timeout(function () {
                element[0].focus();
            });
        }
    };
})

// Wraps the Diff2HTML library
.directive('diffToHtml', function(){
    return {
        restrict: 'E',
        scope: {
            diffText: '@text',
            diffType: '@type'
        },
        template: '<strong>{{ diffText }}</strong>',
        link: function($scope, element, attributes) {

            var diffInfo = $scope.diffText.replace(/(\\r)|(\\n)/g,"\n");
            var diffJson = Diff2Html.getJsonFromDiff(diffInfo);
            var diffType = $scope.diffType || 'line-by-line';

            element.html(
                Diff2Html.getPrettyHtml(
                    diffJson,
                    {
                        inputFormat: 'json',
                        matching: 'lines',
                        outputFormat: diffType
                    }
                )
            );

        } // End link
    };
})

;
