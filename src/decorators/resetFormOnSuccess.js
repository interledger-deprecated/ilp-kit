import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {reset} from 'redux-form'

// Always use after @connect it uses the success prop
// TODO asking for formKey because redux-form formKey is empty for some reason
export default function resetFormOnSuccess (formKey) {
  return (DecoratedComponent) => {
    return class extends Component {
      static propTypes = {
        dispatch: PropTypes.func,
        success: PropTypes.bool
      }

      shouldComponentUpdate (nextProps) {
        if (!this.props.success && nextProps.success) {
          this.props.dispatch(reset(formKey))
          return false
        }

        return true
      }

      render () {
        return (
          <DecoratedComponent {...this.props} />
        )
      }
    }
  }
}
