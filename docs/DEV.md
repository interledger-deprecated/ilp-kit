# Development Setup

```bash
git clone git@github.com:interledgerjs/ilp-kit.git
cd ilp-kit
npm install
```

To run the ILP kit you will need to specify all of the required environment variables. `ilp-kit-cli` simplifies this by guiding you through the environment variables and creates an `env.list` which will be run automatically by the kit.

```bash
npm run configure
```

Build the vendor files (run this every time package dependencies change)
```bash
npm run build-dlls
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

## Run a development server without Docker

Note: development server assumes you have `bunyan` installed globally.

```bash
npm run dev
```

### Hosts file

Edit your hosts file (`/private/etc/hosts` on OSX). Add these two lines

```
127.0.0.1   wallet1.com
127.0.0.1   wallet2.com
```

### Port forwarding (simple)

> NOTE: Current webfinger implementation will not work if the public ports 443 and 80 don't point to the development server.

``` sh
npm run dev-with-proxy
```

### Port forwarding (two ILP Kits)

If you would like to set up two ILP Kits on the same host, it's a good idea to use Apache for the virtual host handling.

> NOTE: This is an apache server config for developers. If you want to setup a production environment check out [this guide](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md).

In most cases it makes sense to expose the wallet through 443 (or 80) port, in which case you need to setup a port forwarding that will forward `API_PORT` requests to `API_PUBLIC_PORT` (443 or 80). Note that the port forwarding should work for both http(s) and websocket connections.

Here's an example of an Apache 2.4 virtual host with enabled port forwarding.

Make sure the following modules are enabled for all of these examples:

```
LoadModule xml2enc_module libexec/apache2/mod_xml2enc.so
LoadModule proxy_html_module libexec/apache2/mod_proxy_html.so
LoadModule proxy_module libexec/apache2/mod_proxy.so
LoadModule proxy_connect_module libexec/apache2/mod_proxy_connect.so
LoadModule proxy_http_module libexec/apache2/mod_proxy_http.so
LoadModule proxy_wstunnel_module libexec/apache2/mod_proxy_wstunnel.so
LoadModule proxy_ajp_module libexec/apache2/mod_proxy_ajp.so
LoadModule proxy_balancer_module libexec/apache2/mod_proxy_balancer.so
LoadModule ssl_module libexec/apache2/mod_ssl.so
LoadModule rewrite_module libexec/apache2/mod_rewrite.so
```

Make sure Apache is listening on port 80 and 443:
```
Listen 80
Listen 443
```

```
<VirtualHost *:443>
  ServerName wallet.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet.com:3000/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  ProxyPass / http://wallet.com:3000/ retry=0
  ProxyPassReverse / http://wallet.com:3000/

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet.com.key
</VirtualHost>
```

### Apache Virtual Hosts

> Note: The wallet instances are running on port 80, but we also need to setup virtual hosts on port 443 for the webfinger lookups (issue mentioned above).

```
<VirtualHost *:80>
  ServerName wallet1.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet1.com:3010/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  ProxyPass / http://wallet1.com:3010/ retry=0
  ProxyPassReverse / http://wallet1.com:3010/
</VirtualHost>

<VirtualHost *:443>
  ServerName wallet1.com
  ProxyPass / http://wallet1.com:3010/ retry=0
  ProxyPassReverse / http://wallet1.com:3010/
  RedirectMatch ^/$ https://wallet1.com

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet1.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet1.com.key
</VirtualHost>

<VirtualHost *:80>
  ServerName wallet2.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet2.com:3020/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  ProxyPass / http://wallet2.com:3020/ retry=0
  ProxyPassReverse / http://wallet2.com:3020/
</VirtualHost>

<VirtualHost *:443>
  ServerName wallet2.com
  ProxyPass / http://wallet2.com:3020/ retry=0
  ProxyPassReverse / http://wallet2.com:3020/
  RedirectMatch ^/$ https://wallet2.com

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet2.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet2.com.key
</VirtualHost>
```

> Note: You can use self signed certificates.

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

## Note

It seems you may need to run:
```
psql ilpkit -f node_modules/five-bells-ledger/src/sql/pg/1-2.sql
```
but that's unconfirmed
