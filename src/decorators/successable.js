import React, {Component} from 'react'

export default function successable() {

  return (DecoratedComponent) => {
    return class extends Component {
      constructor(props, context) {
        super(props, context)

        this.state = {success: false}

        this.success = this.success.bind(this)
      }

      success() {
        const self = this
        self.setState({success: true})

        this.timer = setTimeout(() => {
          self.setState({success: false})
        }, 5000) // Hide in 5 seconds
      }

      componentWillUnmount() {
        clearTimeout(this.timer)
      }

      render() {
        return (
          <DecoratedComponent {...this.props} succeed={this.success} success={this.state.success} />
        )
      }
    }
  }
}
