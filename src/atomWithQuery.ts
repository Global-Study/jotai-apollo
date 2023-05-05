import {
  ApolloClient,
  OperationVariables,
  QueryOptions,
  ApolloQueryResult,
  ObservableQuery,
  ApolloError,
  NetworkStatus,
} from '@apollo/client'
import { atomWithObservable } from 'jotai/utils'
import { atom, Getter, WritableAtom } from 'jotai'

import { clientAtom } from './clientAtom'
import { atomWithIncrement } from './common'

type QueryArgs<
  Variables extends object = OperationVariables,
  Data = any
> = QueryOptions<Variables, Data>

type AtomWithQueryAction = {
  type: 'refetch'
}

export const atomWithQuery = <
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => QueryArgs<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<unknown> = (get) => get(clientAtom),
  onError?: (result: ApolloQueryResult<Data | undefined>) => void
): WritableAtom<
  ApolloQueryResult<Data | undefined> | undefined,
  [AtomWithQueryAction],
  void
> => {
  const refreshAtom = atomWithIncrement(0)

  const handleActionAtom = atom(
    null,
    (_get, set, action: AtomWithQueryAction) => {
      if (action.type === 'refetch') {
        set(refreshAtom)
      }
    }
  )

  const sourceAtom = atomWithObservable(
    (get) => {
      get(refreshAtom)
      const args = getArgs(get)
      const client = getClient(get)

      return wrapObservable(client.watchQuery(args))
    },
    { initialValue: null }
  )

  return atom(
    (get) => {
      const result = get(sourceAtom)

      if (result === null) {
        return undefined
      }

      if (result.error) {
        if (onError) {
          onError(result)
        } else {
          throw result.error
        }
      }

      return result
    },
    (_get, set, action: AtomWithQueryAction) => set(handleActionAtom, action)
  )
}

type Observer<T> = {
  next: (value: T) => void
  error: (error: unknown) => void
  complete: () => void
}

type Subscription = {
  unsubscribe: () => void
}

const wrapObservable = <TData = unknown, TVariables = OperationVariables>(
  observableQuery: ObservableQuery<TData, TVariables>
) => ({
  subscribe: (
    observer: Partial<Observer<ApolloQueryResult<TData | undefined>>>
  ): Subscription => {
    let subscription = observableQuery.subscribe(onNext, onError)

    function onNext(result: ApolloQueryResult<TData>) {
      observer.next?.(result)
    }

    function onError(error: unknown) {
      const last = observableQuery.getLastResult()
      subscription.unsubscribe()

      try {
        observableQuery.resetLastResults()
        subscription = observableQuery.subscribe(onNext, onError)
      } finally {
        // eslint-disable-next-line no-param-reassign, dot-notation
        observableQuery['last'] = last
      }

      const errorResult: ApolloQueryResult<TData | undefined> = {
        data: observableQuery.getCurrentResult().data,
        error: error as ApolloError,
        loading: false,
        networkStatus: NetworkStatus.error,
      }

      // Errors are returned as part of the result
      observer.next?.(errorResult)
    }

    return {
      unsubscribe: () => subscription.unsubscribe(),
    }
  },
})
