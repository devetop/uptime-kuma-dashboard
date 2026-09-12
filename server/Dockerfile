# =============================================================================
# Backend Dockerfile — Express 5 + TypeScript (ESM, NodeNext)
# Multi-stage: node:22-alpine (build) -> node:22-alpine (runtime).
#
# BUILD CONTEXT = repository root (the server tsconfig references
# ../shared).
#   docker build -f server/Dockerfile .
# =============================================================================

# ---------------------------------------------------------------- build stage
FROM node:22-alpine AS build

ENV NODE_ENV=production

WORKDIR /app/server

# 1) Dependency manifests first for optimal layer caching.
#    Install ALL dependencies (dev + prod) because typescript is a build tool.
#    We explicitly prune below in the runtime stage.
COPY server/package.json server/package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

# 2) Sources + shared types.
#    server/tsconfig.build.json uses rootDir "../" and includes
#    ["src/**/*.ts", "../shared/index.ts"], so the compiled output keeps the
#    /app/server/dist/server/src/ layout. `shared/` must therefore be a
#    sibling of `server/`, exactly as it is in the repo.
COPY shared/ /app/shared/
COPY server/tsconfig.json server/tsconfig.build.json ./
COPY server/src ./src

# 3) Compile TypeScript -> /app/server/dist/server/src/*.js
RUN npm run build

# ------------------------------------------------------------- runtime stage
FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app/server

# 1) Production dependencies only (no typescript, tsx, @types/*).
#    Manifests are copied first so `npm ci` has its lockfile, then caches are
#    purged in the SAME layer (separate RUN would leave them in history).
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /root/.npm /tmp/*

# 2) Compiled output from the build stage.
#    --chown avoids a separate `chown -R` RUN layer, which on overlayfs
#    duplicates every file and inflates the image by several MB.
#    Keep the /app/server/dist/server/src/... layout produced by
#    tsconfig.build.json (rootDir: "../").
COPY --from=build --chown=101:101 /app/server/dist ./dist

# 3) Non-root runtime (uid/gid 101, consistent across both images).
USER 101:101

# PORT is configurable via env (defaults to 4242 in server/src/index.ts).
EXPOSE 4242

# Health endpoint served by the Express app (see server/src/lib/app.ts).
# busybox wget is available in node:22-alpine — no extra packages installed.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT:-4242}/api/health" >/dev/null 2>&1 || exit 1

# Match server/package.json start script (node dist/index.js) reduced to the
# container-appropriate form: config is injected by docker-compose, and the
# compiled entry point lives at dist/server/src/.
CMD ["node", "dist/server/src/index.js"]