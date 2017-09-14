FROM node:8-slim

RUN apt-get update && apt-get install -y python postgresql libpq-dev build-essential libpq5 git

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install
RUN cd api && npm install
RUN cd ledger && npm install
RUN cd client && npm install && npm run build

EXPOSE 3010

CMD npm start
