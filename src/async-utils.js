(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let utils;

  if (isModule) {
    utils = require('crizmas-utils');
  } else {
    utils = window.crizmas.utils;
  }

  const {isPromise, resolveThenable} = utils;

  function awaitFor(val, success, error) {
    if (isPromise(val)) {
      // make sure thenables are converted
      return resolveThenable(val).then(success, error);
    }

    if (success) {
      return success(val);
    }

    return val;
  }

  function awaitAll(values, success, error) {
    if (!values) {
      if (success) {
        return success(values);
      }

      return values;
    }

    const successResults = [];
    const errorResults = [];
    let settledPromises = 0;
    let promisesCount = 0;
    let foundErrors = false;
    let resolve;
    let reject;

    errorResults.success = successResults;

    let index = -1;

    // values can be any iterable
    for (const value of values) {
      index += 1;

      const i = index;

      if (isPromise(value)) {
        promisesCount += 1;

        awaitFor(value, result => {
          successResults[i] = result;
          settledPromises += 1;

          if (settledPromises === promisesCount) {
            if (foundErrors) {
              reject(errorResults);
            } else {
              resolve(successResults);
            }
          }
        }, result => {
          foundErrors = true;
          errorResults[i] = result;
          settledPromises += 1;

          if (settledPromises === promisesCount) {
            reject(errorResults);
          }
        });
      } else {
        successResults[i] = value;
      }
    }

    if (promisesCount) {
      return new Promise((resolve_, reject_) => {
        resolve = resolve_;
        reject = reject_;
      }).then(success, error);
    }

    if (success) {
      return success(successResults);
    }

    return successResults;
  }

  const moduleExports = {
    awaitFor,
    awaitAll
  };

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas.asyncUtils = moduleExports;
  }
})();
