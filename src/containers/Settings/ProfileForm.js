import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field, SubmissionError } from 'redux-form'
import DropzoneComponent from 'react-dropzone-component'
import Alert from 'react-bootstrap/lib/Alert'

import * as actions from 'redux/actions/auth'

import validate from './ProfileValidation'

import { successable, resetFormOnSuccess } from 'decorators'

import Input from 'components/Input/Input'

import classNames from 'classnames/bind'
import styles from './ProfileForm.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  user: state.auth.user,
  fail: state.auth.fail,
  // TODO server side rendering for initialValues is messed up
  // https://github.com/erikras/redux-form/issues/896
  initialValues: {
    email: (state.auth.user && state.auth.user.email) || undefined,
    name: (state.auth.user && state.auth.user.name) || undefined
  }
}), actions)
@reduxForm({
  form: 'profileSettings',
  validate
})
@successable()
@resetFormOnSuccess('profileSettings')
export default class ProfileForm extends Component {
  static propTypes = {
    // Redux Form
    pristine: PropTypes.bool,
    invalid: PropTypes.bool,
    handleSubmit: PropTypes.func,
    submitting: PropTypes.bool,
    error: PropTypes.any,
    submitFailed: PropTypes.bool,

    // Successable
    tempSuccess: PropTypes.func,
    success: PropTypes.bool,
    permFail: PropTypes.func,
    fail: PropTypes.any,

    // Auth
    user: PropTypes.object,
    save: PropTypes.func,
    updatePic: PropTypes.func
  }

  state = {}

  componentWillReceiveProps (nextProps) {
    if (this.props.fail !== nextProps.fail) {
      this.setState({
        error: nextProps.fail
      })
    }

    if (this.props.error !== nextProps.error) {
      this.setState({
        error: nextProps.error
      })
    }
  }

  save = (data) => {
    return this.props.save({username: this.props.user.username}, data)
      .then(() => {
        this.props.tempSuccess()

        tracker.track('Profile change', {status: 'success'})
      })
      .catch((error) => {
        tracker.track('Profile change', {status: 'fail', error: error})

        throw new SubmissionError({_error: error})
      })
  }

  dropzoneConfig = {
    showFiletypeIcon: false,
    postUrl: '/api/auth/profilepic',
    iconFiletypes: [ '.jpg', '.png', '.jpeg', '.gif' ],
    maxFiles: 1
  }

  dropzoneEventHandlers = {
    init: (dropzone) => {
      this.dropzone = dropzone
    },
    addedfile: () => {
      // TODO:UX upload progress photo placeholders
    },
    // TODO handle error
    success: () => {
      setTimeout(() => {
        this.props.updatePic()
      }, 1000)

      tracker.track('Profile picture upload')
    },
    error: (file, error) => {
      this.props.permFail(error)
    },
    complete: (file) => {
      this.dropzone.removeFile(file)
    },
    maxfilesexceeded: (file) => {
      this.removeAllFiles()
      this.addFile(file)
    }
  }

  render () {
    const { pristine, invalid, handleSubmit, submitting, success, submitFailed,
      user } = this.props

    const { error } = this.state

    if (!user) return null

    return (
      <div className={cx('ProfileForm')}>
        <div className={cx('header')}>
          <h3>Edit Profile</h3>
        </div>

        {success &&
        <Alert bsStyle='success'>
          Your profile has been successfully updated!
        </Alert>}

        {error && error.id &&
        <Alert bsStyle='danger'>
          {(() => {
            switch (error.id) {
              case 'EmailTakenError': return 'Email is already taken'
              case 'NotFoundError': return 'Current password is wrong'
              case 'InvalidBodyError': return error.message
              default: return 'Something went wrong'
            }
          })()}
        </Alert>}

        <div className={cx('row', 'row-sm')}>
          <div className={cx('col-sm-3')}>
            <div className={cx('profilePicBox')}>
              <img src={user.profile_picture || require('../../../static/placeholder.png')} className={cx('profilePic')} />
              <DropzoneComponent
                config={this.dropzoneConfig}
                eventHandlers={this.dropzoneEventHandlers}
                className={cx('dropzone', 'dropzoneLocal')}>
                <div className='dz-message'>
                  <i className='fa fa-cloud-upload' />
                  Upload new picture
                </div>
              </DropzoneComponent>
            </div>
          </div>
          <div className={cx('col-sm-9')}>
            <form onSubmit={handleSubmit(this.save)}>
              <Field
                name='email'
                component={Input}
                label='Email'
                type='email'
                size='lg'
                focus />
              <Field
                name='name'
                component={Input}
                label='Name'
                type='text'
                size='lg' />
              <Field
                name='password'
                component={Input}
                label='Current Password'
                type='password'
                size='lg' />

              <label>Change Password</label>
              <Field
                name='newPassword'
                component={Input}
                label='New Password'
                type='password'
                size='lg' />
              <Field
                name='verifyNewPassword'
                component={Input}
                label='Verify New Password'
                type='password'
                size='lg' />

              <button type='submit' className='btn btn-success' disabled={pristine || (invalid && !submitFailed) || submitting}>
                {submitting ? ' Saving...' : ' Save'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }
}
