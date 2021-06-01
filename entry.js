var master = new AudioContext
/*
var compressor = master.createDynamicsCompressor()
compressor.threshold.value = -30;
compressor.knee.value = -20;
compressor.ratio.value = 12*2;
*/

var fs = require('fs')
var pcode = fs.readFileSync('./synths/midi.js', 'utf8')
var jsynth = require('../jsynth')
var jsynthb = require('../jsynth-buffer')
var dial = require('../parametrical/knob')
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
var streamBuff = require('../jsynth-stream-buf')
//var log = require('./swarm')
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
texted.value = fs.readFileSync('./synth.js', 'utf8')//window.localStorage['polysynth']//'http://studio.substack.net/supergroup?time=1447325050841'
var ed = require('../jsynth-script-node/allone.js')({cb: compile,edbox: texted})
ed.editor.editor.scrollTo(0,0);
ed.editor.editor.setCursor({line:0, char:0});
var started = false 
var recording = false 
compile()
var samples = []

filebutton.create({accept: 'audio/*'}).on('fileinput',function(input){
  _import(input.files, function(files){
    files.forEach(function(e, i){
      createSample(e.buffer, function(_sample){
        var n = files[i].name
        n = n.slice(0, n.lastIndexOf('.'))
        _sample.name = n
        _sample.index = samples.length
        samples.push(_sample)
      })
    })
  })
}).mount(ui.import)
/*
require('./source.js')(s=>{
  webmidi.getPortNames(function(e,d){
    midis.appendChild(h('ul', d.map(e => h('li',
      h('label', e,
       h('input', {type: 'checkbox', id: e, value: e, onclick: function(evt){
         var value = 0
         let last = 0
         let stream = webmidi.openInput(e, {index: 0, normalizeNotes: false})
         stream.on('data', d => {
          console.log(d)
           if(d[1] < 32) {
            if(d[2] > 0 && d[2] >= last) value ++
            else value--
            last = d[2]
            console.log(last, value)
          }
         })
       }}))
    ))))
  })
})
*/
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
  started = !started
  if(started){
    master.resume().then(() => {
      autoSynth.connect(master.destination)
    })
window.requestAnimationFrame(function(t){
 // anim()
})
  }
  else autoSynth.disconnect(master)
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
*/
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

function compile(txt){
  var script = txt || texted.value
  window.localStorage['polysynth'] = script 

    var prefun = new Function(['samples', '$', 'sampleRate', 'master'], script)
    //console.log(fn)
    var fn = prefun(samples,cheatcode, master.sampleRate, master)
    
    //fn = prefun($ui, cheatcode, self.sampleRate)
    var dsp = function(t, c, i){
      return fn(t, c, i)
    }
    console.log(dsp)
  //app = app || require('./')(master)
  //fn = new Function('', dsp)

  var _auto = dsp// app.stateSynth(script)
  //console.log(_auto)
  //_auto.ui.forEach(e => ctrlbox.appendChild(e.el))
  
  if(!window.autoSynth){
    auto = _auto
    autoSynth = jsynth(master,auto,Math.pow(2, 12))
    window.autoSynth = autoSynth
    console.log(typeof autoSynth)
 //   autoSynth.connect(master.destination)
    //autoSynth.connect(compressor)
    //compressor.connect(master.destination)
  }
  else window.requestAnimationFrame(function(){
    auto = window.autoSynth.fn = _auto
  })

  
}  
function createSample(buff, cb){
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
