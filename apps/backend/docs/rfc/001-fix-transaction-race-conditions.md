# RFC 001: Fix Database Consistency Flaws (Transactions)

## 1. Summary
The current implementation of task completion (`src/services/task.service.ts` -> `complete()`) updates the `Task` status and then `UserProgress` without a database transaction. This can lead to race conditions, silent failures, and lost XP.

## 2. Motivation
If the server crashes or network connection drops between updating the `Task` table and the `UserProgress` table, the task will be marked as "COMPLETED" without awarding the corresponding XP. Furthermore, concurrent completions (e.g., clicking complete twice natively fast) can cause a read-modify-write race condition resulting in incorrectly tabulated XP levels since `updateUserProgress` reads the state into memory to calculate levels. 

## 3. Detailed Design / Proposed Changes
- Wrap the entire completion process inside a `prisma.$transaction`.
- Within the `task.service.ts` completion logic, use Prisma's atomic operations (`increment`, `decrement`) for the XP values. 
- Avoid reading the user's progress into server memory to calculate their level. Determine a way to natively update the level concurrently, or trigger level recalcs reliably.

## 4. Agent Instructions
- **Goal:** Please provide a robust counter-argument or directly refactor `complete()` and `updateUserProgress()` inside `src/services/task.service.ts` to use a transactional and atomic update pattern.
- If you refactor this, ensure all existing integration tests in `task-routes.test.ts` still pass.

## 5. Agent Response / Counter-Arguments
*(Agental response goes here)*
