# ------------ Client build ------------ #
FROM node:alpine AS client-build
WORKDIR /app/client

# Install client packages
COPY client/package*.json .
RUN npm install --production --ignore-scripts

# Build client
COPY client .
RUN npm run build

# ------------ Server build ------------ #
FROM node:alpine AS server-build
WORKDIR /app/server

# Install server packages
COPY server/package*.json .
RUN npm install --production --ignore-scripts

# Build server
COPY server .
RUN npm run build

# ------------ Client+Server ------------ #
FROM node:alpine
WORKDIR /app

# Copy builds
COPY --from=client-build /app/client/node_modules client/node_modules
COPY --from=client-build /app/client/build client

COPY --from=server-build /app/server/.env .env
COPY --from=server-build /app/server/node_modules node_modules
COPY --from=server-build /app/server/dist .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Run the application
CMD ["node", "index"]