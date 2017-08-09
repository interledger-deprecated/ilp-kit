import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _extend from 'lodash/extend'

import classNames from 'classnames/bind'
import styles from './PrettyJson.scss'
const cx = classNames.bind(styles)

export default class PrettyJson extends Component {
  static propTypes = {
    json: PropTypes.object
  };

  _replace (match, ind, key, val, tra) {
    const spanEnd = '</span>'
    const keySpan = '<span class=' + cx('json-key') + '>'
    const valSpan = '<span class=' + cx('json-value') + '>'
    const strSpan = '<span class=' + cx('json-string') + '>'
    let sps = ind || ''
    if (key) {
      sps = sps + '"' + keySpan + key.replace(/[": ]/g, '') + spanEnd + '": '
    }
    if (val) {
      sps = sps + (val[0] === '"' ? strSpan : valSpan) + val + spanEnd
    }
    return sps + (tra || '')
  }

  _pretty (obj) {
    const regLine = /^( *)("[^"]+": )?("[^"]*"|[\w.+-]*)?([,[{]|\[\s*\],?|\{\s*\},?)?$/mg
    return JSON.stringify(obj, null, 2).replace(/&/g, '&amp;').replace(/\\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(regLine, this._replace)
  }

  render () {
    let { json } = this.props

    if (typeof json === 'string') {
      try {
        json = JSON.parse(json)
      } catch (err) {
        console.error('The string is not a valid json data!', err)
      }
    }

    return React.createElement('pre', _extend({}, this.props, { className: 'json-pretty', dangerouslySetInnerHTML: { __html: this._pretty(json) } }))
  }
}
