import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import ReactTooltip from 'react-tooltip'

import { RIENumber } from 'riek'

import { load, update, remove } from 'redux/actions/peer'
import PeerAddForm from 'containers/PeerAddForm/PeerAddForm'

import classNames from 'classnames/bind'
import styles from './Peers.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    peers: state.peer.peers
  }),
  { load, update, remove })
export default class Peers extends Component {
  static propTypes = {
    peers: PropTypes.array,
    load: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.load()
  }

  // TODO shouldn't be less then the balance
  handleUpdate = (peer, value) => {
    if (Number(value.limit) === peer.limit) return

    this.props.update(peer.id, value)
  }

  handleRemove = (peer, e) => {
    e.preventDefault()

    // TODO:UX Show an are you sure message
    this.props.remove(peer.id)
  }

  renderPeer = (peer) => {
    return (
      <div className={cx('panel', 'panel-default', 'peer')} key={peer.id}>
        <div className="panel-body">
          <div className={cx('row')}>
            <div className={cx('col-sm-3')}>
              <span className={cx('lbl')}>Hostname</span>
              <a href={'http://' + peer.hostname}>{peer.hostname}</a>
            </div>
            <div className={cx('col-sm-2')}>
              <span className={cx('lbl')}>Limit</span>
              <span>
                {/* limit is converted to a string because of how <RIENumber> didValueChange works */}
                <RIENumber
                  value={peer.limit.toString()}
                  propName="limit"
                  change={this.handleUpdate.bind(null, peer)}
                  className={cx('limit')}
                  classLoading={cx('loading')}
                  classInvalid={cx('invalid')}
                />
              </span>
            </div>
            <div className={cx('col-sm-2')}>
              <span className={cx('lbl')}>Currency</span>
              <span>{peer.currency}</span>
            </div>
            <div className={cx('col-sm-3')}>
              <span className={cx('lbl')}>Balance</span>
              <span>{peer.balance}</span>
            </div>
            <div className={cx('col-sm-2', 'text-center')}>
              <span className={cx('lbl')}>Status</span>
              {peer.balance && <i className={cx('online', 'fa', 'fa-circle')} data-tip="Online" />}
              {!peer.balance && <i className={cx('offline', 'fa', 'fa-circle')} data-tip="Offline" />}
            </div>
          </div>
        </div>

        {/* TODO:UX ask for confirmation */}
        <a href="" className={cx('deleteButton')} onClick={this.handleRemove.bind(null, peer)}>
          <i className="fa fa-times" />
        </a>
      </div>
    )
  }

  render() {
    const { peers } = this.props

    return (
      <div className={cx('Peers')}>
        <Helmet title={'Peers'} />

        <div className={cx('row')}>
          {/* List */}
          <div className={cx('col-sm-8')}>
            {peers.map(this.renderPeer)}
          </div>

          {/* Add new */}
          <div className={cx('col-sm-4')}>
            <div className="panel panel-default">
              <div className="panel-heading">
                <div className="panel-title">Add a peer</div>
              </div>
              <div className="panel-body">
                <PeerAddForm />
              </div>
            </div>
          </div>
        </div>

        <ReactTooltip />
      </div>
    )
  }
}
