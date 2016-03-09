import React from 'react'
import TestUtils from 'react-addons-test-utils'
import { expect} from 'chai'
import { Provider } from 'react-redux'
import { browserHistory } from 'react-router'
import createStore from 'redux/store'
import ApiClient from 'helpers/ApiClient'
const client = new ApiClient()

import { HistoryItem } from '../'
import mockStore from '../../../test/data/store'

import classNames from 'classnames/bind';
import styles from '../../components/HistoryItem/HistoryItem.scss'
const cx = classNames.bind(styles);

describe('HistoryItem', () => {
  let store, rendered

  const historyItemMock = mockStore.history.history[0];
  const userMock = mockStore.auth.user;

  store = createStore(browserHistory, client, mockStore);
  rendered = TestUtils.renderIntoDocument(
    <Provider store={store} key='provider'>
      <HistoryItem item={historyItemMock} user={userMock}/>
    </Provider>
  )

  it('should render correctly', () => {
    return expect(rendered).to.be.ok
  })

  it('should render with correct counterparty', () => {
    const element = TestUtils.findRenderedDOMComponentWithClass(rendered, cx('counterparty'))

    expect(element).to.exist
    expect(element.textContent).to.equal(historyItemMock.source_account)
  })
})