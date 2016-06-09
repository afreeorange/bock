angular.module('Bock')

.service('BockService', function($http, $state, toastr) {
    var service = this;

    service.getArticle = function(articleTitle) {

        return $http({
                    method: 'GET',
                    url: '/api/articles/' + encodeURI(articleTitle.split('_').join(' '))
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
                            toastr.error('Got a response I don\'t know how to handle. See the console for more info.', 'Uh oh');
                            console.log(response);
                            return false;
                        }
                    }
                );
    };

    service.getRawArticle = function(articleTitle) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + encodeURI(articleTitle.split('_').join(' ')),
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
                        toastr.error('Could not get the raw article. See the console for more info.', 'Oops');
                        console.log(response);
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
                        toastr.error('Could not fetch list of articles. See the console for more info.', 'Oops');
                        console.log(response);
                        return false;
                    }
                );
    };

    service.getListOfRevisions = function(articleTitle) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + encodeURI(articleTitle.split('_').join(' ')) + '/revisions',
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        toastr.error('Could not get article revision. See the console for more info.', 'Ruh-roh');
                        console.log(response);
                        return false;
                    }
                );
    };

    service.getRevision = function(articleTitle, revisionID) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + encodeURI(articleTitle.split('_').join(' ')) + '/revisions/' + revisionID,
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        toastr.error('Could not fetch that article\'s revision. See the console for more info.', 'DAGNABBIT');
                        console.log(response);
                        return false;
                    }
                );
    };

    service.getRawRevision = function(articleTitle, revisionID) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + encodeURI(articleTitle.split('_').join(' ')) + '/revisions/' + revisionID,
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
                        toastr.error('Could not fetch that raw revision. See the console for more info.', 'Blistering Barnacles!');
                        console.log(response);
                        return false;
                    }
                );
    };

    service.getCompareDiff = function(articleTitle, revisionA, revisionB) {
        return $http({
                    method: 'GET',
                    url: '/api/articles/' + encodeURI(articleTitle.split('_').join(' ')) + '/compare?a=' + revisionA + '&b=' + revisionB
                })
                .then(
                    function(response) {
                        return response;
                    }, 
                    function(response) {
                        toastr.error('Could not get that comparision. See the console for more info.', 'Crikey!');
                        console.log(response);
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
                        toastr.error('Could not fetch search results. See the console for more info.', 'Criminy!');
                        console.log(response);
                        return false;
                    }
                );
    };

});