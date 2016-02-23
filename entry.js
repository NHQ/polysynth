var master = new AudioContext
var jsynth = require('../jsynth')
var dial = require('../parametrical/knob')
var draw = require('./draw')
var xhr = require('xhr')
var url = require('url')
var Time = require('since-when')
var jbuffer = require('jbuffers')
var ampview = require('amplitude-viewer')
var keycode = require('keycode')

var dsp = undefined 
var inpu = document.querySelector('input')
var butt = document.querySelector('button.fetch')
var ctrlbox = document.querySelector('div#controls')
var edbox = document.querySelector('div#editor')
var viewbox = document.querySelector('div#viewer')
var ampbox = document.querySelector('div#ascope')
var texted = document.querySelector('textarea')

var auto = undefined

var view = 'viewer'

//edbox.style.display = 'none'

butt.addEventListener('click', fetch) 

var app = undefined
var keypress = {}
var command = false

texted.addEventListener('keyup', function(e){
  var key = keycode(e)
  keypress[key] = false
  if(keypress['shift']) {
    e.preventDefault()
    command = false
  }
})

texted.addEventListener('keydown', function(e){
  var key = keycode(e)
  keypress[key] = true
  if(keypress['shift'] && key === 'enter'){
   command = true
   compile() 
   e.preventDefault()
  }
})

function fetch(v){
  var p = url.parse(inpu.value)
  p.search = p.search || ''
  xhr.get('http://studio.substack.net' + p.pathname + '.js' + p.search, function(err, res){
    if(err) console.log(err)
    dsp = res.body
    texted.value = dsp
    compile()
  })
}

function viz(){
  
}

function compile(){
  var script = texted.value
  window.localStorage['polysynth'] = script 
  app = app || require('./')(master)
  //fn = new Function('', dsp)

  var _auto = app.stateSynth(script)
  if(_auto === undefined){
    _auto = app.autoSynth(script)
  }
  if(!window.autoSynth){
    auto = _auto.synth
    autoSynth = jsynth(master, auto, Math.pow(2, 12))
    window.autoSynth = autoSynth
    autoSynth.connect(master.destination)
  }
  else window.requestAnimationFrame(function(){
    auto = window.autoSynth.fn = _auto.synth
  })

  var all;
  Array.prototype.forEach.call(all = document.querySelectorAll('#controls div'), function(e){
    var r = _auto.ui.map(function(u){
      return u.dataset['uuid'] === e.dataset['uuid']
      
    }).filter(Boolean)
    if(!r.length) e.parentNode.removeChild(e)
  })
  _auto.ui.forEach(function(e){
    var r =  Array.prototype.map.call(all, function(u){
      return u.dataset['uuid'] === e.dataset['uuid']
    }).filter(Boolean)
    if(!r.length) ctrlbox.appendChild(e)
  })
  //var drawer = draw(ampbox, master)
  //drawer.setBuffer(app.process(6, 0))
  //var ascope = ampview({stroke: 'yellow'})
  //ascope.appendTo(viewbox)
  
  var timer = new Time()
  var timer2 = new Time()
  window.requestAnimationFrame(function(t){
    anim()
  })
  function anim(t){
    var d = timer.sinceBeginNS()
   // ascope.setTime(d/1e9)// % app.state.duration || Infinity)
    //ascope.draw(auto.synth)
    //var b = app.process(Math.max(1/32, d/1e9), d/1e9)
    //buf.push(b)
    window.requestAnimationFrame(anim)
  } 

  
}  
texted.value = window.localStorage['polysynth']//'http://studio.substack.net/supergroup?time=1447325050841'
//inpu.value = 'http://studio.substack.net/wave_pond_a_pond_of_waves_?time=1454548934826'

//fetch()
/*
var fs = require('fs')
var dsp = fs.readFileSync('./synth.js', 'utf8')

var app = require('./')(master, new Function(['t', 's', 'i'], dsp)())
var fn = new Function('', dsp)

var auto = app.autoSynth(fn)
auto.ui.forEach(function(e){
  ctrlbox.appendChild(e)
})

var autoSynth = jsynth(master, auto.synth, Math.pow(2, 14))
window.autoSynth = autoSynth
autoSynth.connect(master.destination)
*/
