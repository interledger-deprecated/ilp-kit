import React, { Component, PropTypes } from 'react'

export default class List extends Component {
  static propTypes = {
    state: PropTypes.object.isRequired,
    loadingScreen: PropTypes.object.isRequired,
    emptyScreen: PropTypes.object.isRequired,
    children: PropTypes.any.isRequired
  }

  render() {
    const { state, loadingScreen, emptyScreen, children } = this.props

    return (
      <div>
        {state.loading && loadingScreen}
        {!state.loading && state.list.length < 1 && emptyScreen}
        {state.list && children}
      </div>
    )
  }
}
