# Skill: Database Type Synchronizer

**Trigger:** Whenever we execute a SQL Schema change in Supabase (e.g., adding a table or altering a column).
**Action:**
1. Run the terminal command to regenerate Supabase TypeScript types.
2. Scan the `src/` directory for any React components that might be broken by this schema change (e.g., components referencing a deleted column).
3. Warn the Lead Programmer about necessary refactoring.