var $ = exports
$.westerns = require('../westerns')
$.oz = require('../oscillators')
$.ph = require('../phasers')
$.amod = require('amod')
$.env = $.nvelope = require('../nvelope')
$.jsync = require('jsynth-sync')
$.zerone = require('../zerone')
$.jdelay = require('jdelay')
$.chrono = require('../jigger')
$.meffisto = require('../meffisto')
$.zerone = require('../zerone')
$.euclid = require('euclid-time')
$.beatmath = require('beatmath')
$.teoria = require('teoria')
$.gtone = require('../gtones')
$.sigdelay = require('../new-deal')
$.dataDelay = require('../data-delay')
$.winfunk = require('../winfunk')
$.midi = require('web-midi')
$.fract = function(v){
  return v - Math.floor(v)
}
$.quant = function(v, q){
  return Math.floor(v/q)*q  
}

$.sigmoid = function(t){
  return (1 / (1 + Math.pow(Math.E, -t))) * 2 - 1
}
$.sigmod = function(c, r, t, f){
  return c + (r * $.sigmoid($.amod(6, 6, t * 2, f))) 
}
$.alog = function(c, r, t, f){ return c + r * ((Math.log((1.0001 + $.oz.sine(t, f)) * 50) / Math.log(10))/2-2) }

$.iir = function(d, c){
  d = d || 7
  c = c || 2
  var fb = 1
  var output = new Array(c)
  output.fill(0)
  output = output.map(function(e, i){
    return new Array(i+1).fill(0)
  })

  var delays = new Array(c)
  delays.fill(0)
  delays = delays.map(function(e, i){
    return new Array(i+1).fill(0)
  })
  return function(s, f){
    f = f ||  fb
    let i = delays.reduce(function(aa, delay){
      var sample = delay[0] * f 
      delay.push(s)
      delay.shift()
      return sample + aa
    }, s) / d
    
    let j = delays.reduce(function(aa, delay){
      var sample = delay[0] * f
      delay.push(s)
      delay.shift()
      return sample + aa
    }, i) / d

    return j
  }
}

