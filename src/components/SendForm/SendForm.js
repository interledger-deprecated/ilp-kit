import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {reduxForm} from 'redux-form';
// import sendValidation, {colors} from './sendValidation';
import * as sendActions from 'redux/modules/send';

import {Alert} from 'react-bootstrap';

@reduxForm({
  form: 'send',
  fields: ['recipient', 'amount', 'password']
})

export default class SendForm extends Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    submitting: PropTypes.bool.isRequired
  };

  render() {
    const { success, error, submitting, transfer, fields: {recipient, amount, password}, handleSubmit } = this.props;

    return (
      <div className="row">
        <div className="col-sm-4">
          {success &&
          <Alert bsStyle="success">
            <strong>Holy guacamole!</strong> You've just sent some money!
          </Alert>}

          {error &&
          <Alert bsStyle="danger">
            <strong>Woops!</strong> Something went wrong
          </Alert>}

          <form name="example" onSubmit={handleSubmit(transfer)}>
            <div className="form-group">
              <label>Recipient</label>
              <input type="text" className="form-control" {...recipient} />
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="text" className="form-control" {...amount} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" {...password} />
            </div>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
