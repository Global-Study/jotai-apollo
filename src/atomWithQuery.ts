import {
  ApolloClient,
  OperationVariables,
  ApolloQueryResult,
  ObservableQuery,
  ApolloError,
  NetworkStatus,
  WatchQueryOptions,
} from '@apollo/client'
import { atom, Getter, WritableAtom } from 'jotai'

import { clientAtom } from './clientAtom'
import { atomWithIncrement } from './common'
import { atomWithObservable } from './atomWithObservable'

type QueryArgs<
  Variables extends object = OperationVariables,
  Data = any
> = WatchQueryOptions<Variables, Data>

type AtomWithQueryAction = {
  type: 'refetch'
}

export const atomWithQuery = <
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => QueryArgs<Variables, Data>,
  onError?: (result: ApolloQueryResult<Data | undefined>) => void,
  getClient: (get: Getter) => Promise<ApolloClient<unknown>> = (get) =>
    get(clientAtom)
): WritableAtom<
  Promise<ApolloQueryResult<Data | undefined>>,
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

  const wrapperAtom = atom(async (get) => {
    const client = await getClient(get)

    /**
     * Gets incremented when the Apollo client clears the store.
     */
    const storeVersionAtom = atomWithObservable(
      (get) => {
        get(refreshAtom)
        let version = 0

        return {
          subscribe(observer: Observer<number>) {
            return {
              unsubscribe: client.onClearStore(async () => {
                observer.next(++version)
              }),
            }
          },
        }
      },
      { initialValue: 0 }
    )

    const sourceAtom = atomWithObservable((get) => {
      get(storeVersionAtom)
      const args = getArgs(get)

      return wrapObservable(client.watchQuery(args))
    })

    return sourceAtom
  })

  return atom(
    async (get) => {
      const sourceAtom = await get(wrapperAtom)
      const result = await get(sourceAtom)

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

const wrapObservable = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables
>(
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
      const last = observableQuery['last']
      subscription.unsubscribe()

      try {
        observableQuery.resetLastResults()
        subscription = observableQuery.subscribe(onNext, onError)
      } finally {
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
