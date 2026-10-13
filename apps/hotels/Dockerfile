FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/hotels/package.json apps/hotels/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci -w @marlow/hotels
COPY proto proto
COPY apps/hotels apps/hotels
RUN npm run build -w @marlow/hotels

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/hotels/package.json apps/hotels/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci -w @marlow/hotels --omit=dev
COPY --from=build /repo/apps/hotels/dist apps/hotels/dist
COPY apps/hotels/migrations apps/hotels/migrations
COPY apps/hotels/seed apps/hotels/seed
COPY proto proto
WORKDIR /repo/apps/hotels
USER node
EXPOSE 50051 8081
CMD ["node", "dist/index.js"]
