import React, { Component, PropTypes } from 'react'
import { reduxForm } from 'redux-form'
import Helmet from 'react-helmet'

import Input from 'components/Input/Input'

import classNames from 'classnames/bind'
import styles from './SettlementRipple.scss'
const cx = classNames.bind(styles)

@reduxForm({
  form: 'send',
  fields: ['destination'],
  // validate,
}, state => ({

}))
export default class SettlementRipple extends Component {
  static propTypes = {

  }

  render() {
    const { fields: { destination }, pristine, invalid, submitting } = this.props

    return (
      <div className={cx('SettlementRipple')}>
        <Helmet title={'Ripple - Settlement'} />

        <Input object={destination} label="Destination" size="lg" focus />
        <button type="submit" className="btn btn-success" disabled={pristine || invalid || submitting}>
          {submitting ? ' Saving...' : ' Save'}
        </button>
      </div>
    )
  }
}
