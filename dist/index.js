// src/clientAtom.ts
import { atom } from "jotai";
import {
  InMemoryCache,
  ApolloClient
} from "@apollo/client";
var DEFAULT_URL = typeof process === "object" && process.env.JOTAI_APOLLO_DEFAULT_URL || "/graphql";
var defaultClient = null;
var clientAtom = atom(() => {
  if (!defaultClient) {
    defaultClient = new ApolloClient({
      uri: DEFAULT_URL,
      cache: new InMemoryCache()
    });
  }
  return defaultClient;
});

// src/atomWithQuery.ts
import { atom as atom3 } from "jotai";
import { atomWithObservable as atomWithObservable2 } from "jotai/utils";

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
    return client.watchQuery(args);
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
