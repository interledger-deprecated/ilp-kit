import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import ReactTooltip from 'react-tooltip'

import { RIENumber } from 'riek'

import { load, update, remove } from 'redux/actions/peer'
import PeerAddForm from 'containers/PeerAddForm/PeerAddForm'
import PeerSettlementButton from 'containers/PeerSettlementButton/PeerSettlementButton'

import List from 'components/List/List'

import classNames from 'classnames/bind'
import styles from './Peers.scss'
const cx = classNames.bind(styles)

@connect(
  state => ({
    peerState: state.peer,
    loading: state.peer.loading
  }),
  { load, update, remove })
export default class Peers extends Component {
  static propTypes = {
    peerState: PropTypes.object,
    load: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    loading: PropTypes.bool
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

  renderPeer = peer => {
    return (
      <div className={cx('panel', 'panel-default', 'peer')} key={peer.id}>
        <div className="panel-body">
          <div className={cx('row')}>
            <div className={cx('col-sm-4')}>
              <div>
                {peer.online && <i className={cx('online', 'fa', 'fa-circle', 'icon')} data-tip="Online" />}
                {!peer.online && <i className={cx('offline', 'fa', 'fa-circle', 'icon')} data-tip="Offline" />}
                <a href={'http://' + peer.hostname}>{peer.hostname}</a>
              </div>
              <div>
                <i data-tip="Currency" className={cx('fa', 'fa-money', 'icon')} />
                {peer.currency}
              </div>
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
              <span className={cx('lbl')}>Balance</span>
              <span>{peer.balance}</span>
            </div>
            <div className={cx('col-sm-2')}>
              <span className={cx('lbl')}>Destination</span>
              <span>{peer.destination}</span>
            </div>
            <div className={cx('col-sm-2', 'text-right')}>
              <PeerSettlementButton peer={peer} />
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
    const { peerState } = this.props

    return (
      <div className={cx('Peers')}>
        <Helmet title={'Peers'} />

        <div className={cx('row')}>
          <div className={cx('col-sm-8')}>
            <List
              loadingScreen={(
                <div className={cx('panel', 'panel-default', 'peersStatus')}>
                  <div className="panel-body">
                    <i className={cx('fa', 'fa-link')} />
                    <h1>Peers</h1>
                    <div>Loading...</div>
                  </div>
                </div>
              )}
              emptyScreen={(
                <div className={cx('panel', 'panel-default', 'peersStatus')}>
                  <div className="panel-body">
                    <i className={cx('fa', 'fa-link')} />
                    <h1>No Peers</h1>
                    <div>Use the form on the right to add your first peer</div>
                  </div>
                </div>
              )} state={peerState}>
              {peerState.list.map(this.renderPeer)}
            </List>
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
