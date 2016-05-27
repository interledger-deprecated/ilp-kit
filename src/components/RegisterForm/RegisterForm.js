import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import registerValidation from './RegisterValidation'

import Alert from 'react-bootstrap/lib/Alert'

import { Input } from 'components'

import classNames from 'classnames/bind';
import styles from './RegisterForm.scss';
const cx = classNames.bind(styles);

// TODO async validation on username
@reduxForm({
  form: 'register',
  fields: ['username', 'email', 'password'],
  validate: registerValidation
})

export default class RegisterForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    register: PropTypes.func.isRequired,
    fail: PropTypes.object
  }

  componentDidMount() {
    // this.refs.fakeuser.style = {display: 'none'}
    setTimeout(() => {
      this.setState({hideFakes: true})
    }, 1)
  }

  render() {
    const { handleSubmit, register, fail, fields: {username, email, password}, pristine, invalid, submitting } = this.props
    const hideFakes = this.state && this.state.hideFakes

    return (
      <form onSubmit={handleSubmit(register)} autoComplete="off" autoComplete="false">
        {fail && fail.id &&
        <Alert bsStyle="danger">
          {fail.id === 'UsernameTakenError' &&
          <div><strong>Woops!</strong> Username is already taken</div>}
          {fail.id === 'EmailTakenError' &&
          <div><strong>Woops!</strong> Email is already taken</div>}
        </Alert>}

        <div>
          {/* Hey chrome, can you please stop autofilling the register form? */}
          {!hideFakes &&
            <div className={cx('fakeInputs')}>
              <input type="text" name="fakeusernameremembered" ref="fakeuser"/>
              <input type="password" name="fakepasswordremembered" ref="fakepass" />
            </div>}

          <Input object={username} label="Username" size="lg" focus />
          <Input object={email} label="Email" size="lg" />
          <Input object={password} label="Password" size="lg" type="password" />
        </div>
        <button type="submit" className="btn btn-complete" disabled={pristine || invalid || submitting}>
          {submitting ? ' Registering...' : ' Register'}
        </button>
      </form>
    )
  }
}
