var master = new AudioContext
var jsynth = require('../jsynth')
var dial = require('../parametrical/knob')
var draw = require('./draw')
var xhr = require('xhr')
var url = require('url')
var dsp = undefined 
var inpu = document.querySelector('input')
var butt = document.querySelector('button.fetch')
var ctrlbox = document.querySelector('div#controls')
var edbox = document.querySelector('div#editor')
var viewbox = document.querySelector('div#viewer')
var texted = document.querySelector('textarea')

var view = 'viewer'

edbox.style.display = 'none'

butt.addEventListener('click', fetch) 

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
  var app = require('./')(master, script)
  //fn = new Function('', dsp)

  var auto = app.stateSynth()
  if(auto === undefined){
    auto = app.autoSynth()
  }

  Array.prototype.forEach.call(document.querySelectorAll('#controls div'), function(e){
    e.parentNode.removeChild(e)
  })
  auto.ui.forEach(function(e){
    ctrlbox.appendChild(e)
  })
  if(window.autoSynth) autoSynth.disconnect(master.destination)
  autoSynth = jsynth(master, auto.synth, Math.pow(2, 14))
  var drawer = draw(viewbox, master)
  drawer.setBuffer(app.process(30))
  
  window.autoSynth = autoSynth
  autoSynth.connect(master.destination)
  
}  


inpu.value = 'http://studio.substack.net/spookphase?time=1454301075744'
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
