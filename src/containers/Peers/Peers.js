import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import ReactTooltip from 'react-tooltip'
import { HotKeys } from 'react-hotkeys'

import { RIENumber } from 'riek'

import { ButtonDanger } from 'napo'
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
    loaded: state.peer.loaded
  }),
  { load, update, remove })
export default class Peers extends Component {
  static propTypes = {
    peerState: PropTypes.object,
    load: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    loaded: PropTypes.bool
  }

  state = {}

  componentWillMount() {
    this.props.load()
  }

  handleToggleAddForm = () => {
    this.setState({
      ...this.state,
      showAddForm: !this.state.showAddForm
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
    const currentPercent = 100 * (peer.balance - Math.min(peer.minBalance, 0)) / (peer.limit - Math.min(peer.minBalance, 0))

    return (
      <div className={cx('peer')} key={peer.id}>
        <div className={cx('row', 'row-sm')}>
          <div className={cx('col', 'hostnameBox')}>
            {peer.online && <i className={cx('online', 'fa', 'fa-circle', 'icon')} data-tip="Online" />}
            {!peer.online && <i className={cx('offline', 'fa', 'fa-circle', 'icon')} data-tip="Offline" />}
            <span className={cx('label')}>{peer.currency}</span> <a href={'http://' + peer.hostname}>{peer.hostname}</a>
            {/* <div className={cx('destination')}>
              <HelpIcon text="Destination number is used for settlement" />{peer.destination}
            </div> */}
          </div>
          <div className={cx('col', 'balanceBox')}>
            <span className={cx('minBalance')}>{peer.minBalance || 0} <HelpIcon text="The minimum allowed balance (set by the peer)" /></span>
            <div className={cx('graph')}>
              <span className={cx('min')} />
              <span className={cx('current')} style={{left: `calc(${currentPercent}% - 0.5px)`}} />
              <span className={cx('max')} />

              <div className={cx('balance')}>{peer.balance || 0}</div>
            </div>
            <span className={cx('maxBalance')}>
              {/* limit is converted to a string because of how <RIENumber> didValueChange works */}
              <HelpIcon text="The maximum allowed balance (set by you)" /> <RIENumber
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
          <div className={cx('col', 'actionsBox')}>
            {peer.online && peer.minBalance !== 0 &&
            <PeerSettlementButton peer={peer} />}
            <ButtonDanger initialText="x"
                          confirmationText="sure?"
                          onConfirm={this.handleRemove.bind(null, peer)}
                          id={peer.id}
                          className={cx('btn-delete')} />
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
        <div className={cx('header', 'row', 'row-sm')}>
          <div className={cx('col-sm-10')}>
            <h3>Peers</h3>
          </div>
          <div className={cx('col-sm-2')}>
            <button type="button" className={cx('btn', 'btn-success', 'btn-block')} onClick={this.handleToggleAddForm}>Add Peer</button>
          </div>
        </div>}

        {showAddForm &&
        <HotKeys handlers={{ esc: this.handleToggleAddForm }}>
          <PeerAddForm peerState={this.props.peerState} />
        </HotKeys>}

        <List
          emptyScreen={(
            <div className={cx('panel', 'panel-default', 'peersStatus')}>
              <div className="panel-body">
                <i className={cx('fa', 'fa-link')} />
                <h1>No Peers</h1>
                {!showAddForm &&
                <div>
                  <div>Click the button below to add your first peer.</div>
                  <button type="button"
                          onClick={this.handleToggleAddForm}
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
