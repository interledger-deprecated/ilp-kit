import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { HotKeys } from 'react-hotkeys'

import { advancedModeToggle } from 'redux/actions/auth'

const map = {
  advancedMode: 'option+d'
}

@connect(null, { advancedModeToggle })
export default function hotkeys () {
  return (DecoratedComponent) => {
    return class extends Component {
      static propTypes = {
        advancedModeToggle: PropTypes.func
      }

      overrideMousetrap = (hotkeys) => {
        if (!hotkeys) return

        // define previous stopCallback handler for mousetrap
        hotkeys.__mousetrap__.stopCallback = (e, element) => {
          // if the element has the class "mousetrap" then no need to stop
          if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
            return false
          }
          // stop for input, select, and textarea
          return element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' || (element.contentEditable && element.contentEditable === true)
        }
      }

      handlers = {
        advancedMode: this.props.advancedModeToggle
      }

      render () {
        return (
          <HotKeys keyMap={map} handlers={this.handlers} ref={this.overrideMousetrap}
            focused id='app'>
            <DecoratedComponent {...this.props} />
          </HotKeys>
        )
      }
    }
  }
}
