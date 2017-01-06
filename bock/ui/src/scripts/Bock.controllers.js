angular.module('Bock')

.controller('articleController', function(articleData) {
    var vm = this;
    vm.articleData = articleData.data;
})

.controller('articlesController', function(listOfArticles) {
    var vm = this;
    vm.listOfArticles = listOfArticles.data;
})

.controller('revisionListController', function(listOfRevisions, $state, $stateParams) {
    var vm = this;
    vm.listOfRevisions = listOfRevisions.data;
    vm.listOfSHAs = {};
    vm.shasToCompare = [];

    // This can be written better but it's late and I don't care... :/
    vm.updateSHAs = function(revisionID) {
        if (vm.shasToCompare.length == 2) {
            vm.shasToCompare.pop();
        }
        vm.shasToCompare.unshift(revisionID); // -> [a, b] ->

        if (vm.shasToCompare[0] == revisionID && vm.shasToCompare[1] == revisionID) {
            vm.shasToCompare.pop();
        }

        for (var key in vm.listOfSHAs) {
            vm.listOfSHAs[key] = false;
        }
        vm.listOfSHAs[vm.shasToCompare[0]] = true;
        vm.listOfSHAs[vm.shasToCompare[1]] = true;
    };

    vm.compareSHAs = function() {
        return $state.go(
            'article.compare',
            {
                'articleTitle': $stateParams.articleTitle,
                'a': vm.shasToCompare[0],
                'b': vm.shasToCompare[1]
            }
        );
    };
})

.controller('revisionController', function(revision) {
    var vm = this;
    vm.revision = revision.data;
})

.controller('compareController', function(comparisonDiff) {
    var vm = this;
    vm.comparisonDiff = comparisonDiff.data;
})

.controller('searchController', function($state, ModalService, $document) {
    var vm = this;
    vm.query = null;

    vm.submitQuery = function() {
        $state.go('search', {'searchQuery': vm.query});
    };

    vm.showSearchOverlay = function() {

        ModalService.showModal({
            templateUrl: "search.html",
            controller: "searchModalController",
            controllerAs: "smc"
        });

    };

})

.controller('searchModalController', function($document, $state, close) {
    var vm = this;
    vm.query = null;

    vm.dismissModal = function() {
        close();
    };

    $document.find('body').bind('keydown', function (event) {
        if (event.keyCode === 27) {
            close();
        }
    });

    vm.search = function() {
        vm.dismissModal();
        $state.go('search', {'query': vm.query});
    };

})

.controller('searchResultsController', function(searchResults) {
    var vm = this;
    vm.searchResults = searchResults.data;
})

;
