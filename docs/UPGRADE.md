# Upgrading your ilp-kit

Assuming you run ilp-kit through pm2, first take it offline:
```sh
pm2 stop server
pm2 stop api
pm2 stop ledger
```

Update your node version if needed (check `engines` in package.json), for instance:
```sh
nvm install 7.7.1
pm2 delete api && pm2 reload pm2.config.js --only api && pm2 stop api
```

Now update the code:
```sh
rm -rf node_modules
npm install
npm run build
```

And start it back up:
```sh
pm2 start ledger
pm2 start api
pm2 start server
```



To check that the server is running again, open `https://<your-ilp-kit.com>/api/health`
with your browser, and check that it says 'OK'.

If it doesn't, try running `pm2 restart api`.
