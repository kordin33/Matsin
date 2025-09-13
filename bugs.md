# Identified Bugs in `Backned/src/routes.ts`

> **Context**: TypeScript compilation run via `npm run build` inside `Backned` yielded 28 errors (TS2554 / TS2339) exclusively within `src/routes.ts`. All other backend sources compiled without issues.

Below is a structured catalogue of every error, its location, root-cause analysis and suggested fix.

| # | Error Code & Message | Location *(line)* | Root Cause | Potential Fix |
|---|----------------------|-------------------|------------|---------------|
| 1 | **TS2554** — *Expected 1 arguments, but got 2* | 35, 50, 73, 96, 123, 149, 181, 200, 219, 239, 262, 286, 318, 347, 352 | The promisified helpers `dbGet`, `dbRun`, `dbAll` are inferred by TypeScript as accepting **one** argument (the SQL string) because `util.promisify()` loses the original overloads. Any additional parameter array (e.g. `[id]`) trips type-checking even though it is valid at runtime. | 1. Redefine helpers with a broad signature:  
   ```ts
   const dbGet: (...args: any[]) => Promise<any> = promisify(db.get.bind(db));
   ```  
   Same for `dbRun`, `dbAll`.  
2. Alternatively, cast on call-site: `await dbGet(sql, params as any)` — less desirable due to repetition. |
| 2 | **TS2339** — *Property 'ciphertext'/'permalink'/'token'/etc. does not exist on type '{}'* | 37, 132, 151, 152, 155, 181, 355-357 | Because `dbGet` returns `unknown` (after fix #1 it will be `any`). Accessing properties triggers errors. | 1. Introduce explicit result interfaces, e.g.  
   ```ts
   interface SceneRow { ciphertext: string; /* ... */ }
   const result = await dbGet(sql, params) as SceneRow | undefined;
   ```  
2. Quick workaround: cast to `any` when destructuring (`const result: any = await dbGet(...)`). |
| 3 | **TS2554** — argument count for `dbRun` updates | same as #1 lines 200, 219, 239, 262, 286, 318, 347, 352 | Same signature problem as #1 but for `dbRun` | Addressed by helper re-typing (see #1). |
| 4 | **TS2554** — argument count for `dbAll` queries | 239? Actually lines with `dbAll` at 239 etc. | Same issue | Resolved by helper re-typing. |

## Recommended Implementation Plan

1. **Amend `src/db.ts`**  
   Override the promisified functions with variadic `any` signature to placate TypeScript while retaining safety via targeted casting at call sites.
2. **Define row interfaces** (e.g. `SceneRow`, `PermalinkRow`, `TeacherRow`) and perform `as` assertion when reading from DB to restore type-safety.
3. Re-run `npm run build` to verify zero errors.

---

*Document generated before code modification; serves as baseline for forthcoming fixes.*