FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app

FROM base AS pruner
RUN npm install --global turbo@2.10.12
COPY . .
RUN turbo prune api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# Prisma 7 prisma.config.ts requires DATABASE_URL even for `generate`.
# This value is installer-only (runner starts FROM base) and is never used
# to connect; production DATABASE_URL is injected at container start.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN pnpm --filter api prisma:generate
# @workspace/types exports dist/ only; .dockerignore excludes **/dist, so
# compile the workspace package before Nest typechecks those imports.
RUN pnpm --filter @workspace/types build
RUN pnpm --filter api build
# Include prisma CLI so migrate deploy works at container start.
# pnpm 10+ requires --legacy unless inject-workspace-packages is enabled.
# Skip Prisma's install-time generate: deploy copies the schema after
# postinstall, which otherwise emits a client with no enums/models.
RUN PRISMA_SKIP_POSTINSTALL_GENERATE=1 pnpm --filter api deploy --legacy /out
RUN cd /out && npx prisma generate --schema=prisma/schema.prisma

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG API_BUILD_ID=unknown
ENV API_BUILD_ID=$API_BUILD_ID
# Chromium + Devanagari fonts for Property Tax Demand Notice PDF (Playwright).
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      font-noto
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=installer --chown=nestjs:nodejs /out .
COPY --chown=nestjs:nodejs apps/portal/public/branding/up-government-logo.png /app/assets/up-government-logo.png
ENV DEMAND_NOTICE_LOGO_PATH=/app/assets/up-government-logo.png
# Alpine chromium package may install as chromium or chromium-browser.
RUN if [ -x /usr/bin/chromium-browser ] && [ ! -x /usr/bin/chromium ]; then \
      ln -sf /usr/bin/chromium-browser /usr/bin/chromium; \
      fi
RUN mkdir -p /app/uploads && chown nestjs:nodejs /app/uploads
USER nestjs
EXPOSE 4000
# Same DATABASE_URL for migrate, seed, and the API process.
CMD ["sh", "-c", "echo 'Validating environment...' && node dist/startup-env-cli.js && echo 'Running database migrations...' && npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/seed-cli.js && node dist/main.js"]
