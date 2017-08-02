import React, {Component} from 'react'
import Helmet from 'react-helmet'

import ProfileForm from './ProfileForm'

export default class Settings extends Component {
  render () {
    return (
      <div className='row'>
        <Helmet>
          <title>Settings</title>
        </Helmet>

        <div className='col-md-8'>
          <ProfileForm />
        </div>
      </div>
    )
  }
}
