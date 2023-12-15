import { atom } from 'jotai'
import { ApolloClient } from '@apollo/client'

let client: ApolloClient<unknown> | null = null
let resolveClient: (client: ApolloClient<unknown>) => void
const clientPromise = new Promise<ApolloClient<unknown>>((resolve) => {
  resolveClient = resolve
})

export function initJotaiApollo(newClient: ApolloClient<unknown>) {
  if (client !== null && client !== newClient) {
    throw new Error(`Can setup jotai-apollo only once`)
  }

  client = newClient
  resolveClient(client)
}

export const clientAtom = atom(
  () => client ?? clientPromise,
  (_get, _set, client: ApolloClient<unknown>) => {
    initJotaiApollo(client)
  }
)
