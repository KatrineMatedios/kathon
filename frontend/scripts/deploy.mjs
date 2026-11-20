import { cp, readdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const publicDir = resolve(root, '..', 'backend', 'public')

await rm(resolve(publicDir, 'assets'), { recursive: true, force: true })

for (const entry of await readdir(dist)) {
  await cp(resolve(dist, entry), resolve(publicDir, entry), { recursive: true, force: true })
}

console.log(`Deployed ${dist} to ${publicDir}`)
