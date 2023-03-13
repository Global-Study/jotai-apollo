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

// src/common.ts
import { atom as atom2 } from "jotai";
import { atomWithObservable } from "jotai/utils";
var createRefreshAtom = () => {
  const internalAtom = atom2(0);
  return atom2((get) => get(internalAtom), (_get, set) => set(internalAtom, (c) => c + 1));
};
var createAtoms = (getArgs, getClient, execute, handleAction) => {
  const refreshAtom = createRefreshAtom();
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

// src/atomsWithQuery.ts
var atomsWithQuery = (getArgs, getClient = (get) => get(clientAtom)) => {
  return createAtoms(getArgs, getClient, (client, args) => client.watchQuery(args), (action, _client, refresh) => {
    if (action.type === "refetch") {
      refresh();
      return;
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
export {
  atomsWithQuery,
  atomsWithSubscription,
  clientAtom
};
//# sourceMappingURL=index.js.map
