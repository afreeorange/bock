// https://github.com/angular-ui/ui-router/blob/master/sample/app/app.js#L10
angular.module('Bock')

.run(

    function($rootScope, $state, $stateParams, $timeout, $interpolate, BockService) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        // Manipulate page titles depending on state
        $rootScope.$title = 'Loading...';
        $rootScope.$on("$stateChangeSuccess", function() {

            if (!$state.$current.self.title) {
                $rootScope.$title = null;
            } else {
                var title = $interpolate($state.$current.self.title);
                $timeout(function() {
                    $rootScope.$title = title({$stateParams: $stateParams});
                });
            }

        });

        // Do one of two things. Redirect to
        // (1) an underscored path if spaces in URI
        // (2) a random page. This is done by fetching a list of articles
        //     and picking a random one on the client side.
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options){ 

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
                        $state.go('article', {articleTitle: response.data.articles[randomArticleIndex].title});
                    }, 
                    function(response) {
                        console.log('Couldn\'t randomize:', response);
                    }
                );
            }

        });

        return;
    }
)

;
