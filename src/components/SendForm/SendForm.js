import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import sendValidation from './SendValidation';

import {Alert} from 'react-bootstrap';

@reduxForm({
  form: 'send',
  fields: ['recipient', 'amount', 'password'],
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
    fail: PropTypes.string,
    type: PropTypes.string,
    data: PropTypes.object
  };

  render() {
    const { pristine, invalid, handleSubmit, transfer, submitting, success, fail, type, fields: {recipient, amount, password}, data } = this.props;

    return (
      <div className="row">
        <div className={type === 'widget' ? 'col-sm-12' : 'col-sm-4'}>
          {success &&
          <Alert bsStyle="success">
            <strong>Holy guacamole!</strong> You've just sent some money!
          </Alert>}

          {fail &&
          <Alert bsStyle="danger">
            <strong>Woops!</strong> {fail}
          </Alert>}

          <form name="example" onSubmit={handleSubmit(transfer)}>
            <div className="form-group">
              <label>Recipient</label>
              <input type="text" className="form-control" value={data && data.accountName || ''} {...recipient} />
              {recipient.error && recipient.touched && <div className="text-danger">{recipient.error}</div>}
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="text" className="form-control" value={data && data.amount || ''} {...amount} />
              {amount.error && amount.touched && <div className="text-danger">{amount.error}</div>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" {...password} />
              {password.error && password.touched && <div className="text-danger">{password.error}</div>}
            </div>
            <button type="submit" className="btn btn-success" disabled={pristine || invalid || submitting}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
