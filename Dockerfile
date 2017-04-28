FROM node:7-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

# native modules need to be rebuilt for the new system
RUN apt-get update && apt-get install -y python postgresql libpq-dev build-essential
RUN npm rebuild

EXPOSE 3010

CMD [ "npm", "start" ]
