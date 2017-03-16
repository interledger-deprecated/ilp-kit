import React from 'react'
import TestUtils from 'react-addons-test-utils'
import { expect} from 'chai'
import { Provider } from 'react-redux'
import { browserHistory } from 'react-router'
import createStore from 'redux/store'
import ApiClient from 'helpers/ApiClient'
const client = new ApiClient()

import ActivityPayment from './ActivityPayment'
import mockStore from '../../../test/data/store'

import classNames from 'classnames/bind'
import styles from './ActivityPayment.scss'
const cx = classNames.bind(styles)

describe('(component) ActivityPayment', () => {
  let store, rendered

  const ActivityPaymentMock = mockStore.activity.activity[0]
  const ActivityPaymentViewMock = mockStore.activity.activityView[0]
  const userMock = mockStore.auth.user

  store = createStore(browserHistory, client, mockStore)
  rendered = TestUtils.renderIntoDocument(
    <Provider store={store} key='provider'>
      <ActivityPayment activity={ActivityPaymentMock} user={userMock}/>
    </Provider>
  )

  it('render correctly', () => {
    return expect(rendered).to.be.ok
  })

  it('render with correct counterparty', () => {
    const element = TestUtils.findRenderedDOMComponentWithClass(rendered, cx('counterparty'))

    expect(element).to.exist
    expect(element.textContent).to.equal(ActivityPaymentViewMock.source_identifier)
  })
})
