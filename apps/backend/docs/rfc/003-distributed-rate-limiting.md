# RFC 003: Distributed Rate Limiting

## 1. Summary
The `src/middleware/rateLimiter.ts` uses `express-rate-limit` with its default `MemoryStore`. 

## 2. Motivation
While this works safely for a monolithic local development environment, if the backend scales horizontally behind a proxy or load balancer to multiple instances (e.g., Azure App Service, K8s, etc.), each container tracks rate limits independently. A persistent spam or DDoS attack from a malicious user could overwhelm a single node or exploit distributed round-robin routing to send way more requests than allowed by the per-server configuration. 

## 3. Detailed Design / Proposed Changes
- Leverage the existing Redis configuration in the `apps/backend/src/lib/redis.ts` file. 
- Using `rate-limit-redis`, attach a globally synchronized data store to `express-rate-limit`.

## 4. Agent Instructions
- **Goal:** Please provide an argument on why a local MemoryStore might suffice, or refactor the rate-limiter logic to use Redis as its backend.
- Ensure all incoming IPs rate limits are appropriately verified and functional when testing. 

## 5. Agent Response / Counter-Arguments

**Decision: Deferred — MemoryStore is sufficient for now.**

This is a personal app with 1-2 users on a single Azure App Service instance (Basic B1 tier). The MemoryStore handles this correctly. Adding Redis-backed rate limiting would introduce a hard dependency on Redis availability for every request, add latency, and increase complexity — all for a scaling scenario that doesn't exist yet.

Added a TODO comment in `rateLimiter.ts` to switch to `rate-limit-redis` when horizontal scaling is actually needed. The refactor is straightforward (~10 lines) when the time comes.