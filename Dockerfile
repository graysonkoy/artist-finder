# ------------ Client build ------------ #
FROM node:erbium AS client-build
WORKDIR /app/client

# Install client packages
COPY client/package*.json ./
RUN npm install --production --ignore-scripts

# Build client
COPY client ./
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ------------ Server build ------------ #
FROM node:erbium AS server-build
WORKDIR /app/server

# Install server packages
COPY server/package*.json ./
RUN npm install --production --ignore-scripts

# Build server
COPY server ./
RUN npm run build

# ------------ Client+Server ------------ #
FROM node:erbium
WORKDIR /app

# Copy builds
COPY --from=client-build /app/client/node_modules client/node_modules
COPY --from=client-build /app/client/build client

COPY --from=server-build /app/server/node_modules node_modules
COPY --from=server-build /app/server/dist ./

COPY .env .env

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Run the application
CMD ["node", "index"]