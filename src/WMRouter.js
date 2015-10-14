import { createPath, extend } from '@sublimemedia/wicker-man-utilities';
import WMContent from '@sublimemedia/wicker-man-content';

export default class WMRouter extends WMContent {
  constructor() {
    super();

    this.store = {};
    this.routes = {};
    this.observed = {};

    window.addEventListener('hashchange', this.urlChange.bind(this), false);
  }

  defineRoute(route) {
    if (route && typeof route === 'object' && route.property) {
      let newRouterPath = createPath(route.property, this.routes);

      Object.keys(route)
      .forEach(function(key) {
          newRouterPath[key] = route[key];
      });

      if(route.hasOwnProperty('defaultValue') && typeof this.get(route.property) === 'undefined') {
          this.set(route.property, route.defaultValue);
      }
    }

    return this;
  }

  stringDivider(ref, divider, prevValue, currentValue, i) {
    const val = ref[currentValue];
    return prevValue + divider(i) + (typeof val !== 'undefined' ? (currentValue + '=' + encodeURIComponent(JSON.stringify(val))) : '');
  }

  objToHash(states) {
    let hash = '',
      stateKeys = Object.keys(states);

    if (typeof states === 'object') {
        stateKeys = stateKeys.filter(val => {
          if (val && this.routes[val]) {
            hash += '/' + encodeURIComponent(JSON.stringify(states[this.routes[val].property]));

            return false;
          }

          return true;
        });

        if (stateKeys.length) {
          stateKeys.unshift('');
          hash += stateKeys.reduce(this.stringDivider.bind(null, states, i => i === 1 ? '?' : '&'));
        }
    }

    return hash;
  }

  set(prop, val) {
    let tmpStore = extend(true, {}, this.store),
      superSet = super.set.bind({
          store: tmpStore,
          fireObservers: function() {}
        });

    // Call superSet only with individual prop - val pairs to avoid tmpStore duplication.
    if (prop &&
        (!this.routes[prop] ||
        (this.routes[prop] && !this.routes[prop].test) ||
        (this.routes[prop] && this.routes[prop].test && this.routes[prop].test(val))
        )) {
        if (typeof prop === 'string') {
            superSet(prop, val);
        } else if (typeof prop === 'object') {
            Object.keys(prop)
            .forEach(key => {
              if (key) {
                superSet(key, prop[key]);
              }
            });
        }

        window.location.hash = this.objToHash(tmpStore);
    }

    return this;
  }

  urlChange() {
      const hash = window.location.hash,
          hashState = hash.slice(hash.indexOf('#/') + 2).split('?'),
          knownQueryString = hashState[0],
          unknownQueryString = hashState[1];

      if (knownQueryString) {
        const routesList = Object.keys(this.routes);

        knownQueryString.split('/')
        .forEach((val, i) => {
            const key = routesList[i];
            
            if(val !== encodeURIComponent(JSON.stringify(this.store[key]))) {
              val = JSON.parse(decodeURIComponent(val));

              this.store[key] = val;
              this.fireObservers(key, val);
            }
        });
      }

      if(unknownQueryString) {
          unknownQueryString.split('&')
          .forEach(query => {
            if (query) {
              const parsedQuery = query.split('='),
                key = parsedQuery[0],
                val = parsedQuery[1];

              if (val !== encodeURIComponent(JSON.stringify(this.store[key]))) {
                this.store[key] = JSON.parse(decodeURIComponent(val));
                this.fireObservers(key, val);
              }
            }
          });
      }
  }
}
