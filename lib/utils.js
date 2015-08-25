'use strict'

var qs = require('qs')


exports.redirect_uri = function (provider) {
  var url = [
    provider.protocol,
    '://',
    provider.host,
    '/connect/',
    provider.name,
    '/callback'
  ].join('')
  return url
}

exports.toQuerystring = function (provider, body, err) {
  console.log(' flow utils - 2 - provider',provider);
  console.log(' flow utils - 2 - body',body);
  console.log(' flow utils - 2 - err',err);
  var data
  try {data = JSON.parse(body)} catch (e) {}
  data = data || qs.parse(body)

  if (provider.concur){
    console.log(' Concur flow utils - 2 - Body Recieved body',body);
    var result = {}
    if(provider.bw_user_id){
      var bw_user_id = provider.bw_user_id;
    }else{
      var bw_user_id = 'undefined';
    }
    var append_bw_user_is = '<bw_user_id>' + bw_user_id + '</bw_user_id>' + "\n" + '</Access_Token>';
    
    var bodyReplaced = body.replace("</Access_Token>",append_bw_user_is);
    console.log('------Concur bodyReplaced -------',bodyReplaced);
    return encodeURI(bodyReplaced);
  }
  var result = {}
  if (provider.elance) {
    result.access_token = data.data.access_token
    result.refresh_token = data.data.refresh_token
  }
  else if (provider.getpocket) {
    result.access_token = data.access_token
  }
  else if (provider.yammer) {
    result.access_token = data.access_token.token
  }
  else if (provider.oauth == 1) {
    for (var key in data) {
      if (key == 'oauth_token') {
        result.access_token = data.oauth_token
      }
      else if (key == 'oauth_token_secret') {
        result.access_secret = data.oauth_token_secret
      }
    }
  }
  else if (provider.oauth == 2) {
    for (var key in data) {
      if (key == 'access_token') {
        result.access_token = data.access_token
      }
      else if (key == 'refresh_token') {
        result.refresh_token = data.refresh_token
      }
    }
  }

  if(provider.bw_user_id){
    console.log('---------------bw_user_id---------',provider.bw_user_id);
    result.bw_user_id = provider.bw_user_id;
  }

  result[err ? 'error' : 'raw'] = data
  return qs.stringify(result)
}

exports.error = function (err, res, body) {
  if (err) {
    return this.toQuerystring({}, {error:err.message}, true)
  }
  if (res.statusCode < 200 || res.statusCode > 299) {
    return this.toQuerystring({}, body, true)
  }
}
