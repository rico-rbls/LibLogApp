# Skill: CCC Component Scaffold

**Trigger:** When the Lead Programmer asks to build, scaffold, or create a new UI component for Desktop or Mobile.

**Action (Strict Order):**
1. **Determine Environment:** Identify if the requested component belongs to the `desktop` workspace (Vite/React/Tailwind) or the `mobile` workspace (Expo/React Native).
2. **Execute Python Script:** Run the deterministic script to generate the boilerplate: 
   `python execution/scaffold_component.py "<ComponentName>" "<environment>"`
3. **Read Design Tokens (MANDATORY):** You must silently read `directives/branding.md` to load the official Calauan Community College (CCC) design tokens into your context window.
4. **Read Scaffolded File:** Read the newly generated `.tsx` file located at `apps/<environment>/src/components/<ComponentName>.tsx`.
5. **Inject Business Logic:** Modify the base scaffold to include the specific functionality the user requested (e.g., React Query hooks, Supabase data fetching, UI layouts).
6. **Apply Strict Branding:** Ensure that all buttons, active states, borders, and warnings strictly use the hex codes defined in `branding.md` (e.g., `#652D90`).

**Self-Annealing Constraints:**
* NEVER use generic Tailwind color names (like `purple-600` or `yellow-400`) for primary or warning actions. Always use the exact hex codes from the branding directive.
* If the component requires database interaction, ensure `useQuery` or `useMutation` is properly imported and typed based on our Supabase schema.