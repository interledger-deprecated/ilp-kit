'use strict'

module.exports = HealthControllerFactory

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