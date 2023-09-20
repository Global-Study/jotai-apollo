import * as jotai from 'jotai';
import { Getter, WritableAtom } from 'jotai';
import * as _apollo_client from '@apollo/client';
import { ApolloClient, OperationVariables, ApolloQueryResult, WatchQueryOptions, DefaultContext, DocumentNode, MutationOptions } from '@apollo/client';

declare function initJotaiApollo(newClient: ApolloClient<unknown>): void;
declare const clientAtom: jotai.WritableAtom<Promise<ApolloClient<unknown>>, [client: ApolloClient<unknown>], void>;

declare type QueryArgs<Variables extends object = OperationVariables, Data = any> = WatchQueryOptions<Variables, Data>;
declare type AtomWithQueryAction = {
    type: 'refetch';
};
declare const atomWithQuery: <Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => QueryArgs<Variables, Data>, onError?: ((result: ApolloQueryResult<Data | undefined>) => void) | undefined, getClient?: (get: Getter) => Promise<ApolloClient<unknown>>) => WritableAtom<Promise<ApolloQueryResult<Data | undefined>>, [AtomWithQueryAction], void>;

declare const atomWithMutation: <Data, Variables extends OperationVariables, Context extends Record<string, any> = DefaultContext>(mutation: DocumentNode, onError?: ((error: unknown) => void) | undefined, getClient?: (get: Getter) => Promise<ApolloClient<unknown>>) => jotai.WritableAtom<null, [options: Omit<MutationOptions<Data, Variables, Context, _apollo_client.ApolloCache<any>>, "mutation">], Promise<_apollo_client.SingleExecutionResult<Data, Record<string, any>, Record<string, any>> | _apollo_client.ExecutionPatchInitialResult<Data, Record<string, any>> | _apollo_client.ExecutionPatchIncrementalResult<Data, Record<string, any>> | {
    data: undefined;
    errors: unknown;
}>> & {
    init: null;
};

export { atomWithMutation, atomWithQuery, clientAtom, initJotaiApollo };
