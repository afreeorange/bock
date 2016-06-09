angular.module('Bock')

.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.when('/', '/Home');

    $stateProvider

    .state('search', {
        title: 'Search - {{ $stateParams.query }}',
        url: '/search/:query',
        views: {
            '@': {
                templateUrl: 'search_results.html',
                controller: 'searchResultsController',
                controllerAs: 'src',
                resolve: {
                    searchResults: function(BockService, $stateParams) {
                        return BockService.getSearchResults($stateParams.query);
                    }
                }
            }
        }
    })

    .state('random', {
        title: 'Randomizing...',
        url: '/random'
    })

    .state('404', {
        title: 'Couldn\'t find that',
        templateUrl: '404.html'
    })

    .state('500', {
        title: 'Uh oh...',
        templateUrl: '500.html'
    })

    .state('noHome', {
        title: 'No Home',
        templateUrl: 'no_home.html'
    })

    .state('files', {
        title: 'Files',
        url: '/files/{fileName}',
        controller: function($window, $stateParams) {
            $window.location.href = '/api/files/' + $stateParams.fileName;
        }
    })

    .state('listOfArticles', {
        title: 'List of Articles',
        url: '/articles',
        views: {
            '@': {
                templateUrl: 'articles.html',
                controller: 'articlesController',
                controllerAs: 'asc',
                resolve: {
                    listOfArticles: function(BockService) {
                        return BockService.getListOfArticles();
                    }
                }
            }
        }
    })

    .state('article', {
        title: '{{ $stateParams.articleTitle | formatTitle }}',
        url: '/{articleTitle}',
        resolve: {
            articleData: function(BockService, $stateParams) {
                var articleTitle = $stateParams.articleTitle || 'Home';
                return BockService.getArticle(articleTitle);
            }
        },
        views: {
            '@': {
                templateUrl: 'article.html',
                controller: 'articleController',
                controllerAs: 'ac',
            },
            'lastModifiedInfo@': {
                templateUrl: 'last_modified.html',
                controller: 'articleController',
                controllerAs: 'ac'
            }
        }
    })

    .state('article.raw', {
        title: '{{ $stateParams.articleTitle | formatTitle }} - Source',
        url: '/raw',
        resolve: {
            articleData: function(BockService, $stateParams) {
                var articleTitle = $stateParams.articleTitle || 'Home';
                return BockService.getArticle(articleTitle);
            }
        },
        views: {
            '@': {
                templateUrl: 'raw_article.html',
                controller: 'articleController',
                controllerAs: 'ac'
            }
        }
    })

    .state('article.revisionList', {
        title: '{{ $stateParams.articleTitle | formatTitle }} - Revisions',
        url: '/revisions',
        views: {
            '@': {
                templateUrl: 'revisions.html',
                controller: 'revisionListController',
                controllerAs: 'rlc',
                resolve: {
                    listOfRevisions: function(BockService, $stateParams) {
                        var articleTitle = $stateParams.articleTitle || 'Home';
                        return BockService.getListOfRevisions(articleTitle);
                    }
                }
            }
        }
    })

    .state('article.revisionList.revision', {
        title: '{{ $stateParams.articleTitle | formatTitle }} - Revision {{ $stateParams.revisionID }}',
        url: '/:revisionID',
        resolve: {
            revision: function(BockService, $stateParams) {
                var articleTitle = $stateParams.articleTitle || 'Home';
                return BockService.getRevision(articleTitle, $stateParams.revisionID);
            }
        },
        views: {
            '@': {
                templateUrl: 'revision.html',
                controller: 'revisionController',
                controllerAs: 'rc'
            },
            'lastModifiedInfo@': {
                templateUrl: 'last_modified.html',
                controller: 'revisionController',
                controllerAs: 'rc'
            }
        }
    })

    .state('article.revisionList.revision.raw', {
        title: '{{ $stateParams.articleTitle | formatTitle }} - Source',
        url: '/raw_revision',
        views: {
            '@': {
                templateUrl: 'raw_revision.html',
                controller: 'revisionController',
                controllerAs: 'rc'
            },
            'lastModifiedInfo@': {
                templateUrl: 'last_modified.html',
                controller: 'revisionController',
                controllerAs: 'rc'
            }
        }
    })

    .state('article.compare', {
        title: '{{ $stateParams.articleTitle | formatTitle }} - Compare Revisions',
        url: '/compare?a&b',
        views: {
            '@': {
                templateUrl: 'compare.html',
                controller: 'compareController',
                controllerAs: 'cc',
                resolve: {
                    comparisonDiff: function(BockService, $stateParams) {
                        var articleTitle = $stateParams.articleTitle || 'Home';
                        return BockService.getCompareDiff(articleTitle, $stateParams.a, $stateParams.b);
                    }
                }
            }
        }
    })

    ;
    
});