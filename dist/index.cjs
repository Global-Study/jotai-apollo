var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
  atomsWithQuery: () => atomsWithQuery,
  atomsWithSubscription: () => atomsWithSubscription,
  clientAtom: () => clientAtom
});

// src/clientAtom.ts
var import_jotai = __toModule(require("jotai"));
var import_client = __toModule(require("@apollo/client"));
var DEFAULT_URL = typeof process === "object" && process.env.JOTAI_APOLLO_DEFAULT_URL || "/graphql";
var defaultClient = null;
var clientAtom = (0, import_jotai.atom)(() => {
  if (!defaultClient) {
    defaultClient = new import_client.ApolloClient({
      uri: DEFAULT_URL,
      cache: new import_client.InMemoryCache()
    });
  }
  return defaultClient;
});

// src/atomsWithQuery.ts
var import_jotai3 = __toModule(require("jotai"));
var import_utils2 = __toModule(require("jotai/utils"));

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

// src/atomsWithQuery.ts
var atomsWithQuery = (getArgs, getClient = (get) => get(clientAtom), onError) => {
  const refreshAtom = atomWithIncrement(0);
  const handleActionAtom = (0, import_jotai3.atom)(null, (_get, set, action) => {
    if (action.type === "refetch") {
      set(refreshAtom);
    }
  });
  const sourceAtom = (0, import_utils2.atomWithObservable)((get) => {
    get(refreshAtom);
    const args = getArgs(get);
    const client = getClient(get);
    return client.watchQuery(args);
  }, { initialValue: null });
  return (0, import_jotai3.atom)((get) => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  atomsWithQuery,
  atomsWithSubscription,
  clientAtom
});
//# sourceMappingURL=index.cjs.map
