function get(resource, creds) {
  return fetch(resource, {
    method: 'GET',
    headers:  {
      Authorization: 'Basic ' + btoa(creds)
    }
  }).then((response) => {
    return response.json();
  })
}

function post(resource, data, creds, method = 'POST') {
  return fetch(resource, {
    method,
    headers:  {
      Authorization: 'Basic ' + btoa(creds)
    },
    body: JSON.stringify(data)
  }).then((response) => {
    return response.json();
  })
}

let app = new Vue({
  el: '#app',
  data: {
    session:  null,
    loggingin: false,
    registering:  false,
    username: null,
    password: null,
    repeat: null,
    tab: 'profile',
    edit:  -1,
    pay: -1,
    payAmount: 0,
    contacts: [],
    transactions: [],
  },
  methods: {
    register: function(event) {
      if (this.repeat == this.password) {
        this.checkSession();
      } else {
        window.alert('Passwords don\'t  match!');
      }
    },
    login: function(event) {
      this.checkSession();
    },
    logout: function(event) {
      this.session  = null;
      this.username =  null;
      this.password  = null;
      this.repeat = null;
      setTimeout(() => {
        localStorage.removeItem('creds');
      }, 0);
    },
    checkSession:  function() {
      const creds = this.username + ':' + this.password; // make a copy of the model values to avoid race conditions
      get('/session', creds).then(data => {
        if (data.ok) {
          this.loggingin = false;
          this.registering = false;
          this.session = true;
          // save the session in localStorage:
          setTimeout(() => {
            localStorage.setItem('creds', creds);
          }, 0);
          this.fetchData('contacts');
          this.fetchData('transactions');
        }
      });
    },
    fetchData: function(resource) {
      get('/' + resource, this.username + ':' + this.password).then(data =>  {
        if (data[resource]) {
          this[resource] = data[resource];
         }
      });
    },
    save: function (resource, index) {
      post('/' + resource +  '/' + index, this[resource][index], this.username + ':' + this.password).then(data =>  {
        if (data[resource]) {
          this[resource] = data[resource];
         }
      });
    },
    doPay: async function (index) {
      console.log('paying '+index+' '+this.payAmount + ' (balance '+
          this.contacts[index].current+')');
      const amount = parseInt(this.payAmount);
      const topup = this.contacts[index].current
          + this.contacts[index].receivable
          + amount
          - this.contacts[index].max;

      // FIXME: these PUTs should be POSTs
      // (blocked on https://github.com/ledgerloops/hubbie/issues/20)
      if (topup > 0) {
        console.log('topup needed first!', { amount, topup });
        const topupResult = await post('/topup', {
          contactName: this.contacts[index].name,
          amount: topup
        }, this.username + ':' + this.password, 'PUT')
        console.log({ topupResult });
      } else {
        console.log('no topup needed!', { amount, topup });
      }
      const data = await post('/pay', {
        contactName: this.contacts[index].name,
        amount: parseInt(this.payAmount)
      }, this.username + ':' + this.password, 'PUT');
      if (data.contacts) {
        this.contacts = data.contacts;
      }
      if (data.transactions) {
        this.transactions = data.transactions;
      }
    }
  }
});

setTimeout(() => {
  const creds = localStorage.getItem('creds');
  if (creds === null) {
    return;
  }
  const parts = creds.split(':');
  app.username = parts[0];
  app.password = parts[1];
  app.checkSession();
}, 0);
