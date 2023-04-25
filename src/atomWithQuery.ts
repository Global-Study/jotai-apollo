import {
  ApolloClient,
  OperationVariables,
  QueryOptions,
  ApolloQueryResult,
} from '@apollo/client'
import { atom, Getter, WritableAtom } from 'jotai'
import { atomWithObservable } from 'jotai/utils'

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
  onError?: (result: ApolloQueryResult<Data>) => void
): WritableAtom<
  ApolloQueryResult<Data> | undefined,
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

      return client.watchQuery(args)
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
