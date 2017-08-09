import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendForm from 'containers/SendForm/SendForm'

export default class Send extends Component {
  static propTypes = {
    location: PropTypes.object
  }

  render () {
    return <SendForm params={this.props.location.query} />
  }
}
