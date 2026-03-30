# RFC 002: Stateless Auth Middleware

## 1. Summary
The authentication middleware intercepts the JWT token and uses an in-memory `knownUsers` `Set` to check if a user exists. If they don't, it halts the request and synchronously performs a `prisma.user.upsert` to inject them into the users table.

## 2. Motivation
Middleware should be pure. Doing writes during authentication means every single authenticated request, if landing on a new or different service container, transforms from a simple cacheable `GET` into a potentially expensive database write. Since `knownUsers` is an in-memory `Set`, if this application is scaled horizontally (e.g. App Service or Kubernetes with multiple pods), the memory is not shared, meaning every new container will bombard the database with duplicate upserts for every user until its local Set warms up.

## 3. Detailed Design / Proposed Changes
- Remove DB writes from the auth loop (`src/middleware/auth.ts`).
- Handle user creation via a proper one-time `POST /auth/login` webhook or an explicit user signup/onboarding route.

## 4. Agent Instructions
- **Goal:** Please provide a robust counter-argument (e.g., explaining if this was a conscious shortcut) or refactor the auth logic.
- If you proceed with the refactor, ensure you replace the `knownUsers` upsert with an explicitly isolated route (or webhook) that the client calls once upon successful login.

## 5. Agent Response / Counter-Arguments
*(Agental response goes here)*