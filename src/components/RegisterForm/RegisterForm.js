import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import registerValidation from './RegisterValidation'

import Alert from 'react-bootstrap/lib/Alert'

import { successable } from 'decorators'
import Input from 'components/Input/Input'

import { loadCode } from 'redux/actions/invite'

import classNames from 'classnames/bind'
import styles from './RegisterForm.scss'
const cx = classNames.bind(styles)

// TODO async validation on username
@connect(state => ({
  invite: state.invite.invite,
  config: state.auth.config
}), {loadCode})
@reduxForm({
  form: 'register',
  fields: ['username', 'email', 'password', 'inviteCode',
    'name', 'phone', 'address1', 'address2', 'city',
    'region', 'country', 'zip_code', 'fingerprint'],
  validate: registerValidation
})
@successable()
export default class RegisterForm extends Component {
  static propTypes = {
    invite: PropTypes.object,
    loadCode: PropTypes.func,
    params: PropTypes.object,
    config: PropTypes.object,

    // Form
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    register: PropTypes.func.isRequired,
    change: PropTypes.func.isRequired,

    // Successable
    permSuccess: PropTypes.func,
    permFail: PropTypes.func,
    fail: PropTypes.any
  }

  state = {}

  componentDidMount () {
    // this.refs.fakeuser.style = {display: 'none'}
    setTimeout(() => {
      this.setState({hideFakes: true})
    }, 1)

    // Device fingerprint
    if (this.props.config.antiFraud) {
      let fingerprint = ''

      fingerprint += navigator.plugins.length + ','
      fingerprint += window.screen.availHeight + ','
      fingerprint += window.screen.availWidth + ','

      for (let i = 0; i < navigator.plugins.length; i++) {
        fingerprint += navigator.plugins[i].name + ','
      }

      fingerprint += navigator.language + ',' + navigator.userLanguage + ','
      fingerprint += new Date().getTimezoneOffset() + ','
      fingerprint += navigator.userAgent

      this.props.change('fingerprint', fingerprint)
    }

    this.handleUrlInviteCode()
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.params !== nextProps.params) {
      this.handleUrlInviteCode(nextProps)
    }
  }

  handleUrlInviteCode = (props = this.props) => {
    const inviteCode = props.params.inviteCode

    if (!inviteCode) return

    this.props.change('inviteCode', inviteCode)
    this.handleAddInviteCode(inviteCode)
  }

  handleAddInviteCodeClick = (e) => {
    e.preventDefault()

    this.setState({
      ...this.state,
      showInviteInput: true
    })
  }

  // TODO:UX Invite code async validation
  handleAddInviteCode = (input) => {
    const inviteCode = input.value !== undefined ? input.value : input

    // redux-form onChange needs to happen first
    // TODO try without a timeout
    setTimeout(() => {
      if (!inviteCode) return

      this.props.loadCode(inviteCode)
        .then(code => {
          if (!code) return

          this.setState({
            ...this.state,
            showInviteInput: false
          })
        })
    }, 50)
  }

  register = (data) => {
    return this.props.register(data)
      .then(this.props.permSuccess)
      .catch(this.props.permFail)
  }

  render () {
    const { invite, handleSubmit, fail, pristine, invalid, submitting, config } = this.props
    const hideFakes = this.state && this.state.hideFakes
    const { showInviteInput } = this.state

    return (
      <form onSubmit={handleSubmit(this.register)} autoComplete='off'>
        {fail && fail.id &&
        <Alert bsStyle='danger'>
          {fail.id === 'UsernameTakenError' &&
          <div>Username is already taken</div>}
          {fail.id === 'EmailTakenError' &&
          <div>Email is already taken</div>}
          {fail.id === 'InvalidBodyError' &&
          <div>{fail.message}</div>}
          {fail.id === 'ServerError' &&
          <div>Something went wrong</div>}
        </Alert>}

        <div>
          {/* Hey chrome, can you please stop autofilling the register form? */}
          {!hideFakes &&
            <div className={cx('fakeInputs')}>
              <input type='text' name='fakeusernameremembered' ref='fakeuser' />
              <input type='password' name='fakepasswordremembered' ref='fakepass' />
            </div>}

          <Field
            name='username'
            component={Input}
            label='Username'
            size='lg'
            focus
            autoCapitalize='off' />
          <Field
            name='email'
            component={Input}
            label='Email'
            size='lg'
            autoCapitalize='off' />
          <Field
            name='password'
            component={Input}
            label='Password'
            size='lg'
            type='password' />

          {config.antiFraud &&
          <div>
            <div className='row'>
              <div className='col-sm-6'>
                <Field
                  name='name'
                  component={Input}
                  label='Full Name'
                  size='lg' />
              </div>
              <div className='col-sm-6'>
                <Field
                  name='phone'
                  component={Input}
                  label='Phone'
                  size='lg' />
              </div>
            </div>
            <div className='row'>
              <div className='col-sm-6'>
                <Field
                  name='address1'
                  component={Input}
                  label='Address 1'
                  size='lg' />
              </div>
              <div className='col-sm-6'>
                <Field
                  name='address2'
                  component={Input}
                  label='Address 2'
                  size='lg' />
              </div>
            </div>
            <div className='row'>
              <div className='col-sm-6'>
                <Field
                  name='city'
                  component={Input}
                  label='City'
                  size='lg' />
              </div>
              <div className='col-sm-6'>
                <Field
                  name='region'
                  component={Input}
                  label='Region'
                  size='lg' />
              </div>
            </div>
            <div className='row'>
              <div className='col-sm-6'>
                <Field
                  name='country'
                  component={Input}
                  label='Country'
                  size='lg' />
              </div>
              <div className='col-sm-6'>
                <Field
                  name='zip_code'
                  component={Input}
                  label='Zip Code'
                  size='lg' />
              </div>
            </div>
          </div>}

          {/* Invite code: Step 1 */}
          {!showInviteInput && !invite.code &&
          <a href='' className={cx('inviteLink')} onClick={this.handleAddInviteCodeClick}>Have an invite code?</a>}

          {/* Invite code: Step 2 */}
          {showInviteInput &&
            <Field
              name='inviteCode'
              component={Input}
              label='Invite Code'
              size='lg'
              focus
              onChange={this.handleAddInviteCode} />
          }

          {/* Invite code: Step 3 */}
          {invite.code && !invite.claimed && !showInviteInput &&
          <div className={cx('inviteCode', 'row')}>
            <span className={cx('text', 'col-sm-9')}>Invite code has been added!</span>
            {/* TODO:REFACTOR shouldn't use the global config */}
            <span className={cx('balance', 'col-sm-3')}>
              <span className={cx('label')}>Balance </span>
              <span className={cx('number')}>
                {config.currencySymbol}{invite.amount}
              </span>
            </span>
          </div>}

          {/* Invite code has already been claimed */}
          {invite.claimed &&
          <div className={cx('claimed')}>
            Provided invite code has already been used. <a href='' onClick={this.handleAddInviteCodeClick}>Try another one</a>
          </div>}
        </div>
        <button type='submit' className='btn btn-success btn-lg' disabled={pristine || invalid || submitting}>
          {submitting ? ' Registering...' : ' Register'}
        </button>
      </form>
    )
  }
}
