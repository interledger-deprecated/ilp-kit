const request = require('five-bells-shared/utils/request')
const passport = require('koa-passport')
const UnprocessableEntityError = require('five-bells-shared').UnprocessableEntityError
const UnmetConditionError = require('five-bells-shared').UnmetConditionError
const Model = require('five-bells-shared').Model
const PaymentFactory = require('../models/payment')
const Log = require('../lib/log')
const DB = require('../lib/db')
const Config = require('../lib/config')

PaymentsControllerFactory.constitute = [PaymentFactory, Log, DB, Config]
export default function PaymentsControllerFactory (Payment, log, db, config) {
  log = log('payments')

  return class PaymentsController {
    static init (router) {
      router.get('/payments/:id', passport.authenticate(['basic'], { session: false }), this.getResource)
      //router.get('/payments/:id', this.getHistory)
      //router.put('/payments/:id', Case.createBodyParser(), this.putResource)
      //router.put('/payments/:id/fulfillment', Model.createBodyParser(), this.putFulfillmentResource)
    }

    static async getResource () {
      let id = this.params.id
      request.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()

      const item = await Payment.findById(this.params.id)

      if (!item) {
        this.status = 404
        return
      }

      this.body = item.getDataExternal()
    }

    /*static * putResource () {
      let id = this.params.id
      request.validateUriParameter('id', id, 'Uuid')
      id = id.toLowerCase()
      const caseInstance = this.body
      caseInstance.id = id
      caseInstance.state = 'proposed'

      if (caseInstance.notaries.length !== 1) {
        throw new UnprocessableEntityError('The case must contain exactly one notary (this notary)')
      } else if (caseInstance.notaries[0].url !== config.server.base_uri) {
        throw new UnprocessableEntityError(`The notary in the case must match this notary (expected: "${config.server.base_uri}", actual: "${caseInstance.notaries[0].url}")`)
      }

      let created
      yield db.transaction(co.wrap(function * (transaction) {
        // const notaries = yield Notary.bulkCreate(caseInstance.notaries, { transaction })
        created = yield Case.create(caseInstance, { transaction })
        // yield caseInstance.getDatabaseModel().addNotaries(notaries, { transaction })
      }))

      log.debug((created ? 'created' : 'updated') + ' case ID ' + id)

      this.body = caseInstance.getDataExternal()
      this.status = created ? 201 : 200
    }*/

    /*static * putFulfillmentResource () {
      const id = this.params.id
      const caseInstance = yield Case.findById(id)
      const fulfillment = this.body.getData()
      if (!caseInstance) {
        throw new UnprocessableEntityError('Unknown case ID ' + id)
      }

      if (caseInstance.state === 'executed') {
        this.body = caseInstance.getDataExternal()
        this.status = 200
        return
      } else if (caseInstance.state === 'rejected' || caseInstance.expires_at.getTime() < Date.now()) {
        throw new UnprocessableEntityError('Case ' + id + ' is already rejected')
      } else if (!Condition.testFulfillment(caseInstance.execution_condition, fulfillment)) {
        throw new UnmetConditionError('Invalid execution_condition_fulfillment')
      }

      caseInstance.state = 'executed'
      caseInstance.execution_condition_fulfillment = fulfillment

      this.body = caseInstance.getDataExternal()
      this.status = 200

      yield db.transaction(function *(transaction) {
        yield caseInstance.save({ transaction })
        yield notificationWorker.queueNotifications(caseInstance, transaction)
      })
    }*/
  }
}