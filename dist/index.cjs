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
var clientAtom = (0, import_jotai.atom)(() => client != null ? client : clientPromise, (_get, _set, client2) => {
  initJotaiApollo(client2);
});

// src/atomWithQuery.ts
var import_client = __toModule(require("@apollo/client"));
var import_jotai3 = __toModule(require("jotai"));
var import_utils3 = __toModule(require("jotai/utils"));

// src/common.ts
var import_jotai2 = __toModule(require("jotai"));
var import_utils = __toModule(require("jotai/utils"));
var atomWithIncrement = (initialValue) => {
  const internalAtom = (0, import_jotai2.atom)(initialValue);
  return (0, import_jotai2.atom)((get) => get(internalAtom), (_get, set) => set(internalAtom, (c) => c + 1));
};

// src/storeVersionAtom.ts
var import_utils2 = __toModule(require("jotai/utils"));
var storeVersionAtom = (0, import_utils2.atomFamily)((client2) => {
  return (0, import_utils2.atomWithObservable)(() => {
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
  }, { initialValue: 0, unstable_timeout: 1e4 });
});
var storeVersionAtom_default = storeVersionAtom;

// src/atomWithQuery.ts
var atomWithQuery = (getArgs, onError, getClient = (get) => get(clientAtom)) => {
  const refreshAtom = atomWithIncrement(0);
  const handleActionAtom = (0, import_jotai3.atom)(null, (_get, set, action) => {
    if (action.type === "refetch") {
      set(refreshAtom);
    }
  });
  const wrapperAtom = (0, import_jotai3.atom)(async (get) => {
    const client2 = await getClient(get);
    const sourceAtom = (0, import_utils3.atomWithObservable)((get2) => {
      const args = getArgs(get2);
      get2(storeVersionAtom_default(client2));
      get2(refreshAtom);
      return wrapObservable(client2.watchQuery(__spreadProps(__spreadValues({}, args), {
        fetchPolicy: "cache-and-network"
      })));
    }, {
      unstable_timeout: 1e4
    });
    return sourceAtom;
  });
  return (0, import_jotai3.atom)(async (get) => {
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
var import_jotai4 = __toModule(require("jotai"));
var atomWithMutation = (mutation, onError, getClient = (get) => get(clientAtom)) => {
  return (0, import_jotai4.atom)(null, async (get, _set, options) => {
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
var import_utils4 = __toModule(require("jotai/utils"));
var import_jotai5 = __toModule(require("jotai"));
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
  const wrapperAtom = (0, import_jotai5.atom)((get) => {
    const loadableClient = get((0, import_utils4.loadable)(clientAtom));
    if (loadableClient.state !== "hasData") {
      return null;
    }
    const client2 = loadableClient.data;
    const { fragment, fragmentName, from, optimistic } = getArgs(get);
    const id = typeof from === "string" || !from ? from : client2.cache.identify(from);
    const computeLatestResult = () => {
      const latestData = client2.readFragment({
        fragment,
        fragmentName,
        id
      }, optimistic);
      return latestData ? { complete: true, result: latestData } : { complete: false };
    };
    const sourceAtom = (0, import_utils4.atomWithObservable)((get2) => {
      get2(storeVersionAtom_default(client2));
      return {
        subscribe(observer) {
          const unsubscribe = client2.cache.watch({
            query: getQueryDocForFragment(fragment, fragmentName),
            id,
            callback: () => {
              observer.next(computeLatestResult());
            },
            optimistic,
            returnPartialData: true,
            immediate: true
          });
          return {
            unsubscribe
          };
        }
      };
    }, {
      initialValue: computeLatestResult(),
      unstable_timeout: 1e4
    });
    return sourceAtom;
  });
  return (0, import_jotai5.atom)((get) => {
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
