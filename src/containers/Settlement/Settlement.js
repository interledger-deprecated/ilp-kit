import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router'
import ReactTooltip from 'react-tooltip'
import { routeActions } from 'react-router-redux'

import { load } from 'redux/actions/settlement_method'

import SettlementAddButton from 'containers/SettlementAddButton/SettlementAddButton'

import classNames from 'classnames/bind'
import styles from './Settlement.scss'
const cx = classNames.bind(styles)

@connect(state => ({
  list: state.settlementMethod.list,
  loading: state.settlementMethod.loading
}), { load, pushState: routeActions.push })
export default class Settlement extends Component {
  static propTypes = {
    children: PropTypes.object,
    load: PropTypes.func.isRequired,
    params: PropTypes.object,
    pushState: PropTypes.func,
    list: PropTypes.array,
    loading: PropTypes.bool
  }

  state = {}

  componentWillMount() {
    this.props.load()

    if (!this.props.params.id && this.props.list.length) {
      this.props.pushState('/settlement/' + this.props.list[0].id)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.params.id && nextProps.list.length) {
      nextProps.pushState('/settlement/' + nextProps.list[0].id)
    }
  }

  renderLogo = method => {
    if (method.type === 'paypal') return <img src="/paypal.png" />
    if (method.type === 'bitcoin') return <img src="/bitcoin.png" />
    if (method.type === 'ripple') return <img src="/ripple.png" />
    if (method.type === 'etherium') return <img src="/etherium.png" />

    if (!method.logo) {
      return method.name || 'Unnamed'
    }

    return <img src={method.logoUrl} />
  }

  renderSettlementMethod = method => {
    return (
      <Link to={'/settlement/' + method.id} className={cx('panel', 'panel-default', 'option')} key={method.id} title={method.name}>
        {method.enabled
          ? <i className={cx('enabled', 'fa', 'fa-circle', 'icon')} data-tip="Enabled" />
          : <i className={cx('disabled', 'fa', 'fa-circle', 'icon')} data-tip="Disabled" />}

        <div className="panel-body">
          {this.renderLogo(method)}
        </div>

        <ReactTooltip />
      </Link>
    )
  }

  render() {
    const { children, list, loading } = this.props

    return (
      <div className={cx('Settlement')}>
        <Helmet title={'Settlement'} />

        <div className={cx('row', 'list')}>
          <div className={cx('col-sm-4')}>
            {list && list.length > 0 && list.map(this.renderSettlementMethod)}

            <SettlementAddButton className={cx('option')} />
          </div>
          <div className={cx('col-sm-8')}>
            <div className={cx('panel', 'panel-default')}>
              <div className="panel-body">
                {list && list.length > 0 && children}

                {!loading && list && list.length < 1 &&
                <div className={cx('noResults')}>
                  <i className={cx('fa', 'fa-credit-card-alt')} />
                  <h1>No Settlement Methods</h1>
                  <div>Use the button on the left to add your first settlement method</div>
                </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
