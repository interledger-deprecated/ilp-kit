'use strict'

module.exports = HealthControllerFactory

/**
 * @api {get} /health Get server health status
 * @apiName GetHealth
 * @apiGroup Health
 * @apiVersion 1.0.0
 *
 * @apiDescription This endpoint will perform a quick self-check to ensure the
 *   server is still operating correctly.
 *
 * @apiIgnore For internal use.
 *
 * @returns {void}
 */
HealthControllerFactory.constitute = []
function HealthControllerFactory () {
  return class HealthController {
    static init (router) {
      router.get('/health', this.health)
    }

    static health () {
      // TODO: Add some checks, e.g. database status
      this.body = {'status': 'OK'}
    }
  }
}