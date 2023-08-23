var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.ts
__export(exports, {
  atomWithMutation: () => atomWithMutation,
  atomWithQuery: () => atomWithQuery,
  atomsWithSubscription: () => atomsWithSubscription,
  clientAtom: () => clientAtom
});

// src/clientAtom.ts
var import_client = __toModule(require("@apollo/client"));
var import_jotai = __toModule(require("jotai"));
var DEFAULT_URL = typeof process === "object" && process.env.JOTAI_APOLLO_DEFAULT_URL || "/graphql";
var defaultClient = null;
var customClientAtom = (0, import_jotai.atom)(null);
var clientAtom = (0, import_jotai.atom)((get) => {
  const customClient = get(customClientAtom);
  if (customClient) {
    return customClient;
  }
  if (!defaultClient) {
    defaultClient = new import_client.ApolloClient({
      uri: DEFAULT_URL,
      cache: new import_client.InMemoryCache()
    });
  }
  return defaultClient;
}, (_get, set, client) => {
  set(customClientAtom, client);
});

// src/atomWithQuery.ts
var import_client2 = __toModule(require("@apollo/client"));
var import_jotai4 = __toModule(require("jotai"));

// src/common.ts
var import_jotai2 = __toModule(require("jotai"));
var import_utils = __toModule(require("jotai/utils"));
var atomWithIncrement = (initialValue) => {
  const internalAtom = (0, import_jotai2.atom)(initialValue);
  return (0, import_jotai2.atom)((get) => get(internalAtom), (_get, set) => set(internalAtom, (c) => c + 1));
};
var createAtoms = (getArgs, getClient, execute, handleAction) => {
  const refreshAtom = atomWithIncrement(0);
  const handleActionAtom = (0, import_jotai2.atom)(null, (get, set, action) => {
    const client = getClient(get);
    const refresh = () => set(refreshAtom);
    return handleAction(action, client, refresh);
  });
  const sourceAtom = (0, import_utils.atomWithObservable)((get) => {
    get(refreshAtom);
    const args = getArgs(get);
    const client = getClient(get);
    return execute(client, args);
  }, { initialValue: null });
  const statusAtom = (0, import_jotai2.atom)((get) => get(sourceAtom), (_get, set, action) => set(handleActionAtom, action));
  const dataAtom = (0, import_jotai2.atom)((get) => {
    const result = get(sourceAtom);
    if (result === null) {
      return void 0;
    }
    if (result.error) {
      throw result.error;
    }
    return result.data;
  }, (_get, set, action) => set(handleActionAtom, action));
  return [dataAtom, statusAtom];
};

// src/atomWithObservable.ts
var import_jotai3 = __toModule(require("jotai"));
var LOADING = Symbol("atomWithObservable is in loading state");
function atomWithObservable2(getObservable, options) {
  const returnResultData = (result) => {
    if ("e" in result) {
      throw result.e;
    }
    return result.d;
  };
  const observableResultAtom = (0, import_jotai3.atom)((get) => {
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
    const latestAtom = (0, import_jotai3.atom)(initialResult);
    const resultAtom = (0, import_jotai3.atom)((get2, { setSelf }) => {
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
  const observableAtom = (0, import_jotai3.atom)((get) => {
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
  const handleActionAtom = (0, import_jotai4.atom)(null, (_get, set, action) => {
    if (action.type === "refetch") {
      set(refreshAtom);
    }
  });
  const storeVersionAtom = atomWithObservable2((get) => {
    get(refreshAtom);
    const client = getClient(get);
    let version = 0;
    return {
      subscribe(observer) {
        return {
          unsubscribe: client.onClearStore(async () => {
            observer.next(++version);
          })
        };
      }
    };
  }, { initialValue: 0 });
  const sourceAtom = atomWithObservable2((get) => {
    get(storeVersionAtom);
    const args = getArgs(get);
    const client = getClient(get);
    return wrapObservable(client.watchQuery(args));
  });
  return (0, import_jotai4.atom)(async (get) => {
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
        networkStatus: import_client2.NetworkStatus.error
      };
      (_a = observer.next) == null ? void 0 : _a.call(observer, errorResult);
    }
    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }
});

// src/atomWithMutation.ts
var import_jotai5 = __toModule(require("jotai"));
var atomWithMutation = (mutation, onError, getClient = (get) => get(clientAtom)) => {
  return (0, import_jotai5.atom)(null, async (get, _set, options) => {
    const client = getClient(get);
    try {
      return client.mutate(__spreadProps(__spreadValues({}, options), {
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

// src/atomsWithSubscription.ts
function atomsWithSubscription(getArgs, getClient = (get) => get(clientAtom)) {
  return createAtoms((get) => getArgs(get), getClient, (client, args) => {
    return client.subscribe(args);
  }, (action, _client, refresh) => {
    if (action.type === "refetch") {
      refresh();
      return;
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  atomWithMutation,
  atomWithQuery,
  atomsWithSubscription,
  clientAtom
});
//# sourceMappingURL=index.cjs.map
