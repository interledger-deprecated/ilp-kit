# snap-solid

SNAP in the browser, on top of Solid

Create the following files:

```
myCA.key
myCA.pem
myCA.srl
lolcathost.de.key
lolcathost.de.csr
lolcathost.de.crt
```

by following the instructions from
https://stackoverflow.com/questions/7580508/getting-chrome-to-accept-self-signed-localhost-certificate
(domain name: lolcathost.de).

```sh
cp lolcathost.de.key server.key
cp lolcathost.de.crt server.cert
npm install
npm test
npm run build
npm start
```

Make sure you have Redis running.

Now browse to https://lolcathost.de/, create a user, and log in.
