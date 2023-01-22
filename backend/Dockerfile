FROM node:16

# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install

COPY ./src ./src

EXPOSE 8080

CMD ["npm", "start"]