FROM node:16

# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
COPY --chmod=777 npm-install-low-memory.sh ./

RUN ./npm-install-low-memory.sh

COPY ./src ./src

CMD ["npm", "start"]