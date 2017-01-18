import React, {Component} from 'react'
export default class Contact extends Component {
  render() {
    return (
		<div className="panel panel-default">
        <div className="panel-heading">
        	<div className="panel-title">Contact</div>
               </div>
 		<div className="panel-body">
      	<div class="col-sm-4">
        <h1>By Phone</h1>
        <p>We're available 24/7.<br/>Domestic:<br/>1-123-456-7890<br/>International:<br/>1-123-456-7890<br/></p>
		</div>
    	<div class="col-sm-4">
          <h1>By Mail</h1>
        <p>Send us a note.<br/>
				Interledger Network Customer Relations<br/>
				Wall Street - Financial District Executive Suites<br/>
				30 Broad Street 14th Floor, New York 10004<br/>
				United States<br/></p>
				</div>
			 	<div class="col-sm-4">
 				<h1>On Twitter/Facebook</h1>
 	<p>Follow, mention, or direct message/private message us.<br/>
					@InterledgerNetwork<br/></p>
					</div>
 					</div>
 					</div>
 					)
  }
}
