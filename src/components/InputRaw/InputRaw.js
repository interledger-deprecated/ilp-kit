import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class InputRaw extends Component {
  static propTypes = {
    input: PropTypes.object
  }

  render () {
    const { input, ...rest } = this.props

    const props = {
      ...input,
      ...rest
    }

    if (rest.type === 'textarea') {
      return <textarea {...props} />
    }

    return <input {...props} />
  }
}
