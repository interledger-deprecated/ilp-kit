import superagent from 'superagent'

const methods = ['get', 'post', 'put', 'patch', 'del']

function formatUrl (path) {
  // Used for non api calls (ex. ledger transfer json retrieval)
  if (path.startsWith('http')) return path

  const adjustedPath = path[0] !== '/' ? '/' + path : path

  // Prepend `/api` to relative URL, to proxy to API server.
  return '/api' + adjustedPath
}

export default class ApiClient {
  constructor (req) {
    methods.forEach(method => {
      this[method] = (path, { params, data } = {}) => new Promise((resolve, reject) => {
        const request = superagent[method](formatUrl(path))

        if (params) {
          request.query(params)
        }

        if (data) {
          request.send(data)
        }

        request.end((err, { body } = {}) => err ? reject(body || err) : resolve(body))
      })
    })
  }
}
