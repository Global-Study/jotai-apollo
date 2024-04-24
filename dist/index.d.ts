import * as jotai from 'jotai';
import { Getter, WritableAtom, Atom } from 'jotai';
import * as _apollo_client from '@apollo/client';
import { ApolloClient, OperationVariables, ApolloQueryResult, WatchQueryOptions, DefaultContext, DocumentNode, MutationOptions, StoreObject, DataProxy } from '@apollo/client';
import * as _graphql_typed_document_node_core from '@graphql-typed-document-node/core';

declare function initJotaiApollo(newClient: ApolloClient<unknown>): void;
declare const clientAtom: jotai.WritableAtom<ApolloClient<unknown> | Promise<ApolloClient<unknown>>, [client: ApolloClient<unknown>], void>;

declare type PromiseOrValue<T> = Promise<T> | T;

declare type QueryArgs<Variables extends object = OperationVariables, Data = any> = Omit<WatchQueryOptions<Variables, Data>, 'fetchPolicy' | 'nextFetchPolicy'>;
declare type AtomWithQueryAction = {
    type: 'refetch';
};
declare const atomWithQuery: <Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => QueryArgs<Variables, Data>, onError?: ((result: ApolloQueryResult<Data | undefined>) => void) | undefined, getClient?: (get: Getter) => PromiseOrValue<ApolloClient<unknown>>) => WritableAtom<Promise<ApolloQueryResult<Data | undefined>>, [AtomWithQueryAction], Promise<void>>;

declare const atomWithMutation: <Data, Variables extends OperationVariables, Context extends Record<string, any> = DefaultContext>(mutation: DocumentNode | _graphql_typed_document_node_core.TypedDocumentNode<Data, Variables>, onError?: ((error: unknown) => void) | undefined, getClient?: (get: Getter) => PromiseOrValue<ApolloClient<unknown>>) => jotai.WritableAtom<null, [options: Omit<MutationOptions<Data, Variables, Context, _apollo_client.ApolloCache<any>>, "mutation">], Promise<_apollo_client.SingleExecutionResult<Data, Record<string, any>, Record<string, any>> | _apollo_client.ExecutionPatchInitialResult<Data, Record<string, any>> | _apollo_client.ExecutionPatchIncrementalResult<Data, Record<string, any>> | {
    data: undefined;
    errors: unknown;
}>> & {
    init: null;
};

declare type WatchFragmentArgs<Data = any> = {
    fragment: DocumentNode;
    fragmentName: string;
    from: Partial<Data> | string | undefined;
    optimistic: boolean;
};
declare const atomOfFragment: <Data extends StoreObject>(getArgs: (get: Getter) => WatchFragmentArgs<Data>) => Atom<DataProxy.DiffResult<Data>>;

export { atomOfFragment, atomWithMutation, atomWithQuery, clientAtom, initJotaiApollo };
