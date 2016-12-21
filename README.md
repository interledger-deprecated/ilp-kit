<h1 align="center">
  <a href="https://interledger.org"><img src="https://interledger.org/assets/ilp_logo.svg" width="150"></a>
  <br>
  ILP Kit
</h1>

<h4 align="center">
ILP wallet with hosted ledger and connector instances
</h4>

<br>

[![circle][circle-image]][circle-url]

[circle-image]: https://circleci.com/gh/interledgerjs/ilp-kit.svg?style=shield&circle-token=65d802e1ea641aabcc95f8d28f2c6ade577716a9
[circle-url]: https://circleci.com/gh/interledgerjs/ilp-kit

# Quick Start

_Prerequisites: [Git](https://git-scm.com/downloads), [Node v6.9.1](https://nodejs.org/en/download/), and dependencies for [`node-gyp`](https://github.com/nodejs/node-gyp#installation)_

```sh
$ git clone https://github.com/interledgerjs/ilp-kit
$ cd ilp-kit
$ npm install
$ npm run build
$ npm run configure
```

Use the default option for every question in the `configure` command,
and you're done! You now have a configured ILP Kit. Start it with:

```sh
npm start
```

# Connect your ILP Kit

Follow [these
instructions](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md#connecting-your-ledger)
in order to peer with another ILP Kit, and send some inter-ledger payments.

If you're looking for someone to peer with, reach out to one of the [known ILP
nodes](https://github.com/interledgerjs/ilp-kit/wiki/Known-ILP-Nodes) or the
[Interledger mailing list](https://www.w3.org/community/interledger/).

# Documentation

- [Setting up a permament ILP Kit](https://github.com/interledgerjs/ilp-kit/blob/master/docs/SETUP.md)
- [Environment variable documentation](https://github.com/interledgerjs/ilp-kit/blob/master/docs/ENV.md)
- [Development instructions](https://github.com/interledgerjs/ilp-kit/blob/master/docs/DEV.md)
