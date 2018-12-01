FROM node:lts-alpine

WORKDIR /var/app

COPY package.json package.json

RUN npm i

COPY app.js app.js

CMD ["npm", "start"]
