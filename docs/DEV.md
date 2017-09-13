# Setup

Clone the repo
```bash
git clone git@github.com:interledgerjs/ilp-kit.git
```

Configure the environment
```bash
cd ilp-kit
npm install
npm run configure
```

Setup the ledger
```bash
cd ledger
npm install
```

Setup the api
```bash
cd ../api
npm install
```

Setup the client
```bash
cd ../client
cp public/config.example.js public/config.js
npm install
```

Edit your hosts file (`/private/etc/hosts` on OSX). Add this line.

```
127.0.0.1   wallet1.com
```

### Port forwarding (simple)

> NOTE: Current webfinger implementation will not work if the public ports 443 and 80 don't point to the development server.

```bash
cd webserver
npm run start-dev
```

### Port forwarding (Virtual hosts)

If you would like to set up two ILP Kits on the same host, it's a good idea to use nginx or apache for the virtual host handling.

In most cases it makes sense to expose the wallet through 443 (or 80) port, in which case you need to setup a port forwarding that will forward `API_PORT` requests to `API_PUBLIC_PORT` (443 or 80). Note that the port forwarding should work for both http(s) and websocket connections.

Below are the guides to setting up 2 virtual hosts for nginx and apache
- [nginx](https://github.com/interledgerjs/ilp-kit/blob/master/docs/nginx.md)
- [Apache](https://github.com/interledgerjs/ilp-kit/blob/master/docs/apache.md)

> Note: You can use self signed certificates.

# Running

There are 3 processes that need to be run. Ledger, Api and the Client.

```bash
cd ledger
npm run start
```

```bash
cd api
npm run start
```

```bash
cd client
npm run start
```

## Run the integration tests with Docker
We have a docker image which is useful for running the integration tests. The following command (when run from the
ilp-kit repo root) mounts your code into the container (in its currenct state, so changes made inside the container will be available for committing them after you exit) and lets you run the integration tests inside a container:

```sh
mv node_modules node_modules-host
docker pull michielbdejong/five-bells-integration-test # check for updates
docker run -it -v `pwd`:/app/integration-test/ilp-kit michielbdejong/five-bells-integration-test /bin/bash
```

Once you're inside the container (unless your host system also runs ubuntu), rebuild the dependencies:
```sh
$ cd integration-test/ilp-kit
$ ls
$ npm install
$ npm rebuild node-sass && npm run build # this postinstall hook is skipped when npm install is run as root
$ cd /app ; ls # /app contains https://github.com/interledgerjs/five-bells-integration-test
$ ls integration-test/ilp-kit # this is mounted from `pwd` by the `docker run` command above
$ ls integration-test/node_modules # master branch of various modules from when this Dockerfile was last built
```

Now, you can run a test suite:
```sh
$ src/bin/integration test index
```

Or run multiple:
```sh
$ killall node # in case earlier suite runs didn't stop properly
$ src/bin/integration test connector_first ilp-kit
```

Or run all integration test suites:
```sh
$ killall node # in case earlier suite runs didn't stop properly
$ src/bin/integration test
```

## Using Redux DevTools

In development, Redux Devtools are enabled by default. You can toggle visibility and move the dock around using the following keyboard shortcuts:

- <kbd>Ctrl+H</kbd> Toggle DevTools Dock
- <kbd>Ctrl+Q</kbd> Move Dock Position
- see [redux-devtools-dock-monitor](https://github.com/gaearon/redux-devtools-dock-monitor) for more detail information.

## Sentry

ILP Kit has an integration with [Sentry](https://sentry.io). so if you want to track errors all you have to do is add some environment variables to the env file.

```
API_SENTRY_DSN=https://your-sentry-dsn
API_SENTRY_ORG=your-sentry-organization
API_SENTRY_PROJECT=your-sentry-project
API_SENTRY_API_KEY=your-sentry-api-key
```

Note: API KEY can be generated [here](https://sentry.io/api/).
