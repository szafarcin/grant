'use strict'

var qs = require('qs');
var xmlparse = require('xml2js').parseString;

console.log(' flow utils - 1');
/*
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
*/
exports.redirect_uri = function (provider) {
  var url = [provider.protocol,'://',provider.host,'/connect/',provider.name,'/callback'].join('');
  console.log('Redirect URL:',url);
  //var url = 'http://dev-www.broadsoftlabs.com/share/gmail-uc1-copy/';
  //var url = 'https://dominik.broadsoftlabs.com:5060/connect/google/callback';
  return url
}
exports.toQuerystring = function (provider, body, err) {
  console.log(' flow utils - 2');
  console.log(' flow utils - 2 - provider',provider);
  console.log(' flow utils - 2 - body',body);
  console.log(' flow utils - 2 - err',err);


  if (provider.concur){
    console.log(' Concur flow utils - 2 - Body Recieved body',body);
    /*<Access_Token>
      <Instance_Url>https://www.concursolutions.com/</Instance_Url>
      <Token>oOwBEn5jqEjlfZx7tZsGES3rJPU=</Token>
      <Expiration_date>8/18/2016 6:36:06 AM</Expiration_date>
      <Refresh_Token>rgd43tuHAqzAxfVuzSPsO5gb6D53aCb</Refresh_Token>
      <bw_user_id></bw_user_id>
    </Access_Token>
    
    xmlparse(body, function (err, result) {
                      console.log('XMl -- - - - - -Res:',result);
                      (result)
                    });
    */
    var result = {}
    if(provider.bw_user_id){
      var bw_user_id = provider.bw_user_id;
    }else{
      var bw_user_id = 'undefined';
    }
    var append_bw_user_is = '<bw_user_id>' + bw_user_id + '</bw_user_id>' + "\n" + '</Access_Token>';
    
    //console.log('------ body--XXSSSSX-------typeof---',typeof body);
    console.log('------ body--XXSSSSX----------', body);
    var bodyReplaced = body.replace("</Access_Token>",append_bw_user_is);
    console.log('------bodyReplaced -------',bodyReplaced);
    console.log('------encodeURI body--XXSSSSX----------',encodeURI(body));
    return encodeURI(bodyReplaced);
  }
  var data
  try {data = JSON.parse(body)} catch (e) {}
  data = data || qs.parse(body)
  console.log('data -----------',data);
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
  if(provider.state){
    console.log('---------------state---------',provider.state);
    result.state = provider.state;
  }
  
  if(provider.userid){
    console.log('---------------userid---------',provider.userid);
    result.userid = provider.userid;
  }

  if(provider.userid_pass){
    console.log('---------------userid_pass---------',provider.userid_pass);
    result.userid_pass = provider.userid_pass;
  }

  if(provider.id){
    console.log('---------------id---------',provider.id);
    result.id = provider.id;
  }

  if(provider.pwd){
    console.log('---------------pwd---------',provider.pwd);
    result.pwd = provider.pwd;
  }
    if(provider.xsp){
    console.log('---------------xsp---------',provider.xsp);
    result.xsp = provider.xsp;
  }

  result[err ? 'error' : 'raw'] = data
  console.log('qs.stringify(result):::::',qs.stringify(result));
  return qs.stringify(result)
}

exports.error = function (err, res, body) {
  console.log(' flow utils - 3');
  console.log(' flow utils - 3 err:',err);
  //console.log(' flow utils - 3 res:',res._httpMessage);
  console.log(' flow utils - 3 res.req:',res.req);
  console.log(' flow utils - 3 body:',body);
  if (err) {
    return this.toQuerystring({}, {error:err.message}, true)
  }
  if (res.statusCode < 200 || res.statusCode > 299) {
    return this.toQuerystring({}, body, true)
  }
}
