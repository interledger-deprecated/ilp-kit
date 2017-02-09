import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import ReactTooltip from 'react-tooltip'

import { RIENumber } from 'riek'

import HelpIcon from 'components/HelpIcon/HelpIcon'

import { load, update, remove } from 'redux/actions/peer'
import List from 'components/List/List'
import PeerAddForm from 'containers/PeerAddForm/PeerAddForm'
import PeerSettlementButton from 'containers/PeerSettlementButton/PeerSettlementButton'

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

  state = {}

  componentWillMount() {
    this.props.load()
  }

  handleShowAddForm = () => {
    this.setState({
      ...this.state,
      showAddForm: true
    })
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
            <div className={cx('col', 'hostnameBox')}>
              {peer.online && <i className={cx('online', 'fa', 'fa-circle', 'icon')} data-tip="Online" />}
              {!peer.online && <i className={cx('offline', 'fa', 'fa-circle', 'icon')} data-tip="Offline" />}
              <a href={'http://' + peer.hostname}>{peer.hostname}</a>
            </div>
            <div className={cx('col', 'currencyBox')}>
              <span className={cx('lbl')}>Currency</span>
              <span>
                {peer.currency}
              </span>
            </div>
            <div className={cx('col', 'limitBox')}>
              <span className={cx('lbl')}>Limit</span>
              <span>
                {/* limit is converted to a string because of how <RIENumber> didValueChange works */}
                <RIENumber
                  value={peer.limit.toString()}
                  propName="limit"
                  change={this.handleUpdate.bind(null, peer)}
                  className={cx('limit')}
                  classEditing={cx('limitInput')}
                  classLoading={cx('loading')}
                  classInvalid={cx('invalid')}
                />
              </span>
            </div>
            <div className={cx('col', 'balanceBox')}>
              <span className={cx('lbl')}>Balance</span>
              <span>{peer.balance}</span>
            </div>
            <div className={cx('col', 'destinationBox')}>
              <span className={cx('lbl')}>Destination <HelpIcon text="Destination number is used for settlement" /></span>
              <span>{peer.destination}</span>
            </div>
            <div className={cx('col', 'actionsBox')}>
              <PeerSettlementButton peer={peer} />
              {/* TODO:UX deleteion confirmation */}
              <button type="button" className={cx('btn', 'btn-danger', 'btn-delete')} onClick={this.handleRemove.bind(null, peer)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { peerState } = this.props
    const { showAddForm } = this.state

    return (
      <div className={cx('Peers')}>
        <Helmet title={'Peers'} />

        {/* Add new */}
        {!showAddForm && peerState.list.length > 0 &&
        <div className={cx('header', 'row')}>
          <div className={cx('col-sm-10')}>
            <h3>Peers</h3>
          </div>
          <div className={cx('col-sm-2')}>
            <button type="button" className={cx('btn', 'btn-success', 'btn-block')} onClick={this.handleShowAddForm}>Add Peer</button>
          </div>
        </div>}

        {showAddForm &&
        <div className="panel panel-default">
          <div className="panel-heading">
            <div className="panel-title">Add a peer</div>
          </div>
          <div className="panel-body">
            <PeerAddForm peerState={this.props.peerState} />
          </div>
        </div>}

        <List
          loadingScreen={(
            <div className={cx('panel', 'panel-default', 'peersStatus')}>
              <div className="panel-body">
                <i className={cx('fa', 'fa-link')} />
                <h1>Loading Peers...</h1>
              </div>
            </div>
          )}
          emptyScreen={(
            <div className={cx('panel', 'panel-default', 'peersStatus')}>
              <div className="panel-body">
                <i className={cx('fa', 'fa-link')} />
                <h1>No Peers</h1>
                {!showAddForm &&
                <div>
                  <div>Click the button below to add your first peer.</div>
                  <button type="button"
                          onClick={this.handleShowAddForm}
                          className={cx('btn', 'btn-success', 'btn-lg', 'btn-add-lg')}>
                    Add Peer
                  </button>
                </div>}
              </div>
            </div>
          )} state={peerState}>
          {peerState.list.map(this.renderPeer)}
        </List>

        <ReactTooltip />
      </div>
    )
  }
}
