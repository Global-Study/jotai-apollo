import { Atom, Getter, WritableAtom, atom } from 'jotai'

type AnyError = unknown

declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}

type Subscription = {
  unsubscribe: () => void
}

type Observer<T> = {
  next: (value: T) => void
  error: (error: AnyError) => void
  complete: () => void
}

type ObservableLike<T> = {
  [Symbol.observable]?: () => ObservableLike<T> | undefined
} & (
  | {
      subscribe(observer: Observer<T>): Subscription
    }
  | {
      subscribe(observer: Partial<Observer<T>>): Subscription
    }
  | {
      subscribe(observer: Partial<Observer<T>>): Subscription
      // Overload function to make typing happy
      subscribe(next: (value: T) => void): Subscription
    }
)

type SubjectLike<T> = ObservableLike<T> & Observer<T>

type Options<Data> = {
  initialValue?: Data | (() => Data)
}

type OptionsWithInitialValue<Data> = {
  initialValue: Data | (() => Data)
}

type LOADING = typeof LOADING
const LOADING = Symbol('atomWithObservable is in loading state')

export function atomWithObservable<Data>(
  getObservable: (get: Getter) => SubjectLike<Data>,
  options: OptionsWithInitialValue<Data>
): WritableAtom<Data, [Data], void>

export function atomWithObservable<Data>(
  getObservable: (get: Getter) => SubjectLike<Data>,
  options?: Options<Data>
): WritableAtom<Data | Promise<Data>, [Data], void>

export function atomWithObservable<Data>(
  getObservable: (get: Getter) => ObservableLike<Data>,
  options: OptionsWithInitialValue<Data>
): Atom<Data>

export function atomWithObservable<Data>(
  getObservable: (get: Getter) => ObservableLike<Data>,
  options?: Options<Data>
): Atom<Data | Promise<Data>>

export function atomWithObservable<Data>(
  getObservable: (get: Getter) => ObservableLike<Data> | SubjectLike<Data>,
  options?: Options<Data>
) {
  type Result = { d: Data } | { e: AnyError }
  const returnResultData = (result: Result) => {
    if ('e' in result) {
      throw result.e
    }
    return result.d
  }

  const observableResultAtom = atom((get) => {
    let observable = getObservable(get)
    const itself = observable[Symbol.observable]?.()
    if (itself) {
      observable = itself
    }

    const STATE: {
      pending: Promise<Result> | undefined
      resolve: ((result: Result) => void) | undefined
      subscription: Subscription | undefined
      syncResult: Result | LOADING
      updateResult: ((res: Result) => void) | undefined
    } = {
      pending: undefined,
      resolve: undefined,
      subscription: undefined,
      syncResult: LOADING,
      updateResult: undefined,
    }

    const initialResult: Result | LOADING =
      options && 'initialValue' in options
        ? {
            d:
              typeof options.initialValue === 'function'
                ? (options.initialValue as () => Data)()
                : (options.initialValue as Data),
          }
        : LOADING

    const latestAtom = atom<Result | LOADING>(initialResult)

    const resultAtom = atom<Result | Promise<Result>, [Result], void>(
      (get, { setSelf }) => {
        // Both getting the data, and depending on it, since we exit early in sync mode.
        // TLDR, order matters
        const latestData = get(latestAtom)

        const updateResult = (res: Result) => {
          if (!STATE.pending) {
            // In case the subscription sets its value immediately.
            // We want to avoid calling `setSelf` synchronously.
            STATE.syncResult = res
            setTimeout(() => setSelf(res), 0)
          } else {
            setSelf(res)
          }
        }

        if (!STATE.pending) {
          STATE.pending = new Promise((resolve: (result: Result) => void) => {
            STATE.resolve = resolve

            STATE.subscription = observable.subscribe({
              next: (d) => updateResult({ d }),
              error: (e) => updateResult({ e }),
              complete: () => {},
            })
          })
        }

        if (STATE.syncResult !== LOADING) {
          return STATE.syncResult
        }

        if (latestData !== LOADING) {
          return latestData
        }

        return STATE.pending
      },
      (_get, set, result) => {
        if (STATE.resolve === undefined) {
          console.warn(
            `atomWithObservable is in an invalid state, 'resolve' is undefined`
          )
          return
        }

        STATE.syncResult = LOADING // resetting the sync result
        STATE.resolve(result)
        set(latestAtom, result)
      }
    )

    return [resultAtom, observable] as const
  })

  const observableAtom = atom(
    (get) => {
      const [resultAtom] = get(observableResultAtom)
      const result = get(resultAtom)
      if (result instanceof Promise) {
        return result.then(returnResultData)
      }
      return returnResultData(result)
    },
    (get, _set, data: Data) => {
      const [_resultAtom, observable] = get(observableResultAtom)

      if ('next' in observable) {
        observable.next(data)
      } else {
        throw new Error('observable is not subject')
      }
    }
  )

  return observableAtom
}
