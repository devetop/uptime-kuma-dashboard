# =============================================================================
# Frontend Dockerfile — Vite 6 + React 19 SPA
# Multi-stage: node:22-alpine (build) -> nginx:alpine (runtime)
#
# Build context is the repository root so the Vite build can resolve the
# `@shared` alias to ../shared (see frontend/vite.config.ts and
# frontend/tsconfig.app.json -> include: ["src", "../shared"]).
#   docker build -f frontend/Dockerfile .
# =============================================================================

# ---------------------------------------------------------------- build stage
FROM node:22-alpine AS build

WORKDIR /app/frontend

# 1) Dependency manifests first -> maximal layer cache reuse.
COPY frontend/package.json frontend/package-lock.json ./

# `npm ci` = clean, lockfile-exact, reproducible install.
# devDependencies ARE required here (vite + typescript are build tools).
# --no-audit/--no-fund keep the install fast and the output quiet.
RUN npm ci --no-audit --no-fund

# 2) Shared type module (build-time only; type-only imports are erased by tsc).
COPY shared/ /app/shared/

# 3) Application sources.
COPY frontend/ ./

# 4) Produce the static bundle in /app/frontend/dist
#    (script: tsc -p tsconfig.app.json && vite build)
RUN npm run build

# ------------------------------------------------------------- runtime stage
FROM nginx:alpine AS runtime

# The default server block and its config must be removed before we switch to
# the non-root user, because those files are owned by root in the stock image.
COPY frontend/nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf

# Run as a non-root user (least privilege). The nginx:alpine image ships with
# uid/gid 101 reserved for the unprivileged nginx user.
USER 101:101

# Static assets copied straight from the build stage -> nothing from the Node
# toolchain (node_modules, sources, shared/) lands in the final image.
COPY --from=build --chown=101:101 /app/frontend/dist/ /usr/share/nginx/html/

EXPOSE 80

# busybox wget ships with alpine, so no extra packages are installed.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
