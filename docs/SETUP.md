> Guide to setting up your very own ILP Kit.
> Estimated time: a couple of hours.

> **NOTE**: These instructions use DigitalOcean's Node 6.9.1 image on Ubuntu in
> order to be as simple as possible. You can run ILP Kit on any other OS and
> hosting provider, but there might be a couple additional steps.

> _Don't hesitate to open issues or ask for help._

### Table of Contents
- [ILP Kit installation](#ilp-kit-setup)
  - [Get a server instance](#get-a-server-instance)
  - [Server setup](#server-setup)
  - [Postgresql setup](#postgresql-setup)
  - [ILP Kit setup](#ilp-kit-setup)
- [Domain Setup](#domain-setup)
  - [Subdomain setup](#subdomain-setup)
  - [Set up SSL](#set-up-ssl)
  - [Set up proxy for ILP Kit](#set-up-proxy-for-ilp-kit)
- [ILP Kit configuration](#ilp-kit-configuration)
  - [Register account](#register-account)
  - [Configure environment](#configure-environment)
  - [Launch ILP Kit](#launch-ilp-kit)
  - [Issue some money](#issue-some-money)
- [Enjoy](#enjoy)
- [Appendix: Advanced Options](#appendix-advanced-options)
  - [Mailgun setup](#mailgun-setup)
  - [Github setup](#github-setup)

# ILP Kit installation

## Get a server instance

### Buy server

- On [DigitalOcean](https://cloud.digitalocean.com/droplets), click `Create Droplet`.
- Select the option with 2 Gb of RAM (the $20 one).
- For the operating system, go to `One-Click Apps` and select `Node 6.9.1`.
- Select your ssh keys, and then confirm the purchase.

I've named my server instance 'Niles', so that's the name I'll be using for the
rest of the instructions.

### Set up SSH host

- Edit ~/.ssh/config
- Add the lines:

``` conf
Host niles
  Hostname 45.55.4.124 # IP from DigitalOcean
  User root
  Port 22
```

## Server setup

### Log into your server

``` sh
$ ssh niles
```

### Install necessary packages

``` sh
root$ apt-get update && apt-get upgrade
root$ apt-get install libssl-dev python build-essential libpq-dev postgresql postgresql-contrib
```

### Add a non-root user

```
# you don't want to stay logged in as root
root$ adduser sharafian
root$ usermod -aG sudo sharafian
```

Do the rest of this guide while logged in as your new user.

## Postgresql setup

In order to use postgresql, you'll need a user/password on postgres, as well as
a database named `ilpkit`. First, use `su` to become the `postgres` user, and
make a user on `postgres` with your username:

```sh
$ sudo su - postgres
postgres$ createuser sharafian
```

`psql` launches the postgres prompt, which you'll use in order to set your
password. `\q` quits the postgres prompt, returning you to the bash command
line.

``` sh
postgres$ psql
postgres=> ALTER USER sharafian WITH PASSWORD 'PASSWORD';
# outputs: ALTER USER
postgres=> \q
```

Finally, create the `ilpkit` database while logged in as the `postgres` user.

```sh
postgres$ createdb ilpkit
postgres$ exit
```

## ILP Kit setup

Perform these steps as your user, not as `postgres`. Clone `ilp-kit` and install
dependencies with the following commands:

```sh
$ cd # start in your home folder
$ git clone https://github.com/interledgerjs/ilp-kit
$ cd ilp-kit
$ npm install # this fails on the `node-gyp rebuild` step, due to a known error
$ npm rebuild node-sass # but running this will remedy any problems
$ npm run build
```

# Domain setup

## Subdomain setup

- Go to your name server provider of choice. I'm using cloudflare on my domain.
- Go to the DNS settings, and add an A record.
- I want my ilp kit on `niles.sharafian.com`, so I'll create an A record pointing `niles` to my DigitalOcean machine's IP, `45.55.4.124`

## Set up SSL

Before you get SSL enabled, you'll want to have an actual webserver running.
Because we're on Ubuntu, letsencrypt provides a package that does most of the set up for us on `nginx`.

```
$ sudo apt-get install nginx letsencrypt
```

Now follow DigitalOcean's letsencrypt instructions, 
[here](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)
in order to get SSL set up.

After following these instructions, you should go to your site (eg. `niles.sharafian.com`), and it should show the
nginx example page over an `https` connection.

## Set up proxy for ILP Kit

In your `/etc/nginx/sites-enabled/default`, remove the `location /` block, and add these two blocks in its place:

``` nginx
# point the root to the ILP Kit UI
location / {
    proxy_pass http://localhost:3010;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# allow webfinger and letsencrypt to coexist
location ~ /.well-known/webfinger {
    proxy_pass http://localhost:3010;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

- Now run `sudo nginx -t` to make sure you didn't mess anything up.
- If that ran OK, run `sudo systemctl restart nginx`.

This is all the domain setup that you have to do. Nothing will appear on the site until you're running your ILP Kit.

# ILP Kit configuration

## Register account

Before you do anything on your own ILP Kit, you're going to want to register an account on
someone else's. Go to the ILP Kit of a friend, and create an account with them. For example, I'll create the
account `niles` on `nexus.justmoon.com`. I'll refer to my password as `PASSWORD`.

This means that my identifier for my account on Nexus is `niles@nexus.justmoon.com`. We'll use that identifier later.

## Configure environment

Run `npm run configure`. It provides example values, and I'll also put the configuration I'm using.

- Posgres DB URI: `postgres://sharafian:PASSWORD@localhost/ilpkit`
- Hostname: `niles.sharafian.com`
- Ledger name: `niles`
- Currency code: `USD`
- Country code: `US`
- Configure GitHub: `n` (we don't need that just yet; you can always go back and change it)
- Configure Mailgun: `n` (same deal)
- Username: `niles`
- Password: (use the randomly generated default)

That's all you need for a functioning ILP Kit! Of course, it's not
very useful to have a ledger that's not connected to any others. That's why
we're going to create a peering relationship with another ILP Kit.

## Get a peer

In order to peer with somebody, you're going to have to know someone else who's running an ILP
kit. The process of peering involves creating a trust-line.

### What is a trust-line?

A trust-line is just a balance that tracks debt between you and another person.
It is stored and adjusted by `ilp-plugin-virtual`, which allows this balance to
function as though it were a ledger. In this way, two connectors with a
trust-line can forward payments through one another without ever holding
balance on the same ledger.

For example, if I want to send $10 to your ledger, my connector will increase
their debt to you by $10, and you will forward the payment on your own ledger
or on another trust-line. Because this balance is kept between peers rather
than a ledger, one party could simply refuse to pay off their debt.

In order to stop this from getting out of hand, each party sets a maximum
balance.  If I have a trust-line balance of $10, then the other party on the
trust-line owes me $10. Because the balance is capped, the other party cannot
borrow as much as they want, never to repay it.

### Make a trust-line

First things first, agree on an MQTT server with your peer.
[HiveMQ](http://www.hivemq.com/try-out/) and
[Mosquitto](http://test.mosquitto.org/) both offer test MQTT servers which can
be used for testing purposes. One party could also [run a broker](https://mosquitto.org/) on
their own server. On an insecure MQTT server, someone can pretend to be your
peer, and they can see all of your transactions.

Next, you'll need your public key. This public key, combined with an MQTT broker,
is how your peer is going to connect to you. To get a public key, run `npm run key`:

- [Base-64-URL](https://en.wikipedia.org/wiki/Base64#URL_applications) encoded secret:
  Enter a strong secret here, and copy it down. If you lose the secret, you'll
  need to make a new public key and give it to all of your peers.

Copy down your public key, and give it to the person you want to peer with. Make sure that you
get their public key too. Once you have their public key, run `npm run peer`:

- Name: Use the name of your peer, e.g. `Bob`, so that you can find this trust-line later.
- MQTT Broker: Use the one that you and your peer agreed on. Make sure to include the port in the `mqtt://` URL.
- Secret: Use the same secret that you used to generate your public key. If it doesn't match, then this will connect to the wrong channel.
- Public Key: This should be provided to you by your peer. It'll look like `d4TOtjlltxPH_4gZXw_R0HBjY6tbh3X-tk2N2df2zAk`.
- Currency Code: Should be agreed upon by you and your peer, so that you're assigning the same value to the balance. It doesn't have to match
  either of your ILP Kit's native currencies, but it should be something your connector knows the exchange rate for. Default is `USD`.
- Max Amount: The most that your peer can steal by defaulting on their debt to you. About $10 is a reasonable amount to start with; it can be
  adjusted later by manually editing your configuration file. It's safer to err on the low side, and then increase later.

Now your `env.list` will be modified to include this peering relationship. The trust-line is stored in the
`CONNECTOR_LEDGERS` field, where it can be modified or removed later. If you want to see all of your trust-lines, then
run `npm run list-peers`. If you want to remove one of your trust-lines, then run `npm run depeer`.

## Launch ILP Kit

You can create a `systemd` config for ILP Kit, but I'm just going to use [`nohup`](https://en.wikipedia.org/wiki/Nohup) to
run ILP Kit independent of our SSH session.

```
$ nohup npm start &
$ tail -f nohup.out -n 1000
```

Your connector will fail to launch, because this its account doesn't exist yet. Just go to your site 
(eg. `https://niles.sharafian.com`), and register a new user with the exact same username/password you
entered for your connector during `npm run configure`, (eg. user: `niles` pass: `PASSWORD`).

Run `killall -9 node`, and then launch the ilp kit again with:

```
$ nohup npm start &
$ tail -f nohup.out -n 1000
```

You'll see your connector connect successfully.

## Issue some money

So you've got a ledger all set up, with a UI and a connector to another ILP kit. But nobody on your ledger
has any money. To remedy this, you can make an issuer account.

Just go to your site and register a new account called `issuer` (that name is just a convention, it can be
whatever you want). Now open `~/ilp-kit/env.list` on your remote machine, and note down the admin username
and password. Use `httpie` on any machine to run:

```sh
curl -H 'Content-Type: application/json' -X PUT https://niles.sharafian.com/ledger/accounts/issuer --user admin:PASSWORD -d '{"minimum_allowed_balance":"-infinity","balance":"0","is_disabled":false, "id":"https://niles.sharafian.com/ledger/accounts/issuer","name":"issuer"}'
```

Replace `niles.sharafian.com` with your domain, and replace `PASSWORD` with your own admin password. Now if you log in
as `issuer`, you can send money to your primary account to have some cash.

# Enjoy

![Sherry, Niles?](http://i.imgur.com/Xh5VCvv.jpg)

# Appendix: Additional Options

## Mailgun setup

### Get a domain

To send email verification and password resets, you'll need to set up Mailgun. Fortunately, they
offer a free service that just requires you to own a domain name.

First, you'll need to make an account on [Mailgun](http://mailgun.com). Follow
their instructions to get your domain set up with their service. Once it's verified, go to
[your domains page](https://mailgun.com/app/domains), and select the domain that your
ILP Kit is using (eg. `niles.sharafian.com`). Under the "Domain Information" section, you'll
see a field labelled "API Key." Copy this key down.

### Edit `env.list`

Because you didn't configure Mailgun before, you'll have to edit your `env.list` file
(in your `ilp-kit` directory). Open the file in your [editor of choice](http://www.vim.org/).
You'll see two lines that read:

```sh
API_MAILGUN_DOMAIN=
API_MAILGUN_API_KEY=
```

Set these two fields to the domain you configured and the API key you copied down:

```sh
API_MAILGUN_DOMAIN=niles.sharafian.com
API_MAILGUN_KEY=key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Restart your ILP Kit for the changes to take effect.

Now open a new account or trigger a password reset, and you'll see an email
from your wallet. If it doesn't show up, try checking your spam folder or
asking [Mailgun support](https://help.mailgun.com/hc/en-us).

## Github setup

### Set up OAuth application

Configuring Github login with your ILP Kit makes it easier for users to register and log into your
domain. Assuming you already have a Github account, log in and go to your settings page. Go to the
"OAuth Applications" page under "Developer Settings." Click the "Register a new application" button.
Here are the settings I put:

- **Application Name** - "ILP Kit - Niles"
- **Homepage URL** - Use the root of your ILP Kit site, eg. `https://niles.sharafian.com/`
- **Application Description** is up to you.
- **Authorization callback URL** - Use this path on your domain: `https://niles.sharafian.com/api/auth/github/callback`

You'll be redirected to a new page with some information about your app. You can customize some of these options later.
For now, copy down your "Client ID" and "Client Secret" under the "0 users" header.

### Edit `env.list`

Because you didn't configure Github before, you'll have to edit your `env.list` file
(in your `ilp-kit` directory). Open the file in your [editor of choice](http://www.vim.org/).
You'll see two lines that read:

```sh
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Set these two fields to the "Client ID" and "Client Secret" that you copied down:

```sh
GITHUB_CLIENT_ID=a442XXXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=dd96XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Restart your ILP Kit for the changes to take effect.

Try registering a new account by logging in through Github. The username of the
account will match the Github username, so make sure it isn't already taken. If
you aren't able to log in, try checking [Github help](https://help.github.com/).

