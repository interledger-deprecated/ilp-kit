import React, { Component, PropTypes } from 'react'

import ReactTooltip from 'react-tooltip'

export default class HelpIcon extends Component {
  static propTypes = {
    text: PropTypes.string
  }

  render () {
    const { text } = this.props

    return (
      <span>
        <i className='fa fa-question-circle' data-tip={text} />

        <ReactTooltip />
      </span>
    )
  }
}
