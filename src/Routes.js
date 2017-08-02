import React, { Component } from 'react'
import { Route } from 'react-router-dom'

class Routes extends Component {
  render() {
    return (
      <div>
        <Route exact path="/" component={Home}/>
        <Route path="/about" component={About}/>
      </div>
    )
  }
}

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
)

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

export default Routes
