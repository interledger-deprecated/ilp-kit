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

function post(resource, data, creds) {
  return fetch(resource, {
    method: 'POST',
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
