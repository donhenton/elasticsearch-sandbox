(function () {

    var searchResultsListController =
            function ($scope, searchService, filterService, $sce,$log) {

                $scope.searchTerms = null;
                $scope.noResults = false;
                $scope.isSearching = false;
                $scope.resultsPage = 0;

                $scope.results = {
                    searchTerms: null,
                    documentCount: null,
                    documents: []
                };

                // Autocomplete
                $scope.autocomplete = {
                    suggestions: [],
                    results: []
                };
                $scope.showAutocomplete = false;

                /**
                 * keyup event for the type in box does the incremental
                 * call for prepping the suggestion box
                 * @param {type} event
                 * @returns {undefined}
                 */
                $scope.evaluateTerms = function (event) {
                    //$scope.searchTerms is the type in box contents
                    var inputTerms = $scope.searchTerms ? $scope.searchTerms.toLowerCase() : null;
                     
                    // if enter do a submit via ng-submit which points to $scope.submit
                    if (event.keyCode === 13) {
                        return;
                    }
                    //get the suggestions if you have typed 4 characters        
                    if (inputTerms && inputTerms.length > 3) {
                        getSuggestions(inputTerms);
                    }
                    else if (!inputTerms) {
                        //empty the autocomplete information
                        $scope.autocomplete = {};
                        $scope.showAutocomplete = false;
                    }
                };

                $scope.searchForSuggestion = function () {
                    
                    $scope.searchTerms = $scope.autocomplete.suggestions[0].options[0].text;
                    $scope.search();
                    $scope.showAutocomplete = false;
                };
                
                $scope.searchForSingleTitle = function(suggestion) 
                {
                    $scope.searchTerms = suggestion;
                    $scope.search();
                    $scope.showAutocomplete = false;
                }
                

                var getSuggestions = function (query) {
                    searchService.getSuggestions(query).then(function (es_return) {
                        var suggestions = es_return.suggest.phraseSuggestion;
                        
                        var results = es_return.hits.hits;

                        if (suggestions.length > 0) {
                            $scope.autocomplete.suggestions =  suggestions  ;
                        }
                        else {
                            $scope.autocomplete.suggestions = [];
                        }

                        if (results.length > 0) {
                            $scope.autocomplete.results = results;
                            // $log.debug("suggestions "+JSON.stringify(results))
                        }
                        else {
                            $scope.autocomplete.results = [];
                        }

                        if (suggestions.length > 0 || results.length > 0) {
                            $scope.showAutocomplete = true;
                        }
                        else {
                            $scope.showAutocomplete = false;
                        }
                    });
                };

                // Filters
                $scope.filters = filterService.filters;

                $scope.toggleFilter = function (field, value) {
                    var selectedFilters = filterService.filters.selectedFilters,
                            filterIndex = filterService.findSelectedFilter(field, value),
                            thisFilter = {field: field, value: value};

                    filterIndex > -1 ? selectedFilters.splice(filterIndex, 1) : selectedFilters.push(thisFilter);

                    resetResults();
                    getResults();
                };

                // Sort
                $scope.sortOptions = [
                    {name: '_score', displayName: 'Relevancy', direction: 'desc'},
                    {name: 'price_gbp', displayName: 'Price', direction: 'asc'}
                ];

                $scope.selectedSort = $scope.sortOptions[0];

                $scope.updateSort = function () {
                    resetResults();
                    getResults();
                }

                // Results
                var resetResults = function () {
                    $scope.results.documents = [];
                    $scope.results.documentCount = null;

                    $scope.resultsPage = 0;

                    $scope.noResults = false;
                };

                $scope.search = function () {
                    resetResults();
                    $scope.filters.selectedFilters = [];

                    var searchTerms = $scope.searchTerms;

                    if (searchTerms) {
                        $scope.results.searchTerms = searchTerms;
                    } else {
                        return;
                    }

                    getResults();
                };

                $scope.getNextPage = function () {
                    $scope.resultsPage++;
                    getResults();
                };

                $scope.$watchGroup(['results', 'noResults', 'isSearching'], function () {
                    var documentCount = $scope.results.documentCount;

                    if (!documentCount || documentCount <= $scope.results.documents.length || $scope.noResults || $scope.isSearching) {
                        $scope.canGetNextPage = false;
                    }
                    else {
                        $scope.canGetNextPage = true;
                    }
                });

                var getResults = function () {
                    $scope.isSearching = true;

                    searchService.search($scope.results.searchTerms,
                            $scope.resultsPage,
                            $scope.selectedSort,
                            filterService.filters.selectedFilters)
                            .then(function (es_return) {
                                var totalHits = es_return.hits.total;

                                if (totalHits > 0) {
                                    $scope.results.documentCount = totalHits;
                                    $scope.results.documents.push.apply($scope.results.documents, searchService.formatResults(es_return.hits.hits));
                                    filterService.formatFilters(es_return.aggregations);
                                }
                                else {
                                    $scope.noResults = true;
                                }

                                $scope.isSearching = false;

                            },
                                    function (error) {
                                        console.log('ERROR: ', error.message);
                                        $scope.isSearching = false;
                                    });
                };
            };




    searchResultsListController.$inject = ['$scope', 'searchService', 'filterService', '$sce', '$log'];
    angular.module('mySearchApp')
            .controller('SearchResultsList', searchResultsListController);



}());