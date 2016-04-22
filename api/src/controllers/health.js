'use strict'

module.exports = HealthControllerFactory

HealthControllerFactory.constitute = []
function HealthControllerFactory () {
  return class HealthController {
    static init (router) {
      router.get('/health', this.health)
    }

    /**
     * @api {get} /health Health check
     * @apiName health
     * @apiGroup Health
     * @apiVersion 1.0.0
     *
     * @apiDescription Health check
     *
     * @apiExample {shell} Health check
     *    curl -x GET
     *    http://wallet.example/health
     *
     * @apiSuccessExample {json} 200 Response:
     *    HTTP/1.1 200 OK
     *    {
     *      'status': 'OK'
     *    }
     */
    static health () {
      // TODO: Add some checks, e.g. database status
      this.body = {'status': 'OK'}
    }
  }
}