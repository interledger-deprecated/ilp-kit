import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import sendValidation from './SendValidation';

import {Alert} from 'react-bootstrap';

import classNames from 'classnames/bind';
import inputStyles from '../../containers/App/Inputs.scss';
const cx = classNames.bind(inputStyles);

@reduxForm({
  form: 'send',
  fields: ['recipient', 'amount'],
  validate: sendValidation
})

export default class SendForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    transfer: PropTypes.func.isRequired,
    unmount: PropTypes.func.isRequired,
    success: PropTypes.bool,
    fail: PropTypes.object,
    data: PropTypes.object,
    initializeForm: PropTypes.func
  };

  componentDidMount() {
    const { data, initializeForm } = this.props;
    if (data && data.accountName && data.amount) {
      initializeForm({
        recipient: data.accountName,
        amount: data.amount
      });
    }
  }

  // Reset the form after a successful transfer
  shouldComponentUpdate(nextProps) {
    if (!this.props.success && nextProps.success) {
      this.props.initializeForm();
      return false;
    }
    return true;
  }

  // Remove the success/error messages on unmount
  componentWillUnmount() {
    this.props.unmount();
  }

  render() {
    const { pristine, invalid, handleSubmit, transfer, submitting, success, fail, fields: {recipient, amount}, data } = this.props;

    return (
      <div className="row">
        <div className={cx('col-sm-12')}>
          {success &&
          <Alert bsStyle="success">
            <strong>Holy guacamole!</strong> You've just sent some money!
          </Alert>}

          {fail && fail.id &&
          <Alert bsStyle="danger">
            <strong>Woops! </strong>
            {(() => {
              switch (fail.id) {
                case 'LedgerInsufficientFundsError': return 'You have insufficient funds to make the payment';
                case 'InvalidLedgerAccountError': return 'Recipient account doesn\'t exist';
                default: return 'Something went wrong';
              }
            })()}
          </Alert>}

          <form name="example" onSubmit={handleSubmit(transfer)}>
            <div className="form-group">
              <label>Recipient</label>
              <input type="text" className={cx('form-control', 'lu-form-control', 'lu-input-lg')} autoFocus {...recipient} />
              {recipient.dirty && recipient.error && <div className="text-danger">{recipient.error}</div>}
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="text" className={cx('form-control', 'lu-form-control', 'lu-input-lg')} {...amount} />
              {amount.dirty && amount.error && <div className="text-danger">{amount.error}</div>}
            </div>
            <button type="submit" className={cx('btn', 'lu-btn')} disabled={(!data && pristine) || invalid || submitting}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
