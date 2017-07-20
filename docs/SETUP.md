> Guide to setting up your very own ILP Kit.
> Estimated time: a couple of hours.

> These instructions use **DigitalOcean's Node 6.9.1 image on Ubuntu**.
> You can run ILP Kit on any other OS and hosting provider, but there
> might be additional or different steps.

> Alternative instructions for setup on **Google Cloud Platform** (Not Google AppEngine) are available here:
> https://github.com/sappenin/ilpkit-google-cloud/tree/master/ilpkit-gce-single

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
  - [Configure environment](#configure-environment)
  - [Launch ILP Kit](#launch-ilp-kit)
  - [Issue some money](#issue-some-money)
- [Enjoy](#enjoy)
- [Appendix: Advanced Options](#appendix-advanced-options)
  - [Mailgun setup](#mailgun-setup)
  - [Github setup](#github-setup)
  - [Issuing Money](#issuing-money)
  - [systemd setup](#systemd-setup)

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

Make sure your postgres version is at least 9.5 by running `postgres --version`.

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
$ git checkout release # the 'master' branch is not always stable, safer to use the 'release' branch
$ npm install --production
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

In order to make sure you didn't mess anything up, run:

```sh
$ sudo nginx -t
```

If that ran OK, then restart your nginx daemon with:

```sh
$ sudo systemctl restart nginx`
```

This is all the domain setup that you have to do. Note that nothing will appear on the site until you're running your ILP Kit.

# ILP Kit configuration

## Configure environment

Start the configuration tool by running:

```sh
npm run configure
```

The CLI provides example values, but I'll also put the configuration I'm using (instead of `sharafian` and `PASSWORD`, put the postgres username/password you created previously in the [Postgresql setup](#postgresql-setup) step).

- Posgres DB URI: `postgres://sharafian:PASSWORD@localhost/ilpkit`
- Hostname: `niles.sharafian.com`
- Ledger name: `niles`
- Currency code: `USD`
- Country code: `US`
- Configure GitHub: `n` (we don't need that just yet; you can always go back and change it)
- Configure Mailgun: `n` (same deal)
- Username: `niles`
- Password: (use the randomly generated default, and note it down)

**That's all you need for a functioning ILP Kit!** To start your ILP Kit, run:

```sh
$ npm install -g pm2
$ sudo pm2 logrotate -u sharafian # configure pm2 to use log rotation
$ pm2 start pm2.config.js
$ pm2 list # you should see three apps running: ledger, api, and web.
$ pm2 logs
```

Your connector's account will be automatically created and given $1000, so you can
open up your domain and log into it.

## Connecting your ledger

Of course, it's not
very useful to have a ledger that's not connected to any others. That's why
we're going to create a peering relationship with another ILP Kit.

### Find a peer

In order to peer with somebody, you're going to have to know someone else who's running an ILP
kit. The process of peering involves creating a trust-line.

### What is a trust-line?

A trust-line is just a balance that tracks debt between you and another person.
It is stored and adjusted by
[`ilp-plugin-virtual`](https://github.com/interledgerjs/ilp-plugin-virtual),
which allows this balance to function as though it were a ledger. In this way,
two connectors with a trust-line can forward payments through one another
without ever holding balance on the same ledger.

For example, if I want to send $10 to your ledger, my connector will increase
their debt to you by $10, and you will forward the payment on your own ledger
or on another trust-line. Because this balance is kept between peers rather
than a ledger, one party could simply refuse to pay off their debt.

In order to stop this from getting out of hand, each party sets a limit. If I
have a trust-line balance of $10, then the other party on the trust-line owes
me $10. Because the balance is capped at the limit, the other party cannot
borrow as much as they want, never to repay it.

### Make a trust-line

In order to establish a trust-line, you first need somebody to peer with.
Find out your peer's hostname, and then continue following these instructions.

Log into your ILP Kit's UI as `admin` (you can find the credentials in
`env.list` under the variables `LEDGER_ADMIN_NAME` and `LEDGER_ADMIN_PASS`),
and select the `Peers` tab at the top of the page (or on `yourhostname.example/peers`)

You'll see a form on the right which has three fields in it:

- Hostname: Put your peer's ILP Kit hostname here. e.g. `nexus.justmoon.net`.
- Limit: This is how much your peer is allowed to owe you. You can set this to whatever you want.
- Currency: The currency **of the trustline**. Both parties that want to peer must enter the same thing here.

The currency doesn't have to be the same as either peer's ledger, but both
peers must enter the same currency. If I create a trustline over `USD`, and my
peer creates a trustline over `EUR`, these are two different trustlines.
Instead, we should both enter `USD` as our trustline currency, or a third asset
we both agree on.

When you add your trustline, an entry will appear in your peers list
(`yourhostname.example/peers`). The trustline's entry has a status, which is a
red circle right now. Once your peer adds a matching trustline (a trustline
with your ILP Kit as the hostname and the same currency), the status will turn
green. Now you can send payments between each other's ledgers.

## Launch ILP Kit

You can [create a systemd](#systemd-setup) config for ILP Kit, but I'm just going to use [`nohup`](https://en.wikipedia.org/wiki/Nohup) to
run ILP Kit independent of our SSH session.

Create a file called `start.sh`, and put the following lines into it:

```sh
#!/bin/bash

killall -9 node
nohup npm start &
tail -f nohup.out
```

To make this script executable, run:

```sh
$ chmod +x ./start.sh
```

Now when you want to modify or restart your ILP Kit, you can just run:

```
$ ./start.sh
# ... ILP Kit Logs
```

You'll see your connector connect successfully.

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

## Issuing Money

Your connector account starts with $1000, but what if you want more than that?
No money can be created on your ledger, but the `admin` account has a balance that can go to
`-infinity`.

Open `~/ilp-kit/env.list` on your remote machine, and note down the admin
username and password (stored in `LEDGER_ADMIN_USER` and `LEDGER_ADMIN_PASS`).
Now use these credentials to log into your ILP Kit UI. Right now, it should be
at `-1000`. Just send a payment to the account that your connector is using,
and you'll have some cash to spend.

It's inadvisable to use your admin account for anything other than issuing
funds in this way. You don't want to owe more to other accounts than you can
pay back, nor do you want people to be able to send massive payments through
your connector.

## Restarting ilp-kit after a server reboot

One easy way to make sure your ilp-kit is started again after a reboot, is
running `pm2 startup`, and then following the instructions of what you have
to run as root. So type `exit` and run the recommended command as root.
You can restart your server after this, and check that it worked.
