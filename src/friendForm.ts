export function FriendForm(who) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>NLT KIT</title>
    <meta name="description" content="Network Money">
    <link rel="author" href="https://michielbdejong.com/">
    <meta charset="utf-8">
  </head>
  <body>
    <h2>Welcome to ${who}'s Profile page.</h2>
      <input id="name">
      <input id="url">
      <input id="submit" type="submit">
  </body>
  <script>
    function post(resource, data) {
      return fetch(resource, {
        method: 'POST',
        body: JSON.stringify(data)
      }).then((response) => {
        return response.json();
      });
    }

    document.getElementById('submit').onclick = async function () {
      console.log(await post('/${who}/' + document.getElementById('name').value, {
        msgType: 'FRIEND-REQUEST',
        url: document.getElementById('url').value,
      }));
    };
  </script>
</html>`;
  }
