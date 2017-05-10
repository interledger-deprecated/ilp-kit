const reduct = require('reduct')
const App = require('./src/lib/app')

const app = reduct()(App)

app.start()
  .catch(err => {
    app.log.critical(err)
  })
