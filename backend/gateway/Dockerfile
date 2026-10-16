
FROM node

WORKDIR /app

# Install backend dependencies, including ioredis
COPY package*.json ./
RUN npm install

# Install gateway dependencies, including express
COPY gateway/package*.json ./gateway/

WORKDIR /app/gateway
RUN npm install

# Copy source code
WORKDIR /app
COPY gateway ./gateway
COPY shared ./shared

WORKDIR /app/gateway

EXPOSE 8000

CMD ["npm", "start"]
