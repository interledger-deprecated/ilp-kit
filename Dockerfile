FROM node:8-slim

RUN apt-get update && apt-get install -y python postgresql libpq-dev build-essential libpq5 git vim

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install
RUN cd api && npm install
RUN cd ledger && npm install
RUN cd client && npm install && npm run build
RUN cd webserver && npm install

ENV NODE_ENV production
EXPOSE 80
EXPOSE 3100
EXPOSE 3101

CMD echo "var config = { apiUrl: 'https://$API_HOSTNAME/api' }" > /usr/src/app/client/build/config.js && npm start
