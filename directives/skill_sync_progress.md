# Skill: Progress & Overview Synchronizer

**Trigger:** When the Lead Programmer says "Run the Git Loop", "Sync progress", or finishes a major feature.

**Execution Steps (Strict Order):**
1. **The Blueprint Update:** Open `overview.md` using your native file-editing tools. Silently update the "Implementation Status", "Database Schema", and "Routing" sections so they perfectly match the codebase's current reality.
2. **The Summary:** Draft a concise, 1-sentence `commit_msg` (e.g., "feat(circulation): implement penalty calculation logic").
3. **The Audit Trail:** Draft a 1-2 sentence `worklog_entry` detailing exactly what technical debt was cleared or what feature was added.
4. **The Execution:** Run the command: `python execution/sync_progress.py "<commit_msg>" "<worklog_entry>"`

**Self-Annealing Constraints:** * NEVER run the sync script if there are active TypeScript (`implicit any`), ESLint, or compilation errors in the codebase. 
* Ensure `overview.md` is successfully saved before triggering the Python script.