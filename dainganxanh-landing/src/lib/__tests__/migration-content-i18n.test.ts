import fs from 'fs'
import path from 'path'

describe('Migration 20261010000000_content_i18n.sql', () => {
    const rootMigrationPath = path.resolve(__dirname, '../../../../supabase/migrations/20261010000000_content_i18n.sql')
    const landingMigrationPath = path.resolve(__dirname, '../../../supabase/migrations/20261010000000_content_i18n.sql')

    it('exists in both root and dainganxanh-landing dirs and contents are identical', () => {
        expect(fs.existsSync(rootMigrationPath)).toBe(true)
        expect(fs.existsSync(landingMigrationPath)).toBe(true)

        const rootSql = fs.readFileSync(rootMigrationPath, 'utf8')
        const landingSql = fs.readFileSync(landingMigrationPath, 'utf8')
        expect(rootSql).toBe(landingSql)
    })

    it('contains CHECK constraint on post_translations.locale restricted to vi and en', () => {
        const sql = fs.readFileSync(rootMigrationPath, 'utf8')
        expect(sql).toMatch(/CHECK\s*\(\s*locale\s+IN\s*\(\s*'vi'\s*,\s*'en'\s*\)\s*\)/i)
    })

    it('contains idempotent translations.vi backfill using jsonb_build_object for all 6 tables', () => {
        const sql = fs.readFileSync(rootMigrationPath, 'utf8')
        expect(sql).toContain("jsonb_build_object('vi'")

        // Verify all 6 content tables have vi backfill
        const expectedTables = [
            'products',
            'product_categories',
            'rooms',
            'lots',
            'notifications',
            'email_templates',
        ]

        for (const table of expectedTables) {
            expect(sql).toContain(`UPDATE ${table}`)
        }
    })

    it('uses IF NOT EXISTS guards for ALTER TABLE, CREATE TABLE, and CREATE INDEX', () => {
        const sql = fs.readFileSync(rootMigrationPath, 'utf8')
        expect(sql).toContain('ALTER TABLE products ADD COLUMN IF NOT EXISTS translations')
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS post_translations')
        expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_products_translations')
    })

    it('uses correct role names (admin, super_admin) in RLS policies and spec-compliant seed category names', () => {
        const sql = fs.readFileSync(rootMigrationPath, 'utf8')
        expect(sql).toContain("users.role IN ('admin', 'super_admin')")
        expect(sql).not.toContain("'superadmin'")
        expect(sql).not.toContain("'editor'")
        expect(sql).not.toContain("'author'")

        expect(sql).toContain("'Agarwood Perfume'")
        expect(sql).toContain("'Agarwood Essential Oil'")
        expect(sql).toContain("'Incense & Agarwood Sticks'")
        expect(sql).toContain("'Handicrafts'")
    })
})
