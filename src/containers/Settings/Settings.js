import React, {Component} from 'react'

import { ChangeEmailForm } from 'containers'
import { ChangePasswordForm } from 'containers'

export default class Settings extends Component {
  render() {
    return (
      <div className="row">
        <div className="col-sm-6">
          <ChangeEmailForm />
        </div>
        <div className="col-sm-6">
          <ChangePasswordForm />
        </div>
      </div>
    )
  }
}
