import getEachDeep from './getEachDeep';
import getPathToString from './getPathToString';
import getObtain from './getObtain';
import getCondenseDeep from './getCondenseDeep';
import getExists from './getExists';

export default function getFilterDeep(_) {
  // console.log('getFilterDeep:', _);
  var eachDeep = getEachDeep(_);
  var pathToString = getPathToString(_);
  var obtain = getObtain(_);
  var condenseDeep = getCondenseDeep(_);
  var exists = getExists(_);

  function filterDeep(obj, predicate, options) {
    predicate = _.iteratee(predicate);
    if (!options) {
      options = {};
    } else {
      options = _.cloneDeep(options);
      if (options.leafsOnly !== undefined) {
        options.leavesOnly = options.leafsOnly;
      }
    }
    if (!options.onTrue) {
      options.onTrue = {};
    }
    if (!options.onFalse) {
      options.onFalse = {};
    }
    if (!options.onUndefined) {
      options.onUndefined = {};
    }
    if (options.childrenPath !== undefined) {
      if (options.onTrue.skipChildren === undefined) {
        options.onTrue.skipChildren = false;
      }
      if (options.onUndefined.skipChildren === undefined) {
        options.onUndefined.skipChildren = false;
      }
      if (options.onFalse.skipChildren === undefined) {
        options.onFalse.skipChildren = false;
      }

      if (options.onTrue.cloneDeep === undefined) {
        options.onTrue.cloneDeep = true;
      }
      if (options.onUndefined.cloneDeep === undefined) {
        options.onUndefined.cloneDeep = true;
      }
      if (options.onFalse.cloneDeep === undefined) {
        options.onFalse.cloneDeep = true;
      }
    }
    options = _.merge(
      {
        checkCircular: false,
        keepCircular: true,
        //replaceCircularBy: <by>,
        leavesOnly: options.childrenPath === undefined,
        condense: true,
        cloneDeep: _.cloneDeep,
        pathFormat: 'string',
        onTrue: { skipChildren: true, cloneDeep: true, keepIfEmpty: true },
        onUndefined: {
          skipChildren: false,
          cloneDeep: false,
          keepIfEmpty: false,
        },
        onFalse: {
          skipChildren: true,
          cloneDeep: false,
          keepIfEmpty: false,
        },
      },
      options
    );

    var eachDeepOptions = {
      pathFormat: options.pathFormat,
      checkCircular: options.checkCircular,
      childrenPath: options.childrenPath,
      includeRoot: options.includeRoot,
      callbackAfterIterate: true,
      leavesOnly: options.leavesOnly,
    };

    var res = _.isArray(obj) ? [] : _.isObject(obj) ? {} : null;
    var replies = {};
    var rootReply;
    var foundCircular = [];
    // console.log('filterDeep → eachDeep', eachDeepOptions);
    eachDeep(
      obj,
      function(value, key, parent, context) {
        var curPath = pathToString(context.path);
        if (!context.afterIterate) {
          if (!context.isCircular) {
            // console.log('fr: ', context.path);
            var reply;
            reply = predicate(value, key, parent, context);
            // console.log(context.path + '?', reply);

            if (!_.isObject(reply)) {
              if (reply === undefined) {
                reply = _.clone(options.onUndefined);
              } else if (reply) {
                reply = _.clone(options.onTrue);
              } else {
                reply = _.clone(options.onFalse);
              }
            }
            if (reply.empty === undefined) {
              reply.empty = true;
            }
            if (curPath !== undefined) {
              replies[curPath] = reply;

              _.eachRight(context.parents, function(parent) {
                var p = pathToString(parent.path);
                if (p !== undefined && !replies[p]) {
                  replies[p] = {
                    skipChildren: false,
                    cloneDeep: false,
                    keepIfEmpty: false,
                    empty: reply.empty,
                  };
                } else {
                  return false;
                }
              });

              if (!rootReply) {
                rootReply = {
                  skipChildren: false,
                  cloneDeep: false,
                  keepIfEmpty: false,
                  empty: reply.empty,
                };
              }
            } else {
              rootReply = reply;
              // console.log('root reply', reply);
            }
            // console.log('→', replies);
            if (reply.keepIfEmpty || !reply.skipChildren) {
              if (options.cloneDeep && reply.cloneDeep) {
                if (context.path !== undefined) {
                  _.set(res, context.path, options.cloneDeep(value));
                } else {
                  res = options.cloneDeep(value);
                }
              } else {
                if (context.path !== undefined) {
                  _.set(
                    res,
                    context.path,
                    _.isArray(value) ? [] : _.isPlainObject(value) ? {} : value
                  );
                } else {
                  res = _.isArray(value)
                    ? []
                    : _.isPlainObject(value)
                    ? {}
                    : value;
                }
              }
            }
            return !reply.skipChildren;
          } else {
            // console.log('fc: ', context.path);
            _.unset(res, context.path);

            if (options.keepCircular) {
              foundCircular.push([context.path, context.circularParent.path]);
            }
            return false;
          }
        } else if (context.afterIterate && !context.isCircular) {
          // console.log('ai: ', context.path);
          if (
            curPath === undefined &&
            rootReply.empty &&
            !rootReply.keepIfEmpty
          ) {
            res = null;
          } else if (
            curPath !== undefined &&
            replies[curPath].empty &&
            !replies[curPath].keepIfEmpty
          ) {
            _.unset(res, context.path);
          } else {
            _.eachRight(context.parents, function(parent) {
              var p = pathToString(parent.path);
              if (p !== undefined && replies[p].empty) {
                replies[p].empty = false;
              } else {
                return false;
              }
            });
            rootReply.empty = false;
          }
          if (curPath !== undefined) {
            //delete replies[curPath];
          } else {
            //delete rootReply;
          }

          // console.log('←', replies);
          return;
        } else {
          // console.log('aic: ', context.path);
        }
      },
      eachDeepOptions
    );
    if (rootReply && rootReply.empty && !rootReply.keepIfEmpty) {
      res = null;
    } else {
      _.each(replies, (reply, path) => {
        if (reply.empty && !reply.keepIfEmpty) {
          _.unset(res, path);
        }
      });
    }
    _.each(foundCircular, function(c) {
      var cv;
      var found = c[1] === undefined || exists(res, c[1]);
      if (!found) return;
      // console.log('circular: ', c[0], c[1]);
      if (_.has(options, 'replaceCircularBy')) {
        cv = options.replaceCircularBy;
      } else {
        cv = obtain(res, c[1]);
      }
      _.set(res, c[0], cv);
    });
    if (options.condense) {
      //console.log('filterDeep → condenseDeep');
      res = condenseDeep(res, { checkCircular: options.checkCircular });
    }
    if (_.isArray(res) && !res.length && !eachDeepOptions.includeRoot)
      return null;
    return res;
  }
  return filterDeep;
}
