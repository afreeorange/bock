// https://github.com/angular-ui/ui-router/blob/master/sample/app/app.js#L10
angular.module('Bock')

.run(

    function($rootScope, $state, $stateParams, $timeout, $interpolate, BockService, $templateCache, toastr) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.$title = 'Loading...'; // Manipulate page titles depending on state

        // Do one of two things. Redirect to
        // (1) an underscored path if spaces in URI
        // (2) a random page. This is done by fetching a list of articles
        //     and picking a random one on the client side.
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {

            if (toState.name == 'article' && /\s/g.test(toParams.articleTitle)) {
                var adjustedTitle = toParams.articleTitle.split(' ').join('_');
                event.preventDefault(); // Prevent transition to state
                $state.go('article', {articleTitle: adjustedTitle});
            }

            if (toState.name == 'random') {
                event.preventDefault();

                BockService.getListOfArticles()
                .then(
                    function(response) {
                        randomArticleIndex = Math.floor(Math.random() * response.data.articles.length);
                        randomArticleTitle = response.data.articles[randomArticleIndex].title;

                        // Go to the raw version of the article if the referring state was raw
                        if (fromState.name == 'article.raw') {
                            $state.go('article.raw', {articleTitle: randomArticleTitle});
                        } else {
                            $state.go('article', {articleTitle: randomArticleTitle});
                        }
                    },
                    function(response) {
                        toastr.error('Couldn\'t randomize articles :( Check the console.', 'Oh no!');
                        console.log(response);
                    }
                );
            }

        });

        $rootScope.$on('$stateChangeSuccess', function() {

            if (!$state.$current.self.title) {
                $rootScope.$title = null;
            } else {
                var title = $interpolate($state.$current.self.title);
                $timeout(function() {
                    $rootScope.$title = title({$stateParams: $stateParams});
                });
            }

        });

        $templateCache.put('directives/toast/toast.html','<div class="{{toastType}} {{toastClass}}"><strong>{{title}}</strong> <span>{{message}}</span></div>');

        return;

    }
);
