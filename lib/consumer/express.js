'use strict'

var express = require('express')

var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  getpocket: require('../flow/getpocket')
}

console.log(' flow express - 1');
function Grant (_config) {
  console.log(' flow express - 1');
  var app = express()
  app.config = config.init(_config)
  app._config = config

  app.all('/connect/:provider/:override?', function (req, res, next) {
    console.log(' flow express - 2');
    if (!req.session)
      throw new Error('Grant: mount session middleware first')
    if (req.method == 'POST' && !req.body)
      throw new Error('Grant: mount body parser middleware first')
    next()
  })

  app.get('/connect/:provider/:override?', function (req, res, next) {
    console.log(' flow express - 3');
    if (req.params.override == 'callback') return next()

    req.session.grant = {
      provider:req.params.provider,
      override:req.params.override,
      dynamic:req.query
    }
    console.log(' flow express - 3b',req.session.grant);
    connect(req, res)
  })

  app.post('/connect/:provider/:override?', function (req, res) {
    console.log(' flow express - 4');
    req.session.grant = {
      provider:req.params.provider,
      override:req.params.override,
      dynamic:req.body
    }

    connect(req, res)
  })

  function connect (req, res) {
    console.log(' flow express - 5 req.url:',req.url);
    console.log(' flow express - 5 req.header:',req.header);
    var grant = req.session.grant;
    grant.dynamic.rurl = req.header('Referrer') || '/';
    console.log('grant:',grant);
    var provider = config.provider(app.config, grant)
    console.log(' flow express config -5a1 provider',provider);
    var flow = flows[provider.oauth]
    console.log(' flow express config -5a provider.oauth',provider.oauth);
    if (provider.oauth == 1) {
      
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }

    else if (provider.oauth == 2) {
      grant.state = provider.state
      var url = flow.step1(provider)
      res.redirect(url)
    }

    else if (flow) {
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }
  }

  app.get('/connect/:provider/callback', function (req, res) {
    console.log(' flow express - 6');
    console.log(' flow express - 6b req.session',req.session);
    
    // sal
    //req.session = {}
    /*
    req.session.grant = {
      provider:req.params.provider,
      override:req.params.override,
      dynamic:req.body
    }
    */
    // sal
    var grant = req.session.grant
    var provider = config.provider(app.config, grant)
    console.log(' flow express - 6c provider',provider);
    var flow = flows[provider.oauth]

    console.log(' flow express - 6d flow',flow);
    function callback (response) {
      if (!provider.transport || provider.transport == 'querystring') {
        res.redirect(provider.callback + '?' + response)
      }
      else if (provider.transport == 'session') {
        req.session.grant.response = qs.parse(response)
        res.redirect(provider.callback)
      }
    }

    if (provider.oauth == 1) {
      flow.step3(provider, grant.step1, req.query, function (err, response) {
        if (err) return res.redirect(provider.callback + '?' + err)
        callback(response)
      })
    }

    else if (provider.oauth == 2) {
      flow.step2(provider, req.query, grant, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        var response = flow.step3(provider, data)
        callback(response)
      })
    }

    else if (flow) {
      flow.step3(provider, grant.step1, function (err, response) {
        if (err) return res.redirect(provider.callback + '?' + err)
        callback(response)
      })
    }
  })

  return app
}

exports = module.exports = Grant
