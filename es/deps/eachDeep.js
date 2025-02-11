import _identity from 'lodash-es/identity';
import _merge from 'lodash-es/merge';
import _isArray from './own/isArray';
import _isString from 'lodash-es/isString';
import _toPath from 'lodash-es/toPath';

import iterateDeps from './iterate';

var deps = _merge(
  {
    identity: _identity,
    merge: _merge,
    isArray: _isArray,
    isString: _isString,
    toPath: _toPath,
  },
  iterateDeps
);

export default deps;
