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

module.exports = function(master){

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
      // point to prima connection to original source
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
    
    constructor(node){
      this.node=node
    }
    trigger(){
      console.log(arguments)
      // create Synth ?
      // or require Synth | Sample | Script ?
    }
    play(event){
      
    }
  }

  class Clock {

    constructor(sampleRate=8000, bpm=60, interval=1, beats=[1]){
      this.index = 0
      this.paused = false
      this._sampleRate = sampleRate //master.sampleRate
      this._bpm = bpm
      this._interval = interval
      this._beats = beats
      this.samplesPerBeat = Math.round( sampleRate / ( bpm / 60 ) )
      this.beatCount = 0
      this.events = []
      this.onbeat = () => 0
      this.nonbeat = () => 0
      this.checkBeat = iff(t=>this.onbeat, f=>this.nonbeat)
    }

    set bpm(_bpm){
      this._bpm = _bpm
      this.samplesPerBeat = Math.round( this._sampleRate / ( _bpm / 60 ) )
      return this
    }

    set interval(i){
      this._interval = i
      return this
    }

    set beats(rayray){
      this._beats = rayray
      return this
    }

    set pattern(rayray){
      this._beats = rayray
      return this
    }

    set sampleRate(sr){
      this._sampleRate = sr
      this.samplesPerBeat = Math.round( this._sampleRate / ( this._bpm / 60 ) )
    }

    tick(sysTime){
      if(this.paused) return

      let i = Math.ceil(this.samplesPerBeat * this._interval)
      let s = this.index
      // the current major interval:
      let b = Math.floor(s / i) //% this._beats.length
      this.beatCount = b + 1 
      this._i = b % this._beats.length
      this._tick(this.index, this._interval, this._beats, this._i, sysTime)
      this.index++
     // this.index = this.index % this.samplesPerBeat
    }

    _tick(index, inter, beats, current, time){
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
        this._tick(z, val, y, c, time)
      }
      
      //this.cheackBeat(Math.min(1, Math.max(s % i, 1)){
      else if(s % i == 0){
        //console.log(s, i, s/this.samplesPerBeat)
        if(beats[current]){
  //console.log(this._i, current, beats)
          this._trigger(beats[current], this._i, current, time)
        }
      }
      else{
        //console.log('non', beats[current], s , i)
      } 
    }
    
    trigger(event){
      this.events.push(event)
      return this
    }

    _trigger(event, beat, sub, time){
      if(!(event instanceof Object)){
        event = { value : event }
      }
      event.interval = beat
      event.beat = sub
      event.time = time
      event.clock = this
      event.count = this.beatCount
      this.events.forEach(e => {
        event.triggered = e
        //e.connect(master.destination)
        this.onbeat(event)
      })

      /*

      this.events.forEach(evt => {
        if(evt instanceof AudioNode){
          //    console.log(evt)
          try{
            evt.start(0)
            evt.onended = function(){
              evt.stop()
            }
          } catch(err){console.log(err)}
        } 
        else if(evt instanceof Event){
          evt.trigger(event)
        }
        else if(evt instanceof Function){
          evt(event)
        }
      })
    */
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

    constructor(){ 
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
      this.nodeToChannel = {}
      this.idToNode = {}
      this.availableInputs = new Array(this.maxChannels).fill(0).map((e,i)=> i)
      let self = this
      this.masterClock = jsynth(master, function(t){
        self.tick(t)
        return 0
      }, 256)
      this.recording = 0 
      this.recNode = jsynthb(master, (input, output) => {
        let fn = this.reckon(this.recording)
        fn.call(this, input)
        output.set(input)
      }, Math.pow(2, 12))
      this.streamBuf = jstreambuf(master, null, (e, source)=>{
        if(e) console.log(e) 
      })
      this.reckon = iff(input=>{
          this.streamBuf.push(input.slice(0))
          return true
        }, ()=>{
          return false
      })
      this.render = master.createGain()
      this.render.channelCount = 1
      this.render.channelInterpretation = 'speakers'
      this.recNode.connect(this.render)
      this.masterFX = new Synth(master)
      this.masterFX.source = this.output
      this.masterFX.destination = this.recNode
      this.masterFX.connect()
    }
    
    get destination(){
      return this.output
    }

    start(){
      //if(this.playing) return 
      var self = this
      self.master.resume().then(()=>{
        self.masterClock.connect(self.master.destination) 
        self.playing = true
        self.render.connect(self.master.destination)
      })
    }

    play(cb){
      //if(this.playing) return 
      var self = this
      self.master.resume().then(()=>{
        self.masterClock.connect(self.master.destination) 
        self.playing = true
        self.render.connect(self.master.destination)
        if(cb) cb()
      })
    }

    stop(){
      this.playing = false
      this.masterClock.disconnect(this.master.destination)
      this.render.disconnect(this.master.destination)
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

    createClock(bpm=60, interval=1, pattern=[1]){
      let clock = new Clock(this.sampleRate, bpm, interval, pattern)
      //clock.sampleRate = this.sampleRate
      this.clocks.push(clock)
      const self = this
      clock.onbeat = event => {
        let evt = event.triggered
          //console.log(evt)
        if(evt instanceof AudioNode){
          try{
            evt.connect(master.destination)
            evt.start(0)
            //evt.play()
            evt.onended = function(){
              //console.log('ended')
              evt.disconnect(master.destination)
              //self.disconnect(evt)
            }
          } catch(err){console.log(err)}
        } 
        else if(evt instanceof Event){
          evt.trigger(event)
        }
        else if(evt instanceof Function){
          evt(event, self)
        }
      }
      return clock
    }
    
    createEvent(){
    
    }

    createSynth(){
    
    }

    createSample(i){
      let sam = jstreambuf(this.master, i)
      return sam
    }

    createMic(){}
    
    disconnect(node){
      let chan = this.nodeToChannel[node.id]
      node.disconnect(this.output)
      node.connected = false 
      this.channels-=1
      this.availableInputs.push(chan)
      delete this.nodeToChan[node.id]
    }

    connect(node){
      //this.connected.push(node)
      console.log(node)
      this.channels+=1
      if(node.id == undefined) node.id = Math.random()
      this.idToNode[node.id] = node
      let first = this.availableInputs.shift()
      this.nodeToChannel[node.id] = first
      node.connect(this.master.destination)//, 0, first)
      node.start(0)
      node.connected = true
      //this.updateChannelMerger()
    }
    
    updateChannelMerger(){
      if(this.availableInputs.length == 0){ //this.channels == this.maxChannels-1){
        let prev = this.output
        this.maxChannels *= 2
        this.availableInputs = new Array(this.maxChannels).fill(0).map((e,i)=>i).slice(this.maxChannels/2,this.maxChannels)
        let next = this.master.createChannelMerger(this.maxChannels)
        this.reconnect(prev, next)
        this.masterFX.disconnect()
        this.masterFX.source = next
        this.masterFX.connect()
        this.output = next
      }
    }
    
    reconnect(prev, next){
      for(var id in this.nodeToChannel){
        let node = this.idToNode[id]
        node.disconnect(prev)
        node.connect(next, 0, this.nodeToChannel[id])
      }
    }

    clearClocks(){
      this.clocks = [] 
    }

    clearConnections(){
      //this.connections.forEach(e => e.disconnect(this.output)) 
    }

    clearAll(){
      this.clearConnections()
      this.clearClocks()
    }


  }

  return {Synth, PolySynth, Clock, Event}
} 
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

  THE CLOSURE IS THE CONTEXT
  so it can be called again
}

*/
