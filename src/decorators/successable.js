import React, {Component} from 'react'

// Always use after @connect it uses the success prop
export default function successable () {
  return (DecoratedComponent) => {
    return class extends Component {
      state = {
        success: false,
        fail: false
      }

      componentWillUnmount () {
        clearTimeout(this.timer)
      }

      setTimer = () => {
        const self = this

        this.timer = setTimeout(() => {
          self.setState({
            ...self.state,
            success: false,
            fail: false
          })
        }, 5000) // Hide in 5 seconds
      }

      success = (temp) => {
        this.setState({
          success: true,
          fail: false
        })

        clearTimeout(this.timer)
        if (temp) this.setTimer()
      }

      fail = (error, temp) => {
        this.setState({
          success: false,
          fail: error || true
        })

        clearTimeout(this.timer)
        if (temp) this.setTimer()
      }

      permSuccess = () => this.success()
      tempSuccess = () => this.success(true)
      permFail = (error) => this.fail(error)
      tempFail = (error) => this.fail(error, true)
      reset = () => this.setState({success: false, fail: false})

      render () {
        return (
          <DecoratedComponent {...this.props}
            permSuccess={this.permSuccess}
            tempSuccess={this.tempSuccess}
            success={this.state.success}
            permFail={this.permFail}
            tempFail={this.tempFail}
            fail={this.state.fail}
            reset={this.reset} />
        )
      }
    }
  }
}
