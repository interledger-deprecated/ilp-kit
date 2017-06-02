import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom/server'
import serialize from 'serialize-javascript'
import Helmet from 'react-helmet'

/**
 * Wrapper component containing HTML metadata and boilerplate tags.
 * Used in server-side code only to wrap the string output of the
 * rendered route component.
 *
 * The only thing this component doesn't (and can't) include is the
 * HTML doctype declaration, which is added to the rendered output
 * by the server.js file.
 */
export default class Html extends Component {
  static propTypes = {
    assets: PropTypes.object,
    component: PropTypes.node,
    store: PropTypes.object
  }

  render () {
    const {assets, component, store} = this.props
    const content = component ? ReactDOM.renderToString(component) : ''
    const helmet = Helmet.rewind()

    return (
      <html lang='en-us'>
        <head>
          {helmet.base.toComponent()}
          {helmet.title.toComponent()}
          {helmet.meta.toComponent()}
          {helmet.link.toComponent()}
          {helmet.script.toComponent()}

          <link rel='shortcut icon' href='/favicon.png' />
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          {/* styles (will be present only in production with webpack extract text plugin) */}
          <link href={assets.styles.main} media='screen, projection' rel='stylesheet' type='text/css' charSet='UTF-8' />
          <link href='https://fonts.googleapis.com/css?family=Open+Sans:300' rel='stylesheet' />
        </head>
        <body>
          <div id='content' dangerouslySetInnerHTML={{__html: content}} />
          <script dangerouslySetInnerHTML={{__html: `window.__data=${serialize(store.getState())}`}} charSet='UTF-8' />
          {__DEVELOPMENT__ && <script src={assets.javascript.vendor} charSet='UTF-8' />}
          {/* TODO remove hardcode */}
          {__DEVELOPMENT__ && <script src='http://localhost:3011/dist/app.js' charSet='UTF-8' />}

          {!__DEVELOPMENT__ && <script src={assets.javascript.meta} charSet='UTF-8' />}
          {!__DEVELOPMENT__ && <script src={assets.javascript.vendor} charSet='UTF-8' />}
          {!__DEVELOPMENT__ && <script src={assets.javascript.main} charSet='UTF-8' />}

          <script src='https://cdn.ravenjs.com/3.15.0/raven.min.js'></script>
        </body>
      </html>
    )
  }
}
