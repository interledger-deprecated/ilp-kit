import React, {Component} from 'react'
import Helmet from 'react-helmet'

import ProfileForm from './ProfileForm'
import ChangePasswordForm from './ChangePasswordForm'

export default class Settings extends Component {
  render() {
    return (
      <div className="row">
        <Helmet title={'Settings'} />

        <div className="col-sm-6">
          <ProfileForm />
        </div>
        <div className="col-sm-6">
          <ChangePasswordForm />
        </div>
      </div>
    )
  }
}
