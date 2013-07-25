# Whois Lookup for Google Glass

See if a domain name is available from Google Glass.

##Prerequisites

* Google Glass w/ access to Mirror API
* Node.js, NPM
* [DomainTools API](http://www.domaintools.com/api/)

## Installation

`npm install` or `npm install express request googleapis`

## Configuration

* Create a new [Google APIs Project](https://code.google.com/apis/console)
* Enable the Google Mirror API
* Create an OAuth 2.0 client ID for a web application
* Enter your server's hostname and port in [app.js](https://github.com/chadsmith/glass-whois/blob/master/app.js#L7-L10)
* Enter your Mirror API credentials in [app.js](https://github.com/chadsmith/glass-whois/blob/master/app.js#L11-L14)
* Enter your [DomainTools API](https://secure.domaintools.com/api/dashboard/) credentials in [app.js](https://github.com/chadsmith/glass-whois/blob/master/app.js#L15-L18)

## Usage

`node app` or `forever start app.js`

* Authorize the app by visiting http://hostname:port/ on your computer
* Reply to the Whois Lookup card with a keyword or domain name

## TODO

* Add domain registration via [NameCheap](http://www.namecheap.com/support/api/api.aspx) or [DNSimple](http://developer.dnsimple.com/).