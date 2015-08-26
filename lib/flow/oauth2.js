'use strict'

var qs = require('qs')
  , request = require('request')
var utils = require('../utils')


exports.step1 = function (provider) {
  console.log('oauth2  --FLOW-- 1 - step1');
  var url = provider.authorize_url
  var params = {
    client_id:provider.key,
    response_type:'code',
    redirect_uri:utils.redirect_uri(provider),
    scope:provider.scope,
    state:provider.state
  }
  console.log('Params:',params);
  if (provider.basecamp) {
    params.type = 'web_server'
  }
  if (provider.surveymonkey) {
    params.api_key = provider.api_key
  }
  if (provider.custom_parameters) {
    provider.custom_parameters.forEach(function (key) {
      params[key] = provider[key]
    })
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  return url + '?' + qs.stringify(params)
}

exports.step2 = function (provider, step1, session, done) {
  console.log('oauth2  --FLOW-- 1 - step2');
  if (!step1.code) {
    var error = (Object.keys(step1).length) ? step1 : {error:'Grant: authorize_url'}
    console.log('oauth2  -----------------FLOW-- 1 - step2 -2 error',error);
    return done(utils.toQuerystring({}, error, true))
  }
  if ((step1.state && session.state) && (step1.state !== session.state)) {

    var error = {error:'Grant: OAuth2 state mismatch'}
    console.log('oauth2  -----------------FLOW-- 1 - step2 -3 error',error);
    return done(utils.toQuerystring({}, error, true))
  }
  var url = provider.access_url
  var options = {
    form:{
      grant_type:'authorization_code',
      code:step1.code,
      client_id:provider.key,
      client_secret:provider.secret,
      redirect_uri:utils.redirect_uri(provider)
    }
  }
  console.log('oauth2  -----------------FLOW-- 1 - step2 -4 options',options);
  if (provider.basecamp) {
    options.form.type = 'web_server'
  }
  if (provider.surveymonkey) {
    options.qs = {api_key:provider.api_key}
  }
  if (provider.reddit) {
    delete options.form.client_id
    delete options.form.client_secret
    options.auth = {user:provider.key, pass:provider.secret}
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  if(provider.concur){
    console.log('Concur - Provider Detected.');
    url = provider.access_url + '/?code=' + step1.code + '&client_id=' + provider.key +'&client_secret=' + provider.secret;
  }
  request.post(url, options, function (err, res, body) {
    console.log('oauth2  -----POST------------FLOW-- 1 - step2 -6 url:',url);
    console.log('oauth2  -----POST------------FLOW-- 1 - step2 -6 res:',res);
    console.log('oauth2  -----POST------------FLOW-- 1 - step2 -6 body:',body);

    var err = utils.error(err, res, body)
    if (err) return done(err)
    done(null, body)
  })
}

exports.step3 = function (provider, step2) {
  console.log('oauth2  --FLOW-- 1 - step3');
  return utils.toQuerystring(provider, step2)
}
