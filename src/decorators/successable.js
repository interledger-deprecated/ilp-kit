import React, {Component} from 'react'

// Always use after @connect it uses the success prop
// TODO asking for formKey because redux-form formKey is empty for some reason
export default function successable() {

  return (DecoratedComponent) => {
    return class extends Component {
      constructor(props, context) {
        super(props, context)

        this.state = {success: false}
      }

      componentWillUnmount() {
        clearTimeout(this.timer)
      }

      success = (keep) => {
        const self = this
        self.setState({success: true})

        // Don't hide the success message if the keep is true
        if (keep) return;

        this.timer = setTimeout(() => {
          self.setState({
            ...self.state,
            success: false
          })
        }, 5000) // Hide in 5 seconds
      }

      render() {
        return (
          <DecoratedComponent {...this.props} succeed={this.success} success={this.state.success} />
        )
      }
    }
  }
}
