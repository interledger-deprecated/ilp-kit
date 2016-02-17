import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import sendValidation from './SendValidation';

import Alert from 'react-bootstrap/lib/Alert';

import classNames from 'classnames/bind';
import inputStyles from '../../containers/App/Inputs.scss';
import styles from './SendForm.scss';
const cx = classNames.bind({...inputStyles, ...styles});

@reduxForm({
  form: 'send',
  fields: ['destination', 'destinationAmount'],
  validate: sendValidation
})

export default class SendForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    invalid: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object,
    transfer: PropTypes.func.isRequired,
    findPath: PropTypes.func.isRequired,
    unmount: PropTypes.func.isRequired,
    success: PropTypes.bool,
    path: PropTypes.object.isRequired,
    fail: PropTypes.object,
    data: PropTypes.object,
    initializeForm: PropTypes.func
  };

  componentDidMount() {
    const { data, initializeForm } = this.props;
    if (data && data.accountName && data.destinationAmount) {
      initializeForm({
        destination: data.accountName,
        amount: data.destinationAmount
      });
    }
  }

  // TODO doesn't handle the initial render
  componentWillReceiveProps(nextProps) {
    // TODO also findPath on destination change
    // TODO sendingAmount should also be changeable
    // Pathfind on amount change
    if (nextProps.values.destination && nextProps.values.destinationAmount
      && this.props.values.destinationAmount !== nextProps.values.destinationAmount) {
      this.props.findPath(nextProps.values);
    }
  }

  shouldComponentUpdate(nextProps) {
    // Reset the form after a successful transfer
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
    const { pristine, invalid, handleSubmit, transfer, submitting, success, path, fail, fields: {destination, destinationAmount}, data } = this.props;

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
                case 'InvalidLedgerAccountError': return 'Destination account doesn\'t exist';
                default: return 'Something went wrong';
              }
            })()}
          </Alert>}

          <form name="example" onSubmit={handleSubmit(transfer)}>
            <div className="form-group">
              <label>Recipient</label>
              <input type="text" className={cx('form-control', 'lu-form-control', 'lu-input-lg')} autoFocus {...destination} />
              {destination.dirty && destination.error && <div className="text-danger">{destination.error}</div>}
            </div>
            <div className="row">
              <div className="col-sm-6 form-group">
                <label>Sending Amount</label>
                {path.sourceAmount &&
                  <div className={cx('pathFindAmount')}>{path.sourceAmount}</div>}
                {/* <input type="text" className={cx('form-control', 'lu-form-control', 'lu-input-lg')} {...amount} /> */}
                {/* {amount.dirty && amount.error && <div className="text-danger">{amount.error}</div>} */}
              </div>
              <div className="col-sm-6 form-group">
                <label>Receiving Amount</label>
                <input type="text" className={cx('form-control', 'lu-form-control', 'lu-input-lg')} {...destinationAmount} />
                {destinationAmount.dirty && destinationAmount.error && <div className="text-danger">{destinationAmount.error}</div>}
              </div>
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
