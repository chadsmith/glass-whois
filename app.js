var util = require('util'),
  express = require('express'),
  path = require('path'),
  googleapis = require('googleapis'),
  request = require('request'),
  settings = {
    server: {
      hostname: 'mktgdept.com',
      port: '5555'
    },
    google: {
      client_id: '000000000000.apps.googleusercontent.com',
      client_secret: 'bbbbbbbbbbbbbbbbbbbbbbbb'
    },
    domaintools: {
      api_username: 'devuser',
      api_key: 'aaaaa-11111-bbbbb-22222-ccccc'
    }
  },
  template = function(text, title, color) {
    color = color || 'yellow';
    return '<article><section><div class="text-auto-size">' + text + '</div></section><footer><p class="' + color + '">' + title + '</p></footer></article>';
  },
  OAuth2Client = googleapis.OAuth2Client,
  oauth2Client,
  app = express();


app.configure(function() {
  app.use(express.bodyParser());
});

app.get('/', function(req, res) {
  if(!oauth2Client || !oauth2Client.credentials) {
    oauth2Client = new OAuth2Client(settings.google.client_id, settings.google.client_secret, 'http://' + settings.server.hostname + ':' + settings.server.port + '/oauth2callback');
    res.redirect(oauth2Client.generateAuthUrl({
      access_type: 'offline',
      approval_prompt: 'force',
      scope: [
        'https://www.googleapis.com/auth/glass.timeline',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
    }));
  }
  else {
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.withAuthClient(oauth2Client).newRequest('mirror.subscriptions.insert', null, {
        callbackUrl: 'https://mirrornotifications.appspot.com/forward?url=http://' + settings.server.hostname + ':' + settings.server.port + '/subcallback',
        collection: 'timeline'
      }).execute(function(err, result) {
        console.log('mirror.subscriptions.insert', util.inspect(result));
      });
      client.mirror.newRequest('mirror.timeline.insert', null, {
        html: template('Reply to this card with a domain name.', 'Whois Lookup'), 
        menuItems: [
          {
            action: 'REPLY'
          },
          {
            action: 'TOGGLE_PINNED'
          },
          {
            action: 'DELETE'
          }
        ]
      }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.timeline.insert', util.inspect(result));
      });
    });
    res.send(200);
  }
});

app.get('/oauth2callback', function(req, res) {
  if(!oauth2Client) {
    res.redirect('/');
  }
  else {
    oauth2Client.getToken(req.query.code, function(err, tokens) {
      oauth2Client.credentials = tokens;
      res.redirect('/');
    });
  }
});

app.post('/subcallback', function(req, res) {
  res.send(200);
  console.log('/subcallback', util.inspect(req.body));
  if(req.body.operation == 'INSERT' && req.body.userActions[0].type == 'REPLY')
    googleapis.discover('mirror', 'v1').execute(function(err, client) {
      client.mirror.timeline.get({ id: req.body.itemId }).withAuthClient(oauth2Client).execute(function(err, result) {
        console.log('mirror.timeline.get', util.inspect(result));
        var domain = result.text.toLowerCase().replace(/\bdot\b/ig, '.').replace(/[^a-z0-9\-\.]/g, '').replace(/\s([a-z]{2,})$/ig, '.$1');
        if(!domain.match(/\.[a-z]{2,}$/))
          domain += '.com';
        request.get({
          url: 'http://freeapi.domaintools.com/v1/' + domain + '/?api_username=' + settings.domaintools.api_username + '&api_key=' + settings.domaintools.api_key,
          json: true
        }, function(err, res, body) {
          console.log('freeapi.domaintools.com/v1/' + domain, util.inspect(body));
          if(body.error) {
            client.mirror.newRequest('mirror.timeline.update', { id: result.id }, {
              html: template(body.error.message, domain), 
              menuItems: [
                {
                  action: 'DELETE'
                }
              ],
              notification: {
                level: 'DEFAULT'
              }
            }).withAuthClient(oauth2Client).execute(function(err, result) {
              console.log('mirror.timeline.update', util.inspect(result));
            });
          }
          else if(!body.response.registrant) {
            client.mirror.newRequest('mirror.timeline.update', { id: result.id }, {
              html: template(domain + ' is not registered.', domain, 'green'),
              menuItems: [
                {
                  action: 'DELETE'
                }
              ],
              notification: {
                level: 'DEFAULT'
              }
            }).withAuthClient(oauth2Client).execute(function(err, result) {
              console.log('mirror.timeline.update', util.inspect(result));
            });
          }
          else {
            client.mirror.newRequest('mirror.timeline.update', { id: result.id }, {
              html: template('<table><tbody><tr><td>Registrant</td><td class="align-right">' + body.response.registrant.name + '</td></tr><tr><td>Created</td><td class="align-right">' + body.response.registration.created + '</td></tr><tr><td>Expires</td><td class="align-right">' + body.response.registration.expires + '</td></tr><tr><td>Updated</td><td class="align-right">' + body.response.registration.updated + '</td></tr></tbody></table>', domain, 'red'), 
              menuItems: [
                {
                  action: 'DELETE'
                }
              ],
              notification: {
                level: 'DEFAULT'
              }
            }).withAuthClient(oauth2Client).execute(function(err, result) {
              console.log('mirror.timeline.update', util.inspect(result));
            });
          }
        });
      });
    });
});

app.listen(settings.server.port);