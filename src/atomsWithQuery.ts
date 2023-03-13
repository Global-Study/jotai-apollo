import {
  ApolloClient,
  OperationVariables,
  QueryOptions,
  ApolloQueryResult,
} from '@apollo/client'
import { Getter, WritableAtom } from 'jotai'

import { clientAtom } from './clientAtom'
import { createAtoms } from './common'

type QueryArgs<
  Variables extends object = OperationVariables,
  Data = any
> = QueryOptions<Variables, Data>

type AtomWithQueryAction = {
  type: 'refetch'
}

export const atomsWithQuery = <
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => QueryArgs<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<unknown> = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data | undefined, AtomWithQueryAction>,
  statusAtom: WritableAtom<ApolloQueryResult<Data> | null, AtomWithQueryAction>
] => {
  return createAtoms(
    getArgs,
    getClient,
    (client, args) => client.watchQuery(args),
    (action: AtomWithQueryAction, _client, refresh) => {
      if (action.type === 'refetch') {
        refresh()
        return
      }
    }
  )
}
