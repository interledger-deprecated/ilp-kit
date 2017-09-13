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

Make sure Apache is listening on port 443:
```
Listen 443
```

```
<VirtualHost *:443>
  ServerName wallet.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /ledger/(.*) ws://wallet.com:3001/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger "http://wallet.example:3001" retry=0
  ProxyPassReverse /ledger "http://wallet.example:3001"
  ProxyPass /api "http://wallet.example:3000" retry=0
  ProxyPassReverse /api "http://wallet.example:3000"
  ProxyPass /.well-known/webfinger "http://wallet.example:3000/webfinger" retry=0
  ProxyPassReverse /.well-known/webfinger "http://wallet.example:3000/webfinger"
  ProxyPass / http://wallet.com:3010/ retry=0
  ProxyPassReverse / http://wallet.com:3010/

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet.com.key
</VirtualHost>
```

### Apache Virtual Hosts

```
<VirtualHost *:443>
  ServerName wallet1.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /ledger/(.*) ws://wallet1.com:3001/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger "http://wallet1.example:3001" retry=0
  ProxyPassReverse /ledger "http://wallet1.example:3001"
  ProxyPass /api "http://wallet1.example:3000" retry=0
  ProxyPassReverse /api "http://wallet1.example:3000"
  ProxyPass /.well-known/webfinger "http://wallet1.example:3000/webfinger" retry=0
  ProxyPassReverse /.well-known/webfinger "http://wallet1.example:3000/webfinger"
  ProxyPass / "http://wallet1.com:3010/" retry=0
  ProxyPassReverse / "http://wallet1.com:3010/"

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet1.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet1.com.key
</VirtualHost>

<VirtualHost *:443>
  ServerName wallet2.com

  RewriteEngine On
  RewriteCond %{HTTP:Connection} Upgrade [NC]
  RewriteRule /ledger/(.*) ws://wallet2.com:3101/$1 [P,L]

  ProxyRequests Off
  ProxyPass /ledger "http://wallet2.example:3101" retry=0
  ProxyPassReverse /ledger "http://wallet2.example:3101"
  ProxyPass /api "http://wallet2.example:3100" retry=0
  ProxyPassReverse /api "http://wallet2.example:3100"
  ProxyPass /.well-known/webfinger "http://wallet2.example:3100/webfinger" retry=0
  ProxyPassReverse /.well-known/webfinger "http://wallet2.example:3100/webfinger"
  ProxyPass / "http://wallet2.com:3110/" retry=0
  ProxyPassReverse / "http://wallet2.com:3110/"

  SSLEngine on
  SSLCertificateFile /etc/apache2/ssl/wallet2.com.crt
  SSLCertificateKeyFile /etc/apache2/ssl/wallet2.com.key
</VirtualHost>
```
