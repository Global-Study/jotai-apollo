import { atomFamily } from 'jotai/utils'
import { ApolloClient } from '@apollo/client'

import { atomWithObservable } from './atomWithObservable'
import type { Observer } from './types'

/**
 * Gets incremented when the Apollo client clears the store.
 */
const storeVersionAtom = atomFamily((client: ApolloClient<unknown>) => {
  return atomWithObservable(
    () => {
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
})

export default storeVersionAtom
