import * as jotai from 'jotai';
import { Getter, WritableAtom } from 'jotai';
import { ApolloClient, OperationVariables, ApolloQueryResult, QueryOptions, SubscriptionOptions, SubscriptionResult } from '@apollo/client';

declare const clientAtom: jotai.WritableAtom<ApolloClient<unknown>, [client: ApolloClient<unknown>], void>;

declare type QueryArgs<Variables extends object = OperationVariables, Data = any> = QueryOptions<Variables, Data>;
declare type AtomWithQueryAction = {
    type: 'refetch';
};
declare const atomWithQuery: <Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => QueryArgs<Variables, Data>, getClient?: (get: Getter) => ApolloClient<unknown>, onError?: ((result: ApolloQueryResult<Data | undefined>) => void) | undefined) => WritableAtom<ApolloQueryResult<Data | undefined> | undefined, [AtomWithQueryAction], void>;

declare type Action = {
    readonly type: 'refetch';
};
declare function atomsWithSubscription<Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => SubscriptionOptions<Variables, Data>, getClient?: (get: Getter) => ApolloClient<any>): readonly [
    dataAtom: WritableAtom<Data | undefined, [Action], void>,
    statusAtom: WritableAtom<SubscriptionResult<Data, Variables> | null, [
        Action
    ], void>
];

export { atomWithQuery, atomsWithSubscription, clientAtom };
