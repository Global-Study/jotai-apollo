export type Observer<T> = {
  next: (value: T) => void
  error: (error: unknown) => void
  complete: () => void
}

export type PromiseOrValue<T> = Promise<T> | T
