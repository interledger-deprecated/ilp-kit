import React, {Component, PropTypes} from 'react'
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

  componentWillReceiveProps (nextProps) {
    // Amounts didn't change, ignore the rest
    if (
      this.props.sourceAmount === nextProps.sourceAmount &&
      this.props.destinationAmount === nextProps.destinationAmount
    ) {
      if (!nextProps.quoting) return

      if (this.props.type === 'source' && nextProps.input.value !== nextProps.sourceAmount) {
        this.updateSourceInput(nextProps)
      }

      if (this.props.type === 'destination' && nextProps.input.value !== nextProps.destinationAmount) {
        this.updateDestinationInput(nextProps)
      }

      return
    }

    // Update the inputs
    this.updateSourceInput(nextProps)
    this.updateDestinationInput(nextProps)

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

    this.lastQuotingField = nextProps.sourceAmount ? 'source' : 'destination'
  }

  updateSourceInput = (props = this.props) => {
    if (!props.meta.active) {
      props.input.onChange(props.sourceAmount || '') // null values don't work with redux-form
    }
  }

  updateDestinationInput = (props = this.props) => {
    if (!props.meta.active) {
      props.input.onChange(props.destinationAmount || '') // null values don't work with redux-form
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
      <div className='col-sm-6 form-group'>
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
