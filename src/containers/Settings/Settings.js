import React, {Component} from 'react'
import Helmet from 'react-helmet'

import ProfileForm from './ProfileForm'

export default class Settings extends Component {
  render() {
    return (
      <div className="row">
        <Helmet title={'Settings'} />

        <div className="col-sm-6">
          <ProfileForm />
        </div>
      </div>
    )
  }
}
