
(function () {
    var searchService = function($q, esFactory, filterService,$log) {
  var esClient = esFactory({
    
    host: 'http://paas:6077017fa084e699b31a3fd673f6070f@fili-us-east-1.searchly.com'
    //host: localhost:9200
    
  });

  this.setQuery = function(searchTerms, selectedFilters) {
    var selectedFilters = filterService.filters.selectedFilters;

    var query = {
        "function_score": {
          "query": {
            "multi_match": {
             "fields": ["title^5", "detailed description^3", "_all"],
              "query": searchTerms,
              "minimum_should_match": "2<-1 5<70%"
            }
          },
          "functions": [
            {"exp": {
              "publication date": {
                "origin": "now",
                "scale": "365d",
                "decay": 0.05
              }
            }}
          ],
          "boost_mode": "sum"
        }
      };

    var filteredQuery = {
      filtered: {
        query: query,
        filter: {
          bool: {
            must: []
          }
        }
      }
    };

    if (selectedFilters.length > 0) {
      selectedFilters.forEach(function (filter, key) {
        var obj = {term: {}};
        obj.term["topics.full"] = filter.value;

        filteredQuery.filtered.filter.bool.must.push(obj);
      });
    }

    return selectedFilters.length > 0 ? filteredQuery : query;
  };

  this.search = function(searchTerms, resultsPage, selectedSort, selectedFilters) {
    var deferred = $q.defer();

    var sortObject = {};
    sortObject[selectedSort.name] = selectedSort.direction;

    esClient.search({
      index: 'library',
      body: {
        query: this.setQuery(searchTerms, selectedFilters),
        sort: [sortObject],
        from: resultsPage * 10,
        aggs: {
          topics: {
            terms: {field: "topics.full"}
          }
        },
        highlight: {
          fields: {
            "title": {number_of_fragments: 0},
            "detailed description": {number_of_fragments: 0}
          }
        }
      }
    }).then(function(es_return) {
      deferred.resolve(es_return);
    }, function(error) {
      deferred.reject(error);
    });

    return deferred.promise;
  };

  this.formatResults = function(documents) {
    var formattedResults = [];

    documents.forEach(function(document) {
      var documentSource = document._source;

      angular.forEach(documentSource, function(value, field) {
        var highlights = document.highlight || {};
        var highlight = highlights[field] || false;

        if (highlight) {
          documentSource[field] = highlight[0];
        }
      });

      formattedResults.push(documentSource);
    });

    return formattedResults;
  };

  this.getSuggestions = function(query) {
    var deferred = $q.defer();

    var terms = query.split(' '),
        baseTerms = terms.length === 1 ? '' : terms.slice(0, -1).join(' ') + ' ',
        lastTerm = terms[terms.length - 1].toLowerCase();

    esClient.search({
      index: 'library',
      body: {
        "query": {
          "simple_query_string": {
            "fields": ['title'],
            "query": baseTerms + '(' + lastTerm + '|' + lastTerm + '*)',
            "default_operator": "and"
          }
        },
        "suggest": {
          "text": query,
          "phraseSuggestion": {
            "phrase": {
              "field": "title",
              "direct_generator": [{
                "field": "title",
                "suggest_mode": "popular",
                "min_word_length": 3,
                "prefix_length": 2
              }]
            }
          }
        },
        "size": 3,
        "_source": ["title"]
      }
    }).then(function(es_return) {
      deferred.resolve(es_return);
    }, function(error) {
      deferred.reject(error);
    });

    return deferred.promise;
  };
}

    searchService.$inject = ['$q','esFactory','filterService','$log'];

    angular.module('mySearchApp').service('searchService', searchService);


}());


 