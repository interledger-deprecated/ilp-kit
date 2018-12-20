/* global Vue */

function get(resource, creds) {
  return fetch(resource, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa(creds)}`,
    },
  }).then(response => response.json());
}

function put(resource, data, creds, method = 'PUT') {
  return fetch(resource, {
    method,
    headers: {
      Authorization: `Basic ${btoa(creds)}`,
    },
    body: JSON.stringify(data),
  }).then(response => response.json());
}

const app = new Vue({
  el: '#app',
  data: {
    session: null,
    loggingin: false,
    registering: false,
    ready: false,
    username: null,
    password: null,
    repeat: null,
    tab: 'profile',
    edit: -1,
    expand: -1,
    pay: -1,
    payAmount: 0,
    contacts: [],
    transactions: [],
  },
  computed: {
    editTrust: {
      get() {
        return -this.contacts[this.edit].min;
      },
      set(val) {
        this.contacts[this.edit].min = -val;
      },
    },
  },
  methods: {
    register() {
      if (this.repeat === this.password) {
        this.checkSession();
      } else {
        window.alert('Passwords don\'t  match!'); // eslint-disable-line no-alert
      }
    },
    login() {
      this.checkSession();
    },
    logout() {
      this.session = null;
      this.username = null;
      this.password = null;
      this.repeat = null;
      setTimeout(() => {
        localStorage.removeItem('creds');
      }, 0);
    },
    checkSession() {
      const creds = `${this.username}:${this.password}`; // make a copy of the model values to avoid race conditions
      get('/session', creds).then((data) => {
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
        this.ready = true;
      }).catch(() => {
        this.ready = true;
      });
    },
    fetchData(resource) {
      get(`/${resource}`, `${this.username}:${this.password}`).then((data) => {
        if (data[resource]) {
          this[resource] = data[resource];
        }
      });
    },
    save(resource, index) {
      put(`/${resource}/${this[resource][index].id}`, this[resource][index], `${this.username}:${this.password}`).then((data) => {
        if (data[resource]) {
          this[resource] = data[resource];
        }
      });
    },
    deleteContact(index) {
      put(`/contacts/${this.contacts[index].id}`, {}, `${this.username}:${this.password}`, 'DELETE').then((data) => {
        if (data.contacts) {
          this.contacts = data.contacts;
        }
      });
    },
    async doPay(index) {
      // console.log('paying '+index+' '+this.payAmount);
      // console.log(' (balance '+ this.contacts[index].current+')');
      const amount = parseInt(this.payAmount, 10);
      const topup = this.contacts[index].current
        + this.contacts[index].receivable
        + amount
        - this.contacts[index].max;

      // FIXME: these PUTs should be POSTs
      // (blocked on https://github.com/ledgerloops/hubbie/issues/20)
      if (topup > 0) {
        // console.log('topup needed first!', { amount, topup });
        await put('/topup', {
          contactName: this.contacts[index].name,
          amount: topup,
        }, `${this.username}:${this.password}`);
      } else {
        // console.log('no topup needed!', { amount, topup });
      }
      const data = await put('/pay', {
        contactName: this.contacts[index].name,
        amount: parseInt(this.payAmount, 10),
      }, `${this.username}:${this.password}`);
      if (data.contacts) {
        this.contacts = data.contacts;
      }
      if (data.transactions) {
        this.transactions = data.transactions;
      }
    },
  },
});

setTimeout(() => {
  const creds = localStorage.getItem('creds');
  if (creds === null) {
    app.ready = true;
    return;
  }
  const parts = creds.split(':');
  [app.username, app.password] = parts;
  app.checkSession();
}, 0);
