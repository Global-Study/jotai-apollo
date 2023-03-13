import * as jotai from 'jotai';
import { Getter, WritableAtom } from 'jotai';
import { ApolloClient, NormalizedCacheObject, OperationVariables, ApolloQueryResult, QueryOptions, SubscriptionOptions, SubscriptionResult } from '@apollo/client';

declare const clientAtom: jotai.Atom<ApolloClient<NormalizedCacheObject>>;

declare type QueryArgs<Variables extends object = OperationVariables, Data = any> = QueryOptions<Variables, Data>;
declare type AtomWithQueryAction = {
    type: 'refetch';
};
declare const atomWithQuery: <Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => QueryArgs<Variables, Data>, getClient?: (get: Getter) => ApolloClient<unknown>, onError?: ((result: ApolloQueryResult<Data>) => void) | undefined) => WritableAtom<ApolloQueryResult<Data> | undefined, AtomWithQueryAction, void>;

declare type Action = {
    readonly type: 'refetch';
};
declare function atomsWithSubscription<Data, Variables extends object = OperationVariables>(getArgs: (get: Getter) => SubscriptionOptions<Variables, Data>, getClient?: (get: Getter) => ApolloClient<any>): readonly [
    dataAtom: WritableAtom<Data | undefined, Action>,
    statusAtom: WritableAtom<SubscriptionResult<Data, Variables> | null, Action>
];

export { atomWithQuery, atomsWithSubscription, clientAtom };
