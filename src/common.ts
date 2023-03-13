import { atom } from 'jotai'
import type { Getter } from 'jotai'
import { atomWithObservable } from 'jotai/utils'
import { ApolloClient, ApolloQueryResult } from '@apollo/client'

type Client<T extends unknown = unknown> = ApolloClient<T>

export type Observer<T> = {
  next: (value: T) => void
  error: (error: any) => void
  complete: () => void
}

export type Observable<T> = {
  subscribe(observer: Partial<Observer<T>>): { unsubscribe: () => void }
}

const createRefreshAtom = () => {
  const internalAtom = atom(0)

  return atom(
    (get) => get(internalAtom),
    (_get, set) => set(internalAtom, (c) => c + 1)
  )
}

export const createAtoms = <
  Args,
  Data,
  Source extends Observable<ApolloQueryResult<Data>>,
  Action,
  ActionResult extends Promise<void> | void = void
>(
  getArgs: (get: Getter) => Args,
  getClient: (get: Getter) => Client,
  execute: (client: Client, args: Args) => Source,
  handleAction: (
    action: Action,
    client: Client,
    refresh: () => void
  ) => ActionResult
) => {
  const refreshAtom = createRefreshAtom()

  const handleActionAtom = atom(null, (get, set, action: Action) => {
    const client = getClient(get)
    const refresh = () => set(refreshAtom)

    return handleAction(action, client, refresh)
  })

  const sourceAtom = atomWithObservable(
    (get) => {
      get(refreshAtom)
      const args = getArgs(get)
      const client = getClient(get)

      return execute(client, args)
    },
    { initialValue: null }
  )

  const statusAtom = atom(
    (get) => get(sourceAtom),
    (_get, set, action: Action) => set(handleActionAtom, action)
  )

  const dataAtom = atom(
    (get) => {
      const result = get(sourceAtom)

      if (result === null) {
        return undefined
      }

      if (result.error) {
        throw result.error
      }
      return result.data
    },
    (_get, set, action: Action) => set(handleActionAtom, action)
  )

  return [dataAtom, statusAtom] as const
}
