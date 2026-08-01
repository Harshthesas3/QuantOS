import argon2 from 'argon2-browser/dist/argon2-bundled.min.js'

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