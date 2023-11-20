import { createStore } from 'jotai'
import { describe, expect, it } from '@jest/globals'
import { Subject } from 'rxjs'

import { Observer } from './types'
import { atomWithObservable } from './atomWithObservable'

describe('atomWithObservable', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('returns initial value', async () => {
    const anAtom = atomWithObservable(
      () => {
        return {
          subscribe(observer: Observer<number>) {
            return {
              unsubscribe: () => {},
            }
          },
        }
      },
      { initialValue: 123 }
    )

    expect(store.get(anAtom)).toBe(123)
  })

  it('returns latest synchronous value', async () => {
    const anAtom = atomWithObservable(
      () => {
        return {
          subscribe(observer: Observer<number>) {
            observer.next(456)

            return {
              unsubscribe: () => {},
            }
          },
        }
      },
      { initialValue: 123 }
    )

    expect(store.get(anAtom)).toBe(456)
  })

  it('updates value', async () => {
    const $: {
      setValue: ((value: number) => void) | undefined
    } = {
      setValue: undefined,
    }

    const anAtom = atomWithObservable(
      (get) => {
        return {
          subscribe(observer: Observer<number>) {
            $.setValue = (value: number) => {
              observer.next(value)
            }

            return {
              unsubscribe: () => {},
            }
          },
        }
      },
      { initialValue: 0 }
    )

    expect(store.get(anAtom)).toBe(0)
    $.setValue?.(1)
    expect(store.get(anAtom)).toBe(1)
    $.setValue?.(2)
    expect(store.get(anAtom)).toBe(2)
  })

  it('updates value when mounted', (done) => {
    const $: {
      setValue: ((value: number) => void) | undefined
      expectedValue: number
    } = {
      setValue: undefined,
      expectedValue: 0,
    }

    const anAtom = atomWithObservable(
      (get) => {
        return {
          subscribe(observer: Observer<number>) {
            $.setValue = (value: number) => {
              observer.next(value)
            }

            return {
              unsubscribe: () => {},
            }
          },
        }
      },
      { initialValue: 0 }
    )

    store.sub(anAtom, () => {
      const value = store.get(anAtom)

      expect(value).toBe($.expectedValue)

      if (value === 100) {
        done()
      }
    })

    setTimeout(() => {
      $.expectedValue = 1
      $.setValue?.(1)

      setTimeout(() => {
        $.expectedValue = 2
        $.setValue?.(2)

        setTimeout(() => {
          $.expectedValue = 100
          $.setValue?.(100)
        }, 200)
      }, 200)
    }, 200)
  })

  it('works well after unsub', () => {
    const subject = new Subject<number>()

    const anAtom = atomWithObservable(() => subject, { initialValue: 0 })

    expect(store.get(anAtom)).toBe(0)
    subject.next(1)
    expect(store.get(anAtom)).toBe(1)
  })
})
