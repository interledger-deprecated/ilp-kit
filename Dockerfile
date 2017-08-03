FROM node:8-slim

RUN apt-get update && apt-get install -y python postgresql libpq-dev build-essential libpq5 git

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install
# native modules need to be rebuilt for the new system
RUN npm rebuild
RUN npm run build

EXPOSE 3010

CMD [ "npm", "start" ]
