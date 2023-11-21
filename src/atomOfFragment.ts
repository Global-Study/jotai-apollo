import { loadable } from 'jotai/utils'
import { Atom, atom, Getter } from 'jotai'
import { DocumentNode, DataProxy, StoreObject } from '@apollo/client'
import { getFragmentQueryDocument } from '@apollo/client/utilities/graphql/fragments'

import { clientAtom } from './clientAtom'
import { atomWithObservable } from './atomWithObservable'
import storeVersionAtom from './storeVersionAtom'
import { Observer } from './types'

type WatchFragmentArgs<Data = any> = {
  fragment: DocumentNode
  fragmentName: string
  from: Partial<Data> | string | undefined
  optimistic: boolean
}

const DefaultDiffResult: DataProxy.DiffResult<unknown> = {
  result: undefined,
}

const fragmentToQueryDocMemo = new Map<DocumentNode, DocumentNode>()
function getQueryDocForFragment(
  fragmentDoc: DocumentNode,
  fragmentName: string
) {
  let queryDoc = fragmentToQueryDocMemo.get(fragmentDoc)

  if (!queryDoc) {
    queryDoc = getFragmentQueryDocument(fragmentDoc, fragmentName)
    fragmentToQueryDocMemo.set(fragmentDoc, queryDoc)
  }

  return queryDoc
}

export const atomOfFragment = <Data extends StoreObject>(
  getArgs: (get: Getter) => WatchFragmentArgs<Data>
): Atom<DataProxy.DiffResult<Data>> => {
  const loadableClientAtom = loadable(clientAtom)

  const wrapperAtom = atom((get) => {
    const loadableClient = get(loadableClientAtom)

    if (loadableClient.state !== 'hasData') {
      return null
    }

    const client = loadableClient.data

    const sourceAtom = atomWithObservable(
      (get) => {
        const { fragment, fragmentName, from, optimistic } = getArgs(get)

        // Resetting on store-version change
        get(storeVersionAtom(client))

        const id =
          typeof from === 'string' || !from ? from : client.cache.identify(from)

        return {
          subscribe(observer: Observer<DataProxy.DiffResult<Data>>) {
            const unsubscribe = client.cache.watch<Data>({
              query: getQueryDocForFragment(fragment, fragmentName),
              id,
              callback: () => {
                const latestData = client.readFragment<Data>(
                  {
                    fragment,
                    fragmentName,
                    id,
                  },
                  optimistic
                )

                if (latestData) {
                  observer.next({ complete: true, result: latestData })
                } else {
                  observer.next({ complete: false })
                }
              },
              optimistic,
              returnPartialData: true,
              immediate: true,
            })

            return {
              unsubscribe,
            }
          },
        }
      },
      { initialValue: DefaultDiffResult as DataProxy.DiffResult<Data> }
    )

    return sourceAtom
  })

  return atom((get) => {
    const sourceAtom = get(wrapperAtom)

    if (sourceAtom) {
      return get(sourceAtom)
    }

    return DefaultDiffResult as DataProxy.DiffResult<Data>
  })
}
