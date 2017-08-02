import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { BrowserRouter as Router, Link } from 'react-router-dom'

import Routes from '../../Routes'

import { doSomething } from '../../redux/actions/app'

import classNames from 'classnames/bind'
import styles from './App.scss'
const cx = classNames.bind(styles)

const connectOptions = [
  state => ({
    doing: state.app.doing
  }),
  { doSomething }
]

class App extends Component {
  static propTypes = {
    doing: PropTypes.bool,
    doSomething: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.doSomething()
  }

  render() {
    const { doing } = this.props

    return (
      <Router>
        <div className={cx('App')}>
          <Helmet>
            <title>My React</title>
          </Helmet>

          <h2>Welcome to React</h2>

          {doing && 'DOING!'}

          <Link to="">Home</Link>
          <Link to="about">About</Link>

          <Routes />
        </div>
      </Router>
    )
  }
}

export default connect(...connectOptions)(App)
