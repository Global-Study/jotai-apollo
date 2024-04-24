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
var clientAtom = atom(() => client != null ? client : clientPromise, (_get, _set, client2) => {
  initJotaiApollo(client2);
});

// src/atomWithQuery.ts
import {
  NetworkStatus
} from "@apollo/client";
import { atom as atom2 } from "jotai";
import { atomWithObservable as atomWithObservable2 } from "jotai/utils";

// src/storeVersionAtom.ts
import { atomFamily, atomWithObservable } from "jotai/utils";
var storeVersionAtom = atomFamily((client2) => {
  return atomWithObservable(() => {
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
  const handleActionAtom = atom2(null, async (get, _set, action) => {
    const client2 = await getClient(get);
    const args = getArgs(get);
    if (action.type === "refetch") {
      await client2.refetchQueries({
        include: [args.query]
      });
    }
  });
  const wrapperAtom = atom2(async (get) => {
    const client2 = await getClient(get);
    const sourceAtom = atomWithObservable2((get2) => {
      const args = getArgs(get2);
      get2(storeVersionAtom_default(client2));
      return wrapObservable(client2.watchQuery(__spreadProps(__spreadValues({}, args), {
        fetchPolicy: "cache-first"
      })));
    }, {
      unstable_timeout: 1e4
    });
    return sourceAtom;
  });
  return atom2(async (get) => {
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
import { atom as atom3 } from "jotai";
var atomWithMutation = (mutation, onError, getClient = (get) => get(clientAtom)) => {
  return atom3(null, async (get, _set, options) => {
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
import { loadable, atomWithObservable as atomWithObservable3 } from "jotai/utils";
import { atom as atom4 } from "jotai";
import { getFragmentQueryDocument } from "@apollo/client/utilities/graphql/fragments";
var DefaultDiffResult = {
  result: void 0
};
var fragmentToQueryDocMemo = new Map();
function getQueryDocForFragment(fragmentDoc, fragmentName) {
  let queryDoc = fragmentToQueryDocMemo.get(fragmentDoc);
  if (!queryDoc) {
    queryDoc = getFragmentQueryDocument(fragmentDoc, fragmentName);
    fragmentToQueryDocMemo.set(fragmentDoc, queryDoc);
  }
  return queryDoc;
}
var atomOfFragment = (getArgs) => {
  const wrapperAtom = atom4((get) => {
    const loadableClient = get(loadable(clientAtom));
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
    const sourceAtom = atomWithObservable3((get2) => {
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
  return atom4((get) => {
    const sourceAtom = get(wrapperAtom);
    if (sourceAtom) {
      return get(sourceAtom);
    }
    return DefaultDiffResult;
  });
};
export {
  atomOfFragment,
  atomWithMutation,
  atomWithQuery,
  clientAtom,
  initJotaiApollo
};
//# sourceMappingURL=index.js.map
