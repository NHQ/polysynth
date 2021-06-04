const jsynth = require('../jsynth')
const jsynthb = require('../jsynth-buffer')
const jstreambuf = require('../jsynth-stream-buf')
const dlblob = require('./blob.js')

// editor console keeps track of variables?
// also gives instances auto named variables??
// console maps line by line to the editor???

if(!global.AudioNode){
  global.AudioNode = class AudioNode {
   
  }
}

const iff = function(True, False){ 
  let fn = [False, True]
  return function(i){ // 1 or 0 only, no ifs ands or else
    return fn[i]
  }
}

class Synth {

  constructor(){
    this._mods = []
    this.ultima = null
  }

  set source(node){
    this._source = node
  }

  set mods(mods=[]){
    this._mods = mods
  }

  set destination(node){
    this._destination = node
  }

  get destination(){
    return this._destination
  }

  connect(){
    var source = this._source
    if(this._mods.length>0){
    // do mod magic
    // will change source pointer
    // also point to primero connection to original source
    } 
    this.ultima = source // now the end node
    source.connect(this._destination)
  }
  
  disconnect(){
    this.ultima.disconnect(this._destination)
  }

}


class Generator {

  constructor(jsynth){
    this.synth = jsynth
  }

  connect(node){
    this.synth.connect(node)
  }

  disconnect(node){
    this.synth.disconnect(node)
  }

  get destination(){
    return this.synth
  }

}

class Event {
  
  constructor(){
  }
  trigger(){
    console.log(arguments)
    // create Synth ?
    // or require Synth | Sample | Script ?
  }
  play(){
    
  }
}

class Clock {

  constructor(sr=8000, bpm=60, interval=1, beats=[1]){
    this.index = 0
    this.paused = false
    this.sr = sr
    this._bpm = bpm
    this._interval = interval
    this._beats = beats
    this.samplesPerBeat = Math.round( this.sr / ( bpm / 60 ) )
    this.beatCount = 0
    this.events = []
  }

  set bpm(_bpm){
    this._bpm = _bpm
    this.samplesPerBeat = Math.round( this.sr / ( _bpm / 60 ) )
  }

  set interval(i){
    this._interval = i
  }

  set beats(rayray){
    this._beats = rayray
  }

  set pattern(rayray){
    this._beats = rayray
  }

  tick(){
    if(this.paused) return

    let i = Math.ceil(this.samplesPerBeat * this._interval)
    let s = this.index
    // the current major interval:
    let b = Math.floor(s / i) //% this._beats.length
    this.beatCount = b + 1 
    this._i = b % this._beats.length
    this._tick(this.index, this._interval, this._beats, this._i)
    this.index++
   // this.index = this.index % this.samplesPerBeat
  }

  _tick(index, inter, beats, current){
    let i = Math.ceil(this.samplesPerBeat*inter)
    let s = index
    if(Array.isArray(beats[current])){
      let z = s - i * current
      z = z % this.samplesPerBeat
    //console.log(index, current, z)
      let y = beats[current]
      let val =  inter / y.length
      let c = Math.floor(z / Math.ceil(this.samplesPerBeat * val)) % y.length
     //console.log(y)
      //console.log(x, y, val, z, c)
      this._tick(z, val, y, c)
    }
    
    else if(s % i == 0 && beats[current]){
//console.log(this._i, current, beats)
      this._trigger(beats[current], this._i, current)
    }
    else{
      //console.log('non', beats[current], s , i)
    } 
  }
  
  trigger(event){
    this.events.push(event)
  }

  _trigger(event, beat, sub){
    this.events.forEach(evt => {
      if(evt instanceof AudioNode){
        try{
          evt.play()
          if(evt.start) evt.start(0)
        } catch(err){}
      } 
      else if(evt instanceof Event){
        evt.trigger(event, beat, sub, this.beatCount)
      }
      else if(evt instanceof Function){
        evt(event, beat, sub, this.beatCount)
      }
    })
//    console.log(event, beat,sub, this.beatCount)
  }

  clearEvents(){
    this.events = []
  }

  pause(){
    this.paused = true
  }

  resume(){
    this.paused = false
  }

}

class PolySynth {

  constructor(master){ 
    this.master = master
    this.sampleRate = master.sampleRate
    // keep parameterized history of events for replay, do OSC?
    // somewhere else ^^^
    this.clockTime = 0
    this.clocks = [] // zo'os
    this.connected = []
    this.samples = []
    this.channels = 0
    this.maxChannels = 12
    this.output = master.createChannelMerger(this.maxChannels) // +1 master clock
    this.masterClock = jsynth(master, this.tick)
    this.recording = 0 
    this.recNode = jsynthb(master, (input, output) => {
      let fn = this.reckon(this.recording)
      fn.call(this, input)
      output.set(input)
    }, Math.pow(2, 16))
    this.streamBuf = jstreambuf(master, null, (e, source)=>{
      if(e) console.log(e) 
    })
    this.reckon = iff(input=>{
        this.streamBuf.push(input.slice(0))
        return true
      }, ()=>{
        return false
    })
    this.masterFX = new Synth(master)
    this.masterFX.source = this.output
    this.masterFX.destination = this.recNode
    this.masterFX.connect()
  }
  
  get destination(){
    return this.output
  }


  play(){
    if(this.playing) return 
    this.masterClock.connect(this.master.destination)
    this.master.resume()
    this.playing = true
    this.recNode.connect(this.master.destination)
  }

  stop(){
    this.playing = false
    this.masterClock.disconnect(this.master.destination)
    this.recNode.disconnect(this.master.destination)
  }

  record(){
    this.recording = this.recording ? 0 : 1
    if(recording){
      this.streamBuf = jstreambuf(master, null, (e, source)=>{
        if(e) console.log(e) 
      })
      this.currentTrack = streambuf
      rec.connect(master.destination)
      this.play()
    }
  }

  download(name=new Date().getTime(), cb=()=>{}){
    if(this.currentTrack){
      var blob = this.track.getBuffer().buffer
      dlblob(new Float32Array(blob), this.sampleRate, null, true, (e, a)=>{
        // a is href to dom blob
        a.name = name
        cb(err, a)
        this.currentTrack = undefined
      })
    }
  }


  tick(t){
    this.time = t
    this.clocks.forEach(e => e.tick(t))
  }

  createClock(bpm=60){
    let clock = new Clock(this.sampleRate, bpm)
    this.clocks.push(clock)
    return clock
  }
  
  createEvent(){
  
  }

  createSynth(){
  
  }

  createSample(){}

  createMic(){}
  
  disconnect(node){
    node.disconnect(this.output)
    node.connected = false 
    this.channels-=1
  }

  connect(node){
    this.connected.push(node)
    this.channels+=1
    node.connect(this.output, 0, this.channels)
    node.connected = true
    this.updateChannelMerger()
  }
  
  updateChannelMerger(){
    if(this.channels == this.maxChannels){
      let prev = this.output
      this.max *= 2
      let next = this.master.createChannelMerger(this.max)
      this.masterFX.disconnect()
      this.masterFX.source = next
      this.masterFX.connect()
      this.reconnect(prev, next)
      this.output = next
    }
  }
  
  reconnect(prev, next){
    this.connected.forEach(e => {
      if(e.connected) {
        e.disconnect(prev)
        e.connect(next)
      }
    })
  }

  clearClocks(){
    this.clocks = [] 
  }

  clearConnections(){
    this.connections.forEach(e => e.disconnect(this.output)) 
  }

  clearAll(){
    this.clearConnections()
    this.clearClocks()
  }


}

module.exports = {Synth, PolySynth, Clock, Event}
// ideal
/*

class synth{

  self(...attr) // any attributes set by self method become attributes of class
  //eg: synth.self(bpm) # named attributes, stop chasing var names across functions and modules
  // the language should stay knowing pointers by names, for the sakety of teh c0darr
 // literals not allowed
 // the interface for the program are the params, as named pointers
 // interface to state, simply mod interface to mod state
 //  mutability can be turned on/off; so that at any time some param c = a * b can be locked to the result
 // in which case it looked like c = const(a * b) or c = var(a * b) at the input level
//  where const = fn => {x=fn(); return _=>x}; and var = fn => _=> fn(); 
// internally, but again the language is a state keeper for all parameters
  furthermore, everything is a string, and function calls are their own variable, q.v. the following
  ex: var x = sumFun(y), could be written sumFun(y), and later sumFun(y) + sumFun(z), and this will be
  idemptoent and non repeating
}

*/
