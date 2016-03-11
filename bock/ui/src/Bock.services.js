angular.module('Bock')

.service('BockService', function($http, $state) {
    var service = this;

    service.getArticle = function(articleTitle) {

        return $http({
                    method: 'GET',
                    url: '/api/articles/' + articleTitle
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        if (response.status == 404 && articleTitle == 'Home') {
                            $state.go('noHome');
                        } else if (response.status == 404) {
                            $state.go('404');
                        } else if (response.status == 500) {
                            $state.go('500');
                        } else {
                            return false;
                        }
                    }
                );
    };

    service.getRawArticle = function(articleTitle) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + articleTitle,
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    data: '' // Angular will rip the Content-Type header out unless you do this... :/
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        return false;
                    }
                );
    };

    service.getListOfArticles = function() {
        return $http({
                    method: 'GET',
                    url: '/api/articles'
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        return false;
                    }
                );
    };

    service.getListOfRevisions = function(articleTitle) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + articleTitle + '/revisions',
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        return false;
                    }
                );
    };

    service.getRevision = function(articleTitle, revisionID) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + articleTitle + '/revisions/' + revisionID,
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        return false;
                    }
                );
    };

    service.getRawRevision = function(articleTitle, revisionID) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + articleTitle + '/revisions/' + revisionID,
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    data: '' // Angular will rip the Content-Type header out unless you do this... :/
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        return false;
                    }
                );
    };

    service.getCompareDiff = function(articleTitle, revisionA, revisionB) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + articleTitle + '/compare?a=' + revisionA + '&b=' + revisionB
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        return false;
                    }
                );
    };

    service.getSearchResults = function(query) {
        return $http({
                    method: 'GET',
                    url: '/api/search/' + query,
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        return false;
                    }
                );
    };

})

;