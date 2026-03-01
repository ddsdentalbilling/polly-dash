# Build stage: install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false

# Build stage: compile Next app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy only what we need to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "run", "start"]
