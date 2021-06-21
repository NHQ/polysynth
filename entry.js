var master = new AudioContext
/*
var compressor = master.createDynamicsCompressor()
compressor.threshold.value = -30;
compressor.knee.value = -20;
compressor.ratio.value = 12*2;
*/
var iframe = require('../iframarfi')
var render = iframe(require('./render.js'))
render.style.display ='none'
document.body.appendChild(render)

window.addEventListener('load', e => {
  window.addEventListener('message', e => console.log('msg', e.data))

})



var Timer = require('../since-when')
window.timer = new Timer
var fs = require('fs')
var pcode = fs.readFileSync('./synths/midi.js', 'utf8')
var jsynth = require('../jsynth')
var jsynthb = require('../jsynth-buffer')
var dial = require('../parametrical/knob')
var fileSample = require('../jsynth-file-sample')
var draw = require('./draw')
var _import = require('./import')
var cheatcode = require('./cheatcode.js')
var xhr = require('xhr')
var url = require('url')
var Time = require('since-when')
var jbuffer = require('jbuffers')
var ampview = require('amplitude-viewer')
var keycode = require('keycode')
var webmidi = require('web-midi')
var h = require('hyperscript')
var filebutton = require('file-button')
const series = require('run-series')
//var streamBuff = require('../jsynth-stream-buf')
//var log = require('./swarm')

var {Synth, PolySynth, Event, Clock} = require('./default.js')(master)
var jstreambuf = require('../jsynth-stream-buf')
var dlblob = require('./blob')
var dsp = undefined 
var inpu = document.querySelector('input')
var butt = document.querySelector('button.fetch')
var ctrlbox = document.querySelector('div#controls')
var edbox = document.querySelector('div#editor')
var viewbox = document.querySelector('div#viewer')
var ampbox = document.querySelector('div#ascope')
var texted = document.querySelector('#editor')
var start = document.querySelector('#start')
var system = document.querySelector('#system')
var midis = document.querySelector('#midi')
var ui = require('getids')()
console.log(ui)
texted.value = window.localStorage['polysynth']//'http://studio.substack.net/supergroup?time=1447325050841'
var ed = require('../jsynth-script-node/allone.js')({cb: compile,edbox: texted})
ed.editor.editor.scrollTo(0,0);
ed.editor.editor.setCursor({line:0, char:0});
var started = false 
var recording = false 
//compile()
var samples = []

ps = polysynth = new PolySynth()
polysynth.samples = samples

console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(polysynth)))
filebutton.create({accept: 'audio/*'}).on('fileinput',function(input){
  _import(input.files, function(files){
    var tasks = files.map(function(e, i){
      return function(cb){
        createSample(polysynth.master, e.buffer, function(_sample){
          var n = files[i].name
          n = n.slice(0, n.lastIndexOf('.'))
          //_sample.name = n
          //_sample.index = samples.length
          let si = samples.push(n)
          ui.samples.appendChild(h('div.sample', h('p', `[${si-1}] — ${n}`)))
          render.contentWindow.postMessage({type: 'sample', value: _sample.buffer})
          cb(null, _sample)
        })
       }
    })
    series(tasks, (e, _samples) => {
      if(e) console.log(e)
          
    })
  })
}).mount(ui.import)

class Beat extends Clock {

  constructor(bpm=60, interval=1, pattern=[1]) {
    super(bpm, interval, pattern)
    ps.registerClock(this)
    this.trigger = evt => 0
    this.onbeat = evt=> {
      if(Boolean(evt.value)) this.trigger(evt)
      else return 0
    }
  }
}

class Phrase extends Beat {

  constructor(bpm=60, interval=1, pattern=[1]) {
  
    super(bpm, interval, pattern)
    this.trigger = function(evt){
      if(typeof evt.value == 'object'){
        Object.values.forEach(v => {
          let e = polysynth.createSample(v)
          polysynth.connect(e)
          e.onended = ex => polysynth.disconnect(e)
        })
      }
    }
  }
}
class Measure extends Beat{

  constructor(bpm=60, interval=1, pattern=[1]) {
  
    super(bpm, interval, pattern)
    this.noteOn = e => 0
    this.noteOff = e => 0
    this.trigger = evt => {
      evt.type = 1 
      this.noteOn(evt)
      var interval = evt.value
      var self = this
      if(typeof evt.value == 'object'){
        interval = evt.value.duration
      }
      var clock = new Clock(this._bpm, interval, [0,1])
      ps.registerClock(clock)
      clock.onbeat = evtx => {
        evt.type = 0 
        self.noteOff(evt)
        clock.release()
      }
    }
  }
}


//window.midi = webmidi({index: 0, normalizeNotes: false})


require('./source.js')(s=>{
  webmidi.getPortNames(function(e,d){
     d.forEach((e,i) => {
       let el = document.createElement('option')
       el.value = e
       el.id = i
       el.innerText = e
       el.selected = false
       midis.appendChild(el)
     })
  })
})

midis.onchange = function(evt){
  console.log(this, this.value, evt.target[1] )
  let v = this.value
  Array.prototype.forEach.call(evt.target, (e,i) => {
    if(e.value == v){ // note the dummy -1 b/c there is a dummy option
      window.midi = webmidi(v, {index: i-1 , normalizeNotes: false})
    }
  }) 
}
var track, rec
ui.record.onclick = e => {
  recording = !recording
  if(recording){
    var streambuf = jstreambuf(master, null, (e, source)=>{
      if(e) console.log(e) 
    })
    rec = jsynthb(master, (input) => {
      streambuf.push(input.slice(0))
    })
    track = streambuf
    autoSynth.connect(rec)
    rec.connect(master.destination)
    if(!started){
      master.resume().then(() => {
        autoSynth.connect(master.destination)
      })
      started = true 
    }
    // push it to some list of samples, give it to the looper, bury the choppa!
  }
  else if(track){
    rec.disconnect()
    var blob = track.getBuffer().buffer
    dlblob(new Float32Array(blob), master.sampleRate, null, true, (e, a)=>{
      ui.system.appendChild(a)
      track = undefined
    })
  }
}

start.onclick = function(e){
  render.contentWindow.postMessage({
    type: 'system',
    value: 'start'
  })
}
//var drawer = draw(ampbox, master)
//drawer.setBuffer(app.process(6, 0))
//var ascope = ampview({stroke: 'yellow'})
//ascope.appendTo(viewbox)

var timer = new Time()
function anim(t){
  var d = timer.sinceBeginNS()/1e9
  //ascope.setTime(d/1e9)// % app.state.duration || Infinity)
  //ascope.draw(autoSynth.fn)
//drawer.setBuffer(app.process(timer.sinceLastNS()/1e9, d))
  //var b = app.process(Math.max(1/32, d/1e9), d/1e9)
  //buf.push(b)
  //if(started)window.requestAnimationFrame(anim)
} 


var auto = undefined

var view = 'viewer'

//edbox.style.display = 'none'
//butt.style.display = 'none'
//inpu.style.display = 'none'
//butt.addEventListener('click', fetch) 

var app = undefined
var keypress = {}
var command = false
/*
texted.addEventListener('keyup', function(e){
  var key = keycode(e)
  keypress[key] = false
  if(keypress['shift'] || keypress['ctrl']) {
    e.preventDefault()
    command = false
  }
})

texted.addEventListener('keydown', function(e){
  var key = keycode(e)
  keypress[key] = true
  if(keypress['shift'] && key === '2'){
    edbox.style.display = 'none'
  }
  if(keypress['shift'] && key === '1'){
    edbox.style.display = 'block'
  }
  if(keypress['ctrl'] && key === 'enter'){
    log.append({fn:  app.script})
  }
  if(keypress['shift'] && key === 'enter'){
   command = true
   compile() 
   e.preventDefault()
   if(false && !window.mic){
    require('../jsynth-mic')(master, function(err, node){
      console.log(node)
      node.connect(window.autoSynth)
      window.mic = node
    })
  }
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
*/

  cheatcode.fileSample = fileSample 
function compile(txt){

  render.contentWindow.postMessage({
    type: 'compile',
    value: txt
  })
  
/*
  var script = txt || texted.value
  window.localStorage['polysynth'] = script 
    
  var prefun = new Function(['samples', '$', 'sampleRate', 'master', 'Clock', 'Measure', 'Beat', 'Phrase'], script)
  //console.log(fn)
  var fn = prefun(samples,polysynth, master.sampleRate, master, Clock, Measure)
  
  //fn = prefun($ui, cheatcode, self.sampleRate)
  var dsp = function(t, c, i){
    return fn(t, c, i)
  }
*/
  
}  

function createSample(master, buff, cb){
  if(Array.isArray(buff)){
    
    // buf is an array of channel datas in float32 type arrays
    // no need to decode

    var tracks = buff
    tracks = mergeTracks(tracks)
    cb(tracks)

//    var s = new sampler(master, tracks, div, function(err, src){})


  }
  else{ // more likely an audio file
    master.decodeAudioData(buff, function(buffer){
      var tracks = []
      for(var x = 0; x < buffer.numberOfChannels; x++){
        tracks.push(buffer.getChannelData(x))
      }
      tracks = mergeTracks(tracks)
//      var s = new sampler(master, tracks, div, function(err, src){})
      cb(tracks)

    })
  }
}

function mergeTracks(tracks, a){
  a = a || 1/tracks.length
  var track = new Float32Array(tracks[0].length)
  for(var x = 0; x < track.length; x++){
    var y = 0
      for(var z = 0; z < tracks.length; z++){
        y += tracks[z][x] * a 
      }
    track[x] = y
  }
  return track
}
