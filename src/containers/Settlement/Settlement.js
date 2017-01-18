import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import {Link} from 'react-router'

import classNames from 'classnames/bind'
import styles from './Settlement.scss'
const cx = classNames.bind(styles)

@connect(state => ({}), {})
export default class Settlement extends Component {
  static propTypes = {
    children: PropTypes.object
  }

  render() {
    const { } = this.props

    return (
      <div className={cx('Settlement')}>
        <Helmet title={'Settlement'} />

        <div className={cx('row', 'list')}>
          <div className={cx('col-sm-4')}>
            <Link to="/settlement/paypal" className={cx('panel', 'panel-default', 'option')}>
              <div className="panel-body">
                <img src={require('./paypal.png')} />
              </div>
            </Link>
            <Link to="/settlement/bitcoin" className={cx('panel', 'panel-default', 'option')}>
              <div className="panel-body">
                <img src={require('./bitcoin.png')} />
              </div>
            </Link>
            <Link to="/settlement/ripple" className={cx('panel', 'panel-default', 'option')}>
              <div className="panel-body">
                <img src={require('./ripple.png')} />
              </div>
            </Link>
            <Link to="/settlement/etherium" className={cx('panel', 'panel-default', 'option')}>
              <div className="panel-body">
                <img src={require('./etherium.png')} />
              </div>
            </Link>
          </div>
          <div className={cx('col-sm-8')}>
            <div className={cx('panel', 'panel-default')}>
              <div className="panel-body">
                {this.props.children}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
