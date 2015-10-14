(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', '@sublimemedia/wicker-man-utilities', '@sublimemedia/wicker-man-content'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('@sublimemedia/wicker-man-utilities'), require('@sublimemedia/wicker-man-content'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.wickerManUtilities, global.WMContent);
    global.WMRouter = mod.exports;
  }
})(this, function (exports, module, _sublimemediaWickerManUtilities, _sublimemediaWickerManContent) {
  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var _WMContent2 = _interopRequireDefault(_sublimemediaWickerManContent);

  var WMRouter = (function (_WMContent) {
    _inherits(WMRouter, _WMContent);

    function WMRouter() {
      _classCallCheck(this, WMRouter);

      _WMContent.call(this);

      this.store = {};
      this.routes = {};
      this.observed = {};

      window.addEventListener('hashchange', this.urlChange.bind(this), false);
    }

    WMRouter.prototype.defineRoute = function defineRoute(route) {
      var _this = this;

      if (route && typeof route === 'object' && route.property) {
        (function () {
          var newRouterPath = (0, _sublimemediaWickerManUtilities.createPath)(route.property, _this.routes);

          Object.keys(route).forEach(function (key) {
            newRouterPath[key] = route[key];
          });

          if (route.hasOwnProperty('defaultValue') && typeof _this.get(route.property) === 'undefined') {
            _this.set(route.property, route.defaultValue);
          }
        })();
      }

      return this;
    };

    WMRouter.prototype.stringDivider = function stringDivider(ref, divider, prevValue, currentValue, i) {
      var val = ref[currentValue];
      return prevValue + divider(i) + (typeof val !== 'undefined' ? currentValue + '=' + encodeURIComponent(JSON.stringify(val)) : '');
    };

    WMRouter.prototype.objToHash = function objToHash(states) {
      var _this2 = this;

      var hash = '',
          stateKeys = Object.keys(states);

      if (typeof states === 'object') {
        stateKeys = stateKeys.filter(function (val) {
          if (val && _this2.routes[val]) {
            hash += '/' + encodeURIComponent(JSON.stringify(states[_this2.routes[val].property]));

            return false;
          }

          return true;
        });

        if (stateKeys.length) {
          stateKeys.unshift('');
          hash += stateKeys.reduce(this.stringDivider.bind(null, states, function (i) {
            return i === 1 ? '?' : '&';
          }));
        }
      }

      return hash;
    };

    WMRouter.prototype.set = function set(prop, val) {
      var tmpStore = (0, _sublimemediaWickerManUtilities.extend)(true, {}, this.store),
          superSet = _WMContent.prototype.set.bind({
        store: tmpStore,
        fireObservers: function fireObservers() {}
      });

      // Call superSet only with individual prop - val pairs to avoid tmpStore duplication.
      if (prop && (!this.routes[prop] || this.routes[prop] && !this.routes[prop].test || this.routes[prop] && this.routes[prop].test && this.routes[prop].test(val))) {
        if (typeof prop === 'string') {
          superSet(prop, val);
        } else if (typeof prop === 'object') {
          Object.keys(prop).forEach(function (key) {
            if (key) {
              superSet(key, prop[key]);
            }
          });
        }

        window.location.hash = this.objToHash(tmpStore);
      }

      return this;
    };

    WMRouter.prototype.urlChange = function urlChange() {
      var _this3 = this;

      var hash = window.location.hash,
          hashState = hash.slice(hash.indexOf('#/') + 2).split('?'),
          knownQueryString = hashState[0],
          unknownQueryString = hashState[1];

      if (knownQueryString) {
        (function () {
          var routesList = Object.keys(_this3.routes);

          knownQueryString.split('/').forEach(function (val, i) {
            var key = routesList[i];

            if (val !== encodeURIComponent(JSON.stringify(_this3.store[key]))) {
              val = JSON.parse(decodeURIComponent(val));

              _this3.store[key] = val;
              _this3.fireObservers(key, val);
            }
          });
        })();
      }

      if (unknownQueryString) {
        unknownQueryString.split('&').forEach(function (query) {
          if (query) {
            var parsedQuery = query.split('='),
                key = parsedQuery[0],
                val = parsedQuery[1];

            if (val !== encodeURIComponent(JSON.stringify(_this3.store[key]))) {
              _this3.store[key] = JSON.parse(decodeURIComponent(val));
              _this3.fireObservers(key, val);
            }
          }
        });
      }
    };

    return WMRouter;
  })(_WMContent2['default']);

  module.exports = WMRouter;
});