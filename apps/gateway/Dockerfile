FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/hotels/package.json apps/hotels/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci -w @marlow/gateway
COPY proto proto
COPY apps/gateway apps/gateway
RUN npm run build -w @marlow/gateway

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/hotels/package.json apps/hotels/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci -w @marlow/gateway --omit=dev
COPY --from=build /repo/apps/gateway/dist apps/gateway/dist
COPY proto proto
WORKDIR /repo/apps/gateway
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
