declare module 'argon2-browser' {
  export enum ArgonType {
    Argon2d = 0,
    Argon2i = 1,
    Argon2id = 2,
  }

  export interface HashOptions {
    pass: string
    salt: string
    type?: ArgonType
    time?: number
    mem?: number
    parallelism?: number
    hashLen?: number
  }

  export interface VerifyOptions {
    pass: string
    encoded: string
  }

  export interface HashResult {
    encoded: string
    hash: Uint8Array
  }

  export function hash(options: HashOptions): Promise<HashResult>
  export function verify(options: VerifyOptions): Promise<boolean>
  export function unloadRuntime(): void

  const _default: {
    ArgonType: typeof ArgonType
    hash: typeof hash
    verify: typeof verify
    unloadRuntime: typeof unloadRuntime
  }
  export default _default
}

declare module 'argon2-browser/dist/argon2-bundled.min.js' {
  export * from 'argon2-browser'
  import argon2 from 'argon2-browser'
  export default argon2
}
