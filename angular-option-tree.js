/*!
 * angular-option-tree v0.8.0
 * Author: Jason Lee
 * License: MIT
 * Source:
 *    http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
 */
(function () {
  'use strict';
  function get_hash_string() {
     return ("0000" + (Math.random()*Math.pow(10,4) << 0).toString(10)).slice(-4)
  }
  function get_preselect_path(json, value) {
    var sub_path = [];
    for (var key in json) {
      if (json[key] === parseInt(json[key], 10)) {
        if (json[key] == value) {
          sub_path.push(key);
          return sub_path;
        }
      } else {
        sub_path = get_preselect_path(json[key], value);
        if (sub_path.length > 0) {
          sub_path.unshift(key);
          return sub_path;
        }
      }
    }
    return [];
  }
  angular.module('option-tree', []).directive('optionTree', [
    '$http', '$log',
    function ($http, $log) {
      return {
        restrict: 'AC',
        //require: 'ngModel',
        scope: {
          //ngModel: '=',
          onChooseFn: '&',
          onChangeFn: '&'
          // options: '=?',
          // details: '=?'
        },
        link: function (scope, element, attrs) {
          
          var element_query_pattern = '', isInit = false, settings = {
              select_class: $(element).attr('option-tree-class'),
              choose: bind_on_choose,
              empty_value: 'null', //new
              indexed: true, // the data in tree is indexed by values (ids), not by labels
              on_each_change: $(element).attr('option-tree-src-on-change'),
              //element_details: $(element).attr('option-tree-src-element-details'),
            };
          
          // Avoid input name is empty
          if (!$(element).attr('name')) {
            $(element).attr('name', get_hash_string());
          }
          element_query_pattern = 'input[name=\'' + element.attr('name') + '\']';
          
          function refresh_preselect(option_tree) {
            if (settings.hasOwnProperty('preselect')) {
              delete settings.preselect;
            }
            if ($(element).val()) {
              var path = get_preselect_path(option_tree, $(element).val());
              if (path.length > 0) {
                settings.preselect = {};
                settings.preselect[$(element).attr('name')] = path;
              }
            }
          };

          function bind_on_change() {
            var $self = $(element), labels = [], selected = $(element).val() || 0, model = false;

            $self.siblings('select')
              .find(':selected')
              .each(function() {
                  var sibling = $(this);
                  labels.push(sibling.text());
              });

            if (selected > 0) {
              // if (angular.isDefined(scope.ngModel)) {
              //   model = scope.ngModel;
              // }

              //$log.info('bind_on_change', selected, labels);
              if (angular.isFunction(scope.onChangeFn)) {
                return scope.onChangeFn({
                  //model: model,
                  name: labels[labels.length - 1],
                  selected: selected,
                  labels: labels,
                  path: labels.join(' > ')
                });
              }
            }
          };

          function bind_on_choose(level) {
            //console.log(scope.onChooseFn);
            if(angular.isDefined(scope.onChooseFn)) {
              //$log.info('bind_on_choose', level, $(this).val());
              return scope.onChooseFn({
                level: level,
                selected: $(this).val(),
                prompt: $(element).attr('option-tree-prompt')
              });
            } else {
              return $(element).attr('option-tree-prompt');
            }
          }

          function bind_option_tree(option_tree) {
            if (isInit) {
              var tempVar = $(element).val();
              $(element_query_pattern).optionTree('destroy');
              $(element).val(tempVar);
            } else {
              isInit = true;
            }
            //refresh_preselect(option_tree); @fix it when childrens are loaded dynamicly
            //$log.info('bind_option_tree');
            $(element_query_pattern).optionTree(option_tree, settings).change(bind_on_change);
          };
          
          // Loading Remote Data
          if ($(element).attr('option-tree-src')) {
            $http.get($(element).attr('option-tree-src')).success(function (data) {
              bind_option_tree(data);
            });
          } else {
            bind_option_tree(attrs.optionTree);
          }
        }
      };
    }
  ]);
}());