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
import { atomWithObservable } from 'jotai/utils'

import { clientAtom } from './clientAtom'
import storeVersionAtom from './storeVersionAtom'
import { Observer, PromiseOrValue } from './types'

type QueryArgs<
  Variables extends object = OperationVariables,
  Data = any
> = Omit<WatchQueryOptions<Variables, Data>, 'fetchPolicy' | 'nextFetchPolicy'>

type AtomWithQueryAction = {
  type: 'refetch'
}

export const atomWithQuery = <
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => QueryArgs<Variables, Data>,
  onError?: (result: ApolloQueryResult<Data | undefined>) => void,
  getClient: (get: Getter) => PromiseOrValue<ApolloClient<unknown>> = (get) =>
    get(clientAtom)
): WritableAtom<
  Promise<ApolloQueryResult<Data | undefined>>,
  [AtomWithQueryAction],
  Promise<void>
> => {
  const handleActionAtom = atom(
    null,
    async (get, _set, action: AtomWithQueryAction) => {
      const client = await getClient(get)
      const args = getArgs(get)

      if (action.type === 'refetch') {
        await client.refetchQueries({
          include: [args.query],
        })
      }
    }
  )

  const wrapperAtom = atom(async (get) => {
    const client = await getClient(get)

    const sourceAtom = atomWithObservable(
      (get) => {
        const args = getArgs(get)

        // Resetting on store-version change
        get(storeVersionAtom(client))

        return wrapObservable(
          client.watchQuery({
            ...args,
            // Limiting to these settings for now, as this is the most sane behavior for atoms with query.
            fetchPolicy: 'cache-first',
          })
        )
      },
      {
        // If not mounted, but used anyway, the query will get unwatched after 10 seconds of inactivity
        unstable_timeout: 10000,
      }
    )

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
