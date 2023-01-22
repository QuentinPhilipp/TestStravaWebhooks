FROM node:16

# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
COPY npm-install-low-memory.sh ./

RUN ./npm-install-low-memory.sh

COPY ./src ./src

EXPOSE 8080

CMD ["npm", "start"]