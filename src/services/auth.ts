import argon2 from 'argon2-browser'
import argon2WasmUrl from 'argon2-browser/dist/argon2.wasm?url'

declare global {
  interface Window {
    loadArgon2WasmBinary?: () => Promise<Uint8Array>
  }
}

// argon2-browser's wasm loader falls into a Vite-pre-bundled code path that
// calls atob() on a module object instead of a base64 string, which throws
// "Failed to execute 'atob' on 'Window'". The library checks
// `global.loadArgon2WasmBinary` first, so provide the real wasm binary from
// the bundled asset instead (same pattern used for sql.js).
if (typeof window !== 'undefined' && !window.loadArgon2WasmBinary) {
  window.loadArgon2WasmBinary = async () => {
    const response = await fetch(argon2WasmUrl)
    return new Uint8Array(await response.arrayBuffer())
  }
}

const MEMORY_COST = 19456
const TIME_COST = 2
const PARALLELISM = 1

function randomSaltHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  let out = ''
  for (let i = 0; i < bytes; i++) out += arr[i].toString(16).padStart(2, '0')
  return out
}

export async function hashPassword(password: string): Promise<string> {
  const saltHex = randomSaltHex(16)
  const result = await argon2.hash({
    pass: password,
    salt: saltHex,
    type: argon2.ArgonType.Argon2id,
    time: TIME_COST,
    mem: MEMORY_COST,
    parallelism: PARALLELISM,
  })
  return result.encoded
}

export async function verifyPassword(
  encoded: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify({ pass: password, encoded })
  } catch {
    return false
  }
}