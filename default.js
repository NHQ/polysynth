const jsynth = require('../jsynth')
const zo = require('../zerone')

// editor console keeps track of variables?
// also gives instances auto named variables??
// console maps line by line to the editor???


class PolySynth {

  constructor(master){ 
    this.master = master
    this.sampleRate = master.sampleRate
    this.on = []
    this.off = [] 
    // keep parameterized history of events for replay, do OSC?
    this.record = [] // event objects per synth sound, "jnotes"
    this.eventId = 0 // to be incr
    this.clocks = [] // zo'os
    this.connected = []
    this.samples = []
    this.channels = 0
    this.maxChannels = 12
    this.output = master.createChannelMerger(this.maxChannels)
    this.masterFX = new Synth(master)
    this.masterFX.source = this.output
    this.masterFX.destination = this.master.destination
    this.masterFX.connect()

  }
  
  get destination(){
    return this.master.destination
  }

  tick(){
    this.clocks.forEach(e => e.tick())
  }

  createClock(bpm){
    let clock = new Clock(bpm, this.sampleRate)
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
    this.channels--
  }

  connect(node){
    this.connected.push(node)
    node.connect(this.output, 0, ++this.channels)
    node.connected = true
    this.updateChannelMerger()
  }
  
  updateChannelMerger(){
    if(this.channels == this.maxChannels){
      let prev = this.output
      this.max *= 2
      let next = this.master.createChannelMerger(this.max)
      next.connect(this.master.destination)
      this.reconnect(prev, next)
      this.output.disconnect(this.master.destination)
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
    this.connections.forEach(e => e.disconnect(this.master.destination)) 
  }

  clearAll(){
    this.clearConnections()
    this.clearClocks()
  }


}

class Synth {

  constructor(master){
    this.context = master
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
    } 
    this.ultima = source
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
  
  constructor(fn){
    this.fn = fn
  }
  trigger(node){
    this.node = node
    fn(node)
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
      this.trigger(beats[current], this._i, current)
    }
    else{
      //console.log('non', beats[current], s , i)
    } 
  }
  
  trigger(event, beat, sub){
    console.log(event, beat,sub, this.beatCount)
  }

  stop(){
    this.emitters.forEach(e => e.emit('end'))
  }

  pause(){
    this.paused = true
  }

  resume(){
    this.paused = false
  }

}

module.exports = Clock
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
