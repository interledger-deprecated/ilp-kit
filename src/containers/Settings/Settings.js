import React, {Component} from 'react'
import Helmet from 'react-helmet'

import ProfileForm from './ProfileForm'
import ReceiversSettings from './ReceiversSettings'

export default class Settings extends Component {
  render () {
    return (
      <div className='row'>
        <Helmet title={'Settings'} />

        <div className='col-md-8'>
          <ProfileForm />
        </div>

        <div className='col-sm-offset-3 col-sm-6'>
          <ReceiversSettings />
        </div>
      </div>
    )
  }
}
