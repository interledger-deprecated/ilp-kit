import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { DropdownButton, MenuItem } from 'react-bootstrap'

import classNames from 'classnames/bind'
import styles from './PeerSettlementButton.scss'
const cx = classNames.bind(styles)

@connect(state => ({}), { })
export default class Peers extends Component {
  static propTypes = {
    peer: PropTypes.object
  }

  state = {}

  handleToggle = (isOpen) => {
    if (!isOpen) return

    setTimeout(() => {
      this.setState({
        ...this.state,
        options: [
          {name: 'Ripple'},
          {name: 'Etherium'}
        ]
      })
    }, 500)
  }

  render() {
    const { peer } = this.props
    const { options } = this.state

    return (
      <DropdownButton bsStyle="info" title="Settle" onToggle={this.handleToggle} id="settlement">
        {!options &&
        <MenuItem>Loading...</MenuItem>}

        {options && options.map(option => (
          <MenuItem key={options.name}>{option.name}</MenuItem>
        ))}
      </DropdownButton>
    )
  }
}
