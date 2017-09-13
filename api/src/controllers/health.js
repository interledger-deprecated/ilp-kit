'use strict'

module.exports = HealthControllerFactory

function HealthControllerFactory () {
  return class HealthController {
    static init (router) {
      router.get('/health', this.health)
    }

    /**
     * @api {get} /health Health check
     * @apiName health
     * @apiGroup Misc
     * @apiVersion 1.0.0
     *
     * @apiDescription Health check
     *
     * @apiExample {shell} Health check
     *    curl -X GET
     *    https://wallet.example/health
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     */
    static health (ctx) {
      console.log('health hit')
      // TODO: Add some checks, e.g. database status
      ctx.status = 200
    }
  }
}
