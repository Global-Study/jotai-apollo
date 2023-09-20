var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/clientAtom.ts
import { atom } from "jotai";
var client = null;
var resolveClient;
var clientPromise = new Promise((resolve) => {
  resolveClient = resolve;
});
function initJotaiApollo(newClient) {
  if (client !== null && client !== newClient) {
    throw new Error(`Can setup jotai-apollo only once`);
  }
  client = newClient;
  resolveClient(client);
}
var clientAtom = atom(async () => clientPromise, (_get, _set, client2) => {
  initJotaiApollo(client2);
});

// src/atomWithQuery.ts
import {
  NetworkStatus
} from "@apollo/client";
import { atom as atom4 } from "jotai";

// src/common.ts
import { atom as atom2 } from "jotai";
import { atomWithObservable } from "jotai/utils";
var atomWithIncrement = (initialValue) => {
  const internalAtom = atom2(initialValue);
  return atom2((get) => get(internalAtom), (_get, set) => set(internalAtom, (c) => c + 1));
};

// src/atomWithObservable.ts
import { atom as atom3 } from "jotai";
var LOADING = Symbol("atomWithObservable is in loading state");
function atomWithObservable2(getObservable, options) {
  const returnResultData = (result) => {
    if ("e" in result) {
      throw result.e;
    }
    return result.d;
  };
  const observableResultAtom = atom3((get) => {
    var _a;
    let observable = getObservable(get);
    const itself = (_a = observable[Symbol.observable]) == null ? void 0 : _a.call(observable);
    if (itself) {
      observable = itself;
    }
    const STATE = {
      pending: void 0,
      resolve: void 0,
      subscription: void 0
    };
    const initialResult = options && "initialValue" in options ? {
      d: typeof options.initialValue === "function" ? options.initialValue() : options.initialValue
    } : LOADING;
    const latestAtom = atom3(initialResult);
    const resultAtom = atom3((get2, { setSelf }) => {
      if (!STATE.pending) {
        STATE.pending = new Promise((resolve) => {
          STATE.resolve = resolve;
          STATE.subscription = observable.subscribe({
            next: (d) => setSelf({ d }),
            error: (e) => setSelf({ e }),
            complete: () => {
            }
          });
        });
      }
      const latestData = get2(latestAtom);
      if (latestData !== LOADING) {
        return latestData;
      }
      return STATE.pending;
    }, (_get, set, result) => {
      if (STATE.resolve === void 0) {
        console.warn(`atomWithObservable is in an invalid state, 'resolve' is undefined`);
        return;
      }
      STATE.resolve(result);
      set(latestAtom, result);
    });
    return [resultAtom, observable];
  });
  const observableAtom = atom3((get) => {
    const [resultAtom] = get(observableResultAtom);
    const result = get(resultAtom);
    if (result instanceof Promise) {
      return result.then(returnResultData);
    }
    return returnResultData(result);
  }, (get, _set, data) => {
    const [_resultAtom, observable] = get(observableResultAtom);
    if ("next" in observable) {
      observable.next(data);
    } else {
      throw new Error("observable is not subject");
    }
  });
  return observableAtom;
}

// src/atomWithQuery.ts
var atomWithQuery = (getArgs, onError, getClient = (get) => get(clientAtom)) => {
  const refreshAtom = atomWithIncrement(0);
  const handleActionAtom = atom4(null, (_get, set, action) => {
    if (action.type === "refetch") {
      set(refreshAtom);
    }
  });
  const wrapperAtom = atom4(async (get) => {
    const client2 = await getClient(get);
    const storeVersionAtom = atomWithObservable2((get2) => {
      get2(refreshAtom);
      let version = 0;
      return {
        subscribe(observer) {
          return {
            unsubscribe: client2.onClearStore(async () => {
              observer.next(++version);
            })
          };
        }
      };
    }, { initialValue: 0 });
    const sourceAtom = atomWithObservable2((get2) => {
      get2(storeVersionAtom);
      const args = getArgs(get2);
      return wrapObservable(client2.watchQuery(args));
    });
    return sourceAtom;
  });
  return atom4(async (get) => {
    const sourceAtom = await get(wrapperAtom);
    const result = await get(sourceAtom);
    if (result.error) {
      if (onError) {
        onError(result);
      } else {
        throw result.error;
      }
    }
    return result;
  }, (_get, set, action) => set(handleActionAtom, action));
};
var wrapObservable = (observableQuery) => ({
  subscribe: (observer) => {
    let subscription = observableQuery.subscribe(onNext, onError);
    function onNext(result) {
      var _a;
      (_a = observer.next) == null ? void 0 : _a.call(observer, result);
    }
    function onError(error) {
      var _a;
      const last = observableQuery["last"];
      subscription.unsubscribe();
      try {
        observableQuery.resetLastResults();
        subscription = observableQuery.subscribe(onNext, onError);
      } finally {
        observableQuery["last"] = last;
      }
      const errorResult = {
        data: observableQuery.getCurrentResult().data,
        error,
        loading: false,
        networkStatus: NetworkStatus.error
      };
      (_a = observer.next) == null ? void 0 : _a.call(observer, errorResult);
    }
    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }
});

// src/atomWithMutation.ts
import { atom as atom5 } from "jotai";
var atomWithMutation = (mutation, onError, getClient = (get) => get(clientAtom)) => {
  return atom5(null, async (get, _set, options) => {
    const client2 = await getClient(get);
    try {
      return client2.mutate(__spreadProps(__spreadValues({}, options), {
        mutation
      }));
    } catch (e) {
      if (onError) {
        onError(e);
        return { data: void 0, errors: e };
      }
      throw e;
    }
  });
};
export {
  atomWithMutation,
  atomWithQuery,
  clientAtom,
  initJotaiApollo
};
//# sourceMappingURL=index.js.map
