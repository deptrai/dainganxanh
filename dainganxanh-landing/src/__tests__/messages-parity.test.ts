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
  const matches = text.match(/\{[a-zA-Z0-9_]+\}/g)
  return matches ? matches.sort() : []
}

describe('i18n Messages Parity & Integrity (vi vs en)', () => {
  const namespaces = ['common', 'landing', 'pricing', 'crm']
  const messagesDir = path.resolve(__dirname, '../../messages')

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

        for (const [key, val] of Object.entries(viFlat)) {
          expect(val.trim().length).toBeGreaterThan(0)
        }
        for (const [key, val] of Object.entries(enFlat)) {
          expect(val.trim().length).toBeGreaterThan(0)
        }
      })

      it('preserves matching ICU placeholders between vi and en', () => {
        const viJson = JSON.parse(fs.readFileSync(viFilePath, 'utf8'))
        const enJson = JSON.parse(fs.readFileSync(enFilePath, 'utf8'))

        const viFlat = getFlattenedKeys(viJson)
        const enFlat = getFlattenedKeys(enJson)

        for (const key of Object.keys(viFlat)) {
          const viPlaceholders = extractPlaceholders(viFlat[key])
          const enPlaceholders = extractPlaceholders(enFlat[key])
          expect(enPlaceholders).toEqual(viPlaceholders)
        }
      })
    })
  })
})
