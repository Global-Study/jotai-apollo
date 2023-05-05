// src/clientAtom.ts
import {
  InMemoryCache,
  ApolloClient
} from "@apollo/client";
import { atom } from "jotai";
var DEFAULT_URL = typeof process === "object" && process.env.JOTAI_APOLLO_DEFAULT_URL || "/graphql";
var defaultClient = null;
var customClientAtom = atom(null);
var clientAtom = atom((get) => {
  const customClient = get(customClientAtom);
  if (customClient) {
    return customClient;
  }
  if (!defaultClient) {
    defaultClient = new ApolloClient({
      uri: DEFAULT_URL,
      cache: new InMemoryCache()
    });
  }
  return defaultClient;
}, (_get, set, client) => {
  set(customClientAtom, client);
});

// src/atomWithQuery.ts
import {
  NetworkStatus
} from "@apollo/client";
import { atomWithObservable as atomWithObservable2 } from "jotai/utils";
import { atom as atom3 } from "jotai";

// src/common.ts
import { atom as atom2 } from "jotai";
import { atomWithObservable } from "jotai/utils";
var atomWithIncrement = (initialValue) => {
  const internalAtom = atom2(initialValue);
  return atom2((get) => get(internalAtom), (_get, set) => set(internalAtom, (c) => c + 1));
};
var createAtoms = (getArgs, getClient, execute, handleAction) => {
  const refreshAtom = atomWithIncrement(0);
  const handleActionAtom = atom2(null, (get, set, action) => {
    const client = getClient(get);
    const refresh = () => set(refreshAtom);
    return handleAction(action, client, refresh);
  });
  const sourceAtom = atomWithObservable((get) => {
    get(refreshAtom);
    const args = getArgs(get);
    const client = getClient(get);
    return execute(client, args);
  }, { initialValue: null });
  const statusAtom = atom2((get) => get(sourceAtom), (_get, set, action) => set(handleActionAtom, action));
  const dataAtom = atom2((get) => {
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

// src/atomWithQuery.ts
var atomWithQuery = (getArgs, getClient = (get) => get(clientAtom), onError) => {
  const refreshAtom = atomWithIncrement(0);
  const handleActionAtom = atom3(null, (_get, set, action) => {
    if (action.type === "refetch") {
      set(refreshAtom);
    }
  });
  const sourceAtom = atomWithObservable2((get) => {
    get(refreshAtom);
    const args = getArgs(get);
    const client = getClient(get);
    return wrapObservable(client.watchQuery(args));
  }, { initialValue: null });
  return atom3((get) => {
    const result = get(sourceAtom);
    if (result === null) {
      return void 0;
    }
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
      const last = observableQuery.getLastResult();
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
export {
  atomWithQuery,
  atomsWithSubscription,
  clientAtom
};
//# sourceMappingURL=index.js.map
