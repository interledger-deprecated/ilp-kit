import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { reduxForm, Field } from 'redux-form'
import Helmet from 'react-helmet'

import Input from 'components/Input/Input'

import classNames from 'classnames/bind'
import styles from './SettlementRipple.scss'
const cx = classNames.bind(styles)

@reduxForm({
  form: 'send'
  // validate,
}, state => ({

}))
export default class SettlementRipple extends Component {
  static propTypes = {
    pristine: PropTypes.boolean,
    invalid: PropTypes.boolean,
    submitting: PropTypes.boolean
  }

  render () {
    const { pristine, invalid, submitting } = this.props

    return (
      <div className={cx('SettlementRipple')}>
        <Helmet>
          <title>Ripple - Settlement</title>
        </Helmet>

        <Field
          name='destination'
          component={Input}
          label='Destination'
          size='lg'
          focus />
        <button type='submit' className='btn btn-success' disabled={pristine || invalid || submitting}>
          {submitting ? ' Saving...' : ' Save'}
        </button>
      </div>
    )
  }
}
