angular.module('Bock')

.config(function($locationProvider, $httpProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $uiViewScrollProvider, cfpLoadingBarProvider) {
    $locationProvider.html5Mode(true);

    // Set default route
    $urlRouterProvider.when('', '/');

    // Scroll to the top of the page when populating ui-view
    // https://github.com/angular-ui/ui-router/issues/816
    $uiViewScrollProvider.useAnchorScroll();

    // Turn the spinner off
    cfpLoadingBarProvider.includeSpinner = false;

    // Create a new URL type for UI-Router that doesn't turn "/" into "%2F"
    function valToString(val) {
        if (val) {
            return val.toString();
        }
        return val;
    }
    $urlMatcherFactoryProvider.type('nonEncodedURL', {
        encode: valToString,
        decode: valToString,
        is: function () { return true; }
    });

});