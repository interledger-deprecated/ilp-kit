import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import sendValidation from './SendValidation';

import {Alert} from 'react-bootstrap';

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
    success: PropTypes.bool,
    fail: PropTypes.object,
    type: PropTypes.string,
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

  render() {
    const { pristine, invalid, handleSubmit, transfer, submitting, success, fail, type, fields: {recipient, amount}, data } = this.props;

    return (
      <div className="row">
        <div className={type === 'widget' ? 'col-sm-12' : 'col-sm-8'}>
          {success &&
          <Alert bsStyle="success">
            <strong>Holy guacamole!</strong> You've just sent some money!
          </Alert>}

          {fail && fail.status === 422 &&
          <Alert bsStyle="danger">
            <strong>Woops!</strong> Account doesn't exist
          </Alert>}

          <form name="example" onSubmit={handleSubmit(transfer)}>
            <div className="form-group">
              <label>Recipient</label>
              <input type="text" className="form-control" {...recipient} />
              {recipient.error && recipient.touched && <div className="text-danger">{recipient.error}</div>}
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="text" className="form-control" {...amount} />
              {amount.error && amount.touched && <div className="text-danger">{amount.error}</div>}
            </div>
            <button type="submit" className="btn btn-success" disabled={(!data && pristine) || invalid || submitting}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
