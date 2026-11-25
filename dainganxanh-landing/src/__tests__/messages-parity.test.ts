/**
 * @jest-environment node
 */

import fs from 'fs'
import path from 'path'

function getFlattenedKeys(obj: any, prefix = ''): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, getFlattenedKeys(value, fullKey))
    } else {
      result[fullKey] = String(value)
    }
  }
  return result
}

function extractPlaceholders(text: string): string[] {
  const vars = new Set<string>()
  // Match ICU plural/select like {varName, plural, ...}
  const icuRegex = /\{([a-zA-Z0-9_]+),\s*(?:plural|select),/g
  let match: RegExpExecArray | null
  while ((match = icuRegex.exec(text)) !== null) {
    vars.add(`{${match[1]}}`)
  }
  // Strip out ICU plural blocks before matching simple placeholders
  const stripped = text.replace(/\{[a-zA-Z0-9_]+,\s*(?:plural|select),[\s\S]*?\}/g, '')
  const simpleMatches = stripped.match(/\{[a-zA-Z0-9_]+\}/g)
  if (simpleMatches) {
    simpleMatches.forEach((m) => vars.add(m))
  }
  return Array.from(vars).sort()
}

describe('i18n Messages Parity & Integrity (vi vs en)', () => {
  const messagesDir = path.resolve(__dirname, '../../messages')
  const viDir = path.join(messagesDir, 'vi')
  const namespaces = fs.existsSync(viDir)
    ? fs
        .readdirSync(viDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
    : ['common', 'landing', 'pricing', 'crm']

  namespaces.forEach((ns) => {
    describe(`Namespace: ${ns}.json`, () => {
      const viFilePath = path.join(messagesDir, 'vi', `${ns}.json`)
      const enFilePath = path.join(messagesDir, 'en', `${ns}.json`)

      it('both vi and en files exist and are valid JSON', () => {
        expect(fs.existsSync(viFilePath)).toBe(true)
        expect(fs.existsSync(enFilePath)).toBe(true)

        const viJson = JSON.parse(fs.readFileSync(viFilePath, 'utf8'))
        const enJson = JSON.parse(fs.readFileSync(enFilePath, 'utf8'))
        expect(typeof viJson).toBe('object')
        expect(typeof enJson).toBe('object')
      })

      it('maintains 100% key parity between vi and en', () => {
        const viJson = JSON.parse(fs.readFileSync(viFilePath, 'utf8'))
        const enJson = JSON.parse(fs.readFileSync(enFilePath, 'utf8'))

        const viFlat = getFlattenedKeys(viJson)
        const enFlat = getFlattenedKeys(enJson)

        const viKeys = Object.keys(viFlat).sort()
        const enKeys = Object.keys(enFlat).sort()

        expect(enKeys).toEqual(viKeys)
      })

      it('contains no empty translation strings', () => {
        const viJson = JSON.parse(fs.readFileSync(viFilePath, 'utf8'))
        const enJson = JSON.parse(fs.readFileSync(enFilePath, 'utf8'))

        const viFlat = getFlattenedKeys(viJson)
        const enFlat = getFlattenedKeys(enJson)

        for (const val of Object.values(viFlat)) {
          expect(val.trim().length).toBeGreaterThan(0)
        }
        for (const val of Object.values(enFlat)) {
          expect(val.trim().length).toBeGreaterThan(0)
        }
      })

      it('preserves matching ICU placeholders between vi and en', () => {
        const viJson = JSON.parse(fs.readFileSync(viFilePath, 'utf8'))
        const enJson = JSON.parse(fs.readFileSync(enFilePath, 'utf8'))

        const viFlat = getFlattenedKeys(viJson)
        const enFlat = getFlattenedKeys(enJson)

        for (const key of Object.keys(viFlat)) {
          // Special case: English grammatical plurals where Vietnamese has a static classifier
          if (ns === 'checkout' && key === 'quantity.unit') {
            continue
          }
          const viPlaceholders = extractPlaceholders(viFlat[key])
          const enPlaceholders = extractPlaceholders(enFlat[key])
          expect(enPlaceholders).toEqual(viPlaceholders)
        }
      })
    })
  })

  describe('Used translation keys exist in catalogs (keys-USED-exist)', () => {
    function getByPath(obj: unknown, pathStr: string): unknown {
      if (!obj || typeof obj !== 'object') return undefined
      return pathStr.split('.').reduce<unknown>((acc: unknown, part: string) => {
        if (acc && typeof acc === 'object') {
          return (acc as Record<string, unknown>)[part]
        }
        return undefined
      }, obj)
    }

    function getScopedFiles(dir: string): string[] {
      let results: string[] = []
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (['api', 'node_modules', '.next', '__tests__'].some((p) => full.includes(`/${p}`))) {
            continue
          }
          results = results.concat(getScopedFiles(full))
        } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name) && !entry.name.includes('.test.')) {
          results.push(full)
        }
      }
      return results
    }

    it('verifies all statically called translation keys in scoped source files exist in vi & en catalogs', () => {
      const srcDir = path.resolve(__dirname, '..')
      const files = getScopedFiles(srcDir)
      expect(files.length).toBeGreaterThan(0)

      const viCatalogs: Record<string, unknown> = {}
      const enCatalogs: Record<string, unknown> = {}
      for (const ns of namespaces) {
        const viPath = path.join(messagesDir, 'vi', `${ns}.json`)
        const enPath = path.join(messagesDir, 'en', `${ns}.json`)
        viCatalogs[ns] = JSON.parse(fs.readFileSync(viPath, 'utf8'))
        enCatalogs[ns] = JSON.parse(fs.readFileSync(enPath, 'utf8'))
      }

      const missingErrors: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8')
        const declRegex = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(([^)]+)\)/g
        let match: RegExpExecArray | null

        while ((match = declRegex.exec(content)) !== null) {
          const varName = match[1]
          const rawArg = match[2]
          let rawNs = ''
          const nsMatch = rawArg.match(/["']([^"']+)["']/)
          if (nsMatch) {
            rawNs = nsMatch[1]
          } else {
            const objMatch = rawArg.match(/namespace:\s*["']([^"']+)["']/)
            if (objMatch) rawNs = objMatch[1]
          }
          if (!rawNs) continue

          const startIdx = match.index
          let endIdx = content.indexOf('export default', startIdx + 1)
          if (endIdx === -1) endIdx = content.indexOf('export async function', startIdx + 1)
          if (endIdx === -1) endIdx = content.length

          const block = content.slice(startIdx, endIdx)
          const [rootNs, ...prefixParts] = rawNs.split('.')
          const prefix = prefixParts.length > 0 ? `${prefixParts.join('.')}.` : ''

          const callRegex = new RegExp(`\\b${varName}(?:\\.rich|\\.raw|\\.has)?\\(\\s*["']([a-zA-Z0-9_.]+)["']`, 'g')
          let cm: RegExpExecArray | null

          while ((cm = callRegex.exec(block)) !== null) {
            const fullKey = prefix + cm[1]
            const viVal = getByPath(viCatalogs[rootNs], fullKey)
            const enVal = getByPath(enCatalogs[rootNs], fullKey)

            if (viVal === undefined) {
              missingErrors.push(`[vi] Missing "${rootNs}.${fullKey}" called in ${path.relative(srcDir, file)}`)
            }
            if (enVal === undefined) {
              missingErrors.push(`[en] Missing "${rootNs}.${fullKey}" called in ${path.relative(srcDir, file)}`)
            }
          }
        }
      }

      expect(missingErrors).toEqual([])
    })
  })
})
