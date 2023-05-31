import * as jotai from 'jotai';
import { Getter, WritableAtom } from 'jotai';
import * as _apollo_client from '@apollo/client';
import { ApolloClient, OperationVariables, ApolloQueryResult, QueryOptions, DefaultContext, DocumentNode, MutationOptions, SubscriptionOptions, SubscriptionResult } from '@apollo/client';

declare const clientAtom: jotai.WritableAtom<ApolloClient<unknown>, [client: ApolloClient<unknown>], void>;

declare type QueryArgs<Variables extends object = OperationVariables, Data = any> = QueryOptions<Variables, Data>;
declare type AtomWithQueryAction = {
    type: 'refetch';
};
declare const atomWithQuery: <Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => QueryArgs<Variables, Data>, onError?: ((result: ApolloQueryResult<Data | undefined>) => void) | undefined, getClient?: (get: Getter) => ApolloClient<unknown>) => WritableAtom<Promise<ApolloQueryResult<Data | undefined>>, [AtomWithQueryAction], void>;

declare const atomWithMutation: <Data, Variables extends OperationVariables, Context extends Record<string, any> = DefaultContext>(mutation: DocumentNode, onError?: ((error: unknown) => void) | undefined, getClient?: (get: Getter) => ApolloClient<unknown>) => jotai.WritableAtom<null, [options: Omit<MutationOptions<Data, Variables, Context, _apollo_client.ApolloCache<any>>, "mutation">], Promise<_apollo_client.SingleExecutionResult<Data, Record<string, any>, Record<string, any>> | _apollo_client.ExecutionPatchInitialResult<Data, Record<string, any>> | _apollo_client.ExecutionPatchIncrementalResult<Data, Record<string, any>> | {
    data: undefined;
    errors: unknown;
}>> & {
    init: null;
};

declare type Action = {
    readonly type: 'refetch';
};
declare function atomsWithSubscription<Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => SubscriptionOptions<Variables, Data>, getClient?: (get: Getter) => ApolloClient<any>): readonly [
    dataAtom: WritableAtom<Data | undefined, [Action], void>,
    statusAtom: WritableAtom<SubscriptionResult<Data, Variables> | null, [
        Action
    ], void>
];

export { atomWithMutation, atomWithQuery, atomsWithSubscription, clientAtom };
