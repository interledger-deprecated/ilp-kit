## Apache virtual hosts setup
### Port forwarding (two ILP Kits)

Here's an example of an Apache 2.4 virtual host with enabled port forwarding.

Make sure the following modules are enabled for all of these examples:

```
LoadModule xml2enc_module libexec/apache2/mod_xml2enc.so
LoadModule proxy_html_module libexec/apache2/mod_proxy_html.so
LoadModule proxy_module libexec/apache2/mod_proxy.so
LoadModule proxy_connect_module libexec/apache2/mod_proxy_connect.so
LoadModule proxy_http_module libexec/apache2/mod_proxy_http.so
LoadModule proxy_wstunnel_module libexec/apache2/mod_proxy_wstunnel.so
LoadModule proxy_ajp_module libexec/apache2/mod_proxy_ajp.so
LoadModule proxy_balancer_module libexec/apache2/mod_proxy_balancer.so
LoadModule ssl_module libexec/apache2/mod_ssl.so
LoadModule rewrite_module libexec/apache2/mod_rewrite.so
```

Make sure Apache is listening on port 80 and 443:
```
Listen 80
Listen 443
```

```
<VirtualHost *:443>
  ServerName wallet.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet.com:3000/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  ProxyPass / http://wallet.com:3000/ retry=0
  ProxyPassReverse / http://wallet.com:3000/

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet.com.key
</VirtualHost>
```

### Apache Virtual Hosts

> Note: The wallet instances are running on port 80, but we also need to setup virtual hosts on port 443 for the webfinger lookups (issue mentioned above).

```
<VirtualHost *:80>
  ServerName wallet1.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet1.com:3010/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  ProxyPass / http://wallet1.com:3010/ retry=0
  ProxyPassReverse / http://wallet1.com:3010/
</VirtualHost>

<VirtualHost *:443>
  ServerName wallet1.com
  ProxyPass / http://wallet1.com:3010/ retry=0
  ProxyPassReverse / http://wallet1.com:3010/
  RedirectMatch ^/$ https://wallet1.com

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet1.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet1.com.key
</VirtualHost>

<VirtualHost *:80>
  ServerName wallet2.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /(.*) ws://wallet2.com:3020/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  ProxyPass / http://wallet2.com:3020/ retry=0
  ProxyPassReverse / http://wallet2.com:3020/
</VirtualHost>

<VirtualHost *:443>
  ServerName wallet2.com
  ProxyPass / http://wallet2.com:3020/ retry=0
  ProxyPassReverse / http://wallet2.com:3020/
  RedirectMatch ^/$ https://wallet2.com

  ProxyRequests Off
  ProxyPass /ledger/websocket ws://localhost:3101/websocket

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet2.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet2.com.key
</VirtualHost>
```
