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
  atomOfFragment: () => atomOfFragment,
  atomWithMutation: () => atomWithMutation,
  atomWithQuery: () => atomWithQuery,
  clientAtom: () => clientAtom,
  initJotaiApollo: () => initJotaiApollo
});

// src/clientAtom.ts
var import_jotai = __toModule(require("jotai"));
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
var clientAtom = (0, import_jotai.atom)(async () => clientPromise, (_get, _set, client2) => {
  initJotaiApollo(client2);
});

// src/atomWithQuery.ts
var import_client = __toModule(require("@apollo/client"));
var import_jotai4 = __toModule(require("jotai"));

// src/common.ts
var import_jotai2 = __toModule(require("jotai"));
var import_utils = __toModule(require("jotai/utils"));
var atomWithIncrement = (initialValue) => {
  const internalAtom = (0, import_jotai2.atom)(initialValue);
  return (0, import_jotai2.atom)((get) => get(internalAtom), (_get, set) => set(internalAtom, (c) => c + 1));
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
      subscription: void 0,
      syncResult: LOADING,
      updateResult: void 0
    };
    const initialResult = options && "initialValue" in options ? {
      d: typeof options.initialValue === "function" ? options.initialValue() : options.initialValue
    } : LOADING;
    const latestAtom = (0, import_jotai3.atom)(initialResult);
    const resultAtom = (0, import_jotai3.atom)((get2, { setSelf }) => {
      const latestData = get2(latestAtom);
      let sync = true;
      const updateResult = (res) => {
        if (sync) {
          STATE.syncResult = res;
          setTimeout(() => setSelf(res), 0);
        } else {
          setSelf(res);
        }
      };
      if (!STATE.pending) {
        STATE.pending = new Promise((resolve) => {
          STATE.resolve = resolve;
          STATE.subscription = observable.subscribe({
            next: (d) => updateResult({ d }),
            error: (e) => updateResult({ e }),
            complete: () => {
            }
          });
        });
      }
      sync = false;
      if (STATE.syncResult !== LOADING) {
        return STATE.syncResult;
      }
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

// src/storeVersionAtom.ts
var import_utils2 = __toModule(require("jotai/utils"));
var storeVersionAtom = (0, import_utils2.atomFamily)((client2) => {
  return atomWithObservable2(() => {
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
});
var storeVersionAtom_default = storeVersionAtom;

// src/atomWithQuery.ts
var atomWithQuery = (getArgs, onError, getClient = (get) => get(clientAtom)) => {
  const refreshAtom = atomWithIncrement(0);
  const handleActionAtom = (0, import_jotai4.atom)(null, (_get, set, action) => {
    if (action.type === "refetch") {
      set(refreshAtom);
    }
  });
  const wrapperAtom = (0, import_jotai4.atom)(async (get) => {
    const client2 = await getClient(get);
    const sourceAtom = atomWithObservable2((get2) => {
      const args = getArgs(get2);
      get2(storeVersionAtom_default(client2));
      get2(refreshAtom);
      return wrapObservable(client2.watchQuery(args));
    });
    return sourceAtom;
  });
  return (0, import_jotai4.atom)(async (get) => {
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
        networkStatus: import_client.NetworkStatus.error
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

// src/atomOfFragment.ts
var import_utils3 = __toModule(require("jotai/utils"));
var import_jotai6 = __toModule(require("jotai"));
var import_fragments = __toModule(require("@apollo/client/utilities/graphql/fragments"));
var DefaultDiffResult = {
  result: void 0
};
var fragmentToQueryDocMemo = new Map();
function getQueryDocForFragment(fragmentDoc, fragmentName) {
  let queryDoc = fragmentToQueryDocMemo.get(fragmentDoc);
  if (!queryDoc) {
    queryDoc = (0, import_fragments.getFragmentQueryDocument)(fragmentDoc, fragmentName);
    fragmentToQueryDocMemo.set(fragmentDoc, queryDoc);
  }
  return queryDoc;
}
var atomOfFragment = (getArgs) => {
  const loadableClientAtom = (0, import_utils3.loadable)(clientAtom);
  const wrapperAtom = (0, import_jotai6.atom)((get) => {
    const loadableClient = get(loadableClientAtom);
    if (loadableClient.state !== "hasData") {
      return null;
    }
    const client2 = loadableClient.data;
    const sourceAtom = atomWithObservable2((get2) => {
      const { fragment, fragmentName, from, optimistic } = getArgs(get2);
      get2(storeVersionAtom_default(client2));
      const id = typeof from === "string" || !from ? from : client2.cache.identify(from);
      return {
        subscribe(observer) {
          const unsubscribe = client2.cache.watch({
            query: getQueryDocForFragment(fragment, fragmentName),
            id,
            callback: () => {
              const latestData = client2.readFragment({
                fragment,
                fragmentName,
                id
              }, optimistic);
              if (latestData) {
                console.log("JOTAI_APOLLO");
                console.log(JSON.stringify(latestData));
                observer.next({ complete: true, result: latestData });
              } else {
                observer.next({ complete: false });
              }
            },
            optimistic,
            returnPartialData: true,
            immediate: true
          });
          return {
            unsubscribe: () => {
              console.log(`UNSUB`);
            }
          };
        }
      };
    }, { initialValue: DefaultDiffResult });
    return sourceAtom;
  });
  return (0, import_jotai6.atom)((get) => {
    const sourceAtom = get(wrapperAtom);
    if (sourceAtom) {
      return get(sourceAtom);
    }
    return DefaultDiffResult;
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  atomOfFragment,
  atomWithMutation,
  atomWithQuery,
  clientAtom,
  initJotaiApollo
});
//# sourceMappingURL=index.cjs.map
