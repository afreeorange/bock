angular.module('Bock')

.config(function($locationProvider, $httpProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $uiViewScrollProvider, cfpLoadingBarProvider, toastrConfig) {
  $locationProvider.html5Mode(true);

  // Set default route
  $urlRouterProvider.when('', '/');

  // Scroll to the top of the page when populating ui-view
  // https://github.com/angular-ui/ui-router/issues/816
  $uiViewScrollProvider.useAnchorScroll();

  // Turn the spinner off
  cfpLoadingBarProvider.includeSpinner = false;

  // Configure toastr messages
  angular.extend(toastrConfig, {
    autoDismiss: false,
    maxOpened: 1,
    preventDuplicates: true,
    preventOpenDuplicates: false,
    target: 'body',
    timeOut: 5000,
    extendedTimeOut: 5000
  });

  // // Create a new URL type for UI-Router that doesn't turn "/" into "~2F"
  // // https://github.com/angular-ui/ui-router/issues/2551
  // $urlMatcherFactoryProvider.type('nonEncodedURL', {
  //     encode: function (item) { return item || ''; },
  //     decode: function (item) { return item || ''; },
  //     is: function (item) { return true; }
  // });

});
