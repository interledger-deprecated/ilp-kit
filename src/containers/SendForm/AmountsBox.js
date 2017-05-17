import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { amountsChange, requestQuote } from 'redux/actions/send'

import cx from 'classnames'
import Input from 'components/Input/Input'

@connect(
  state => ({
    user: state.auth.user,
    sourceAmount: state.send.sourceAmount,
    destinationAmount: state.send.destinationAmount,
    destinationInfo: state.send.destinationInfo,
    config: state.auth.config,
    quoting: state.send.quoting,
    quote: state.send.quote
  }),
  { amountsChange, requestQuote })
export default class AmountsBox extends Component {
  static propTypes = {
    // Form
    // eslint-disable-next-line react/no-unused-prop-types
    input: PropTypes.object.isRequired,
    meta: PropTypes.object.isRequired,

    // State
    config: PropTypes.object,
    sourceAmount: PropTypes.string,
    destinationAmount: PropTypes.string,
    destinationInfo: PropTypes.object,
    amountsChange: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    requestQuote: PropTypes.func.isRequired,
    quoting: PropTypes.bool,

    // Props
    type: PropTypes.oneOf(['source', 'destination']).isRequired
  }

  componentDidMount () {
    // Pathfind if the amounts box is prefilled
    if (this.props.input.value) {
      setTimeout(() => {
        this.props.amountsChange(this.props.input.value, null)
      }, 2000) // TODO:UX wait for the fields to activate before doing a pathfind
    }
  }

  componentWillReceiveProps (nextProps) {
    const propsAmount = this.props[this.props.type + 'Amount']
    const nextPropsAmount = nextProps[nextProps.type + 'Amount']

    // Amounts didn't change, ignore the rest
    if (propsAmount === nextPropsAmount) {
      if (!nextProps.quoting) return

      if (nextProps.input.value !== nextPropsAmount) {
        this.updateInput(nextProps)
      }

      return
    }

    // Update the input
    this.updateInput(nextProps)

    // Quoting requires a destination
    if (!nextProps.destinationInfo.identifier) return

    // At least one amount should be specified
    if (!nextProps.sourceAmount && !nextProps.destinationAmount) return

    // if both amounts are specified then the change is triggered by a quote response, so no need to do anything else
    if (nextProps.sourceAmount && nextProps.destinationAmount) return

    // Request a quote
    nextProps.requestQuote({
      destination: nextProps.destinationInfo.identifier,
      sourceAmount: nextProps.sourceAmount,
      destinationAmount: nextProps.destinationAmount
    })

    this.lastQuotingField = nextProps.type
  }

  updateInput = (props = this.props) => {
    const amount = props[props.type + 'Amount']

    if (!props.meta.active) {
      props.input.onChange(amount || '') // null values don't work with redux-form
    }
  }

  handleInputChange = type => target => {
    if (this.props.meta.invalid) return

    // TODO: This breaks for very high precision numbers
    const value = String(parseFloat(target.value))

    const sourceValue = type === 'source' ? value : null
    const destinationValue = type === 'destination' ? value : null

    this.props.amountsChange(sourceValue, destinationValue)
  }

  render () {
    const { type, meta, destinationInfo, quoting, config } = this.props

    const isAmountDisabled = !destinationInfo.identifier ||
      destinationInfo.error ||
      (quoting && this.lastQuotingField !== type)

    const sourceCurrency = config.currencySymbol
    const destinationCurrency = (destinationInfo && destinationInfo.currencySymbol) || config.currencySymbol

    return (
      <div className='col-xs-6 form-group'>
        {
          type === 'source'
          ? <label>You Send</label>
          : <label>They Receive</label>
        }

        <div className={cx('input-group',
          { disabled: isAmountDisabled },
          { focused: meta.active }
        )}>
          <span className='input-group-addon'>{ type === 'source' ? sourceCurrency : destinationCurrency }</span>
          <Input
            {...this.props}
            ref='field'
            size='lg'
            disabled={isAmountDisabled}
            noErrors
            debounce
            onChange={this.handleInputChange(type)} />
        </div>

        {meta.dirty && meta.error &&
        <div className='text-danger'>{meta.error}</div>}
      </div>
    )
  }
}
