const jsynth = require('../jsynth')
const jsynthb = require('../jsynth-buffer')
const jstreambuf = require('../jsynth-stream-buf')
const dlblob = require('./blob.js')
const fileSample = require('../jsynth-file-sample')

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

    constructor(bpm=60, interval=1, beats=[1]){
      var sampleRate = 8000
      this.index = -1
      this.paused = false
      this._sampleRate = 8000//sampleRate //master.sampleRate
      this._bpm = bpm
      this._interval = interval
      this._beats = beats
      this.samplesPerBeat = Math.round( sampleRate / ( bpm / 60 ) )
      this.beatCount = 0
      this.events = []
      this._abs = (i) => this.index++
      this._rel = (i) => this.index = i
      this.checkBeat = iff(i => this.index = i, i => this.index++)
      this._relative = 1
    }

    set relativity(e){
      this._relative = Number(Boolean(e))
      if(!e){
        this.index = -1
      }
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

    tick(sysTime, sysIndex){
      if(this.paused) return

      //this.index = sysIndex
      this.checkBeat(this._relative)(sysIndex)
      let i = Math.ceil(this.samplesPerBeat * this._interval)
      let s = this.index
      // the current major interval:
      let b = Math.floor(s / i) //% this._beats.length
      this.beatCount = b + 1 
      this._i = b % this._beats.length
      this._tick(this.index, this._interval, this._beats, this._i, sysTime)
      //this.index++
     // this.index = this.index % this.samplesPerBeat
    }

    _tick(index, inter, beats, current, time){
      let i = Math.ceil(this.samplesPerBeat*inter)
      let s = index
      let ifa = Number(Array.isArray(beats[current]))
      let ifb = !(s % i) // Math.min(1, Math.max(s % i, 0))
      let ifc = Number(!!beats[current] && ifb)
      let self = this
      let elze = iff(function(){
        //console.log('YEET')
        self._trigger(beats[current], self._i, current, time)
      }, v => 0)(ifc)
      let ifn = iff(function(){
        let z = s - i * current
        z = z % self.samplesPerBeat
      //console.log(index, current, z)
        let y = beats[current]
        let val =  inter / y.length
        let c = Math.floor(z / Math.ceil(self.samplesPerBeat * val)) % y.length
       //console.log(y)
        //console.log(x, y, val, z, c)
        self._tick(z, val, y, c, time)
      }, elze)(ifa)

      ifn()
      
      
    }
    
    _trigger(event, beat, sub, time){
      event = { value : event }
      event.interval = beat
      event.beat = sub
      event.time = time
      event.clock = this
      event.count = this.beatCount
      this.onbeat(event)

      /*
      this.events.forEach(e => {
        event.triggered = e
        //e.connect(master.destination)
        this.onbeat(event)
      })

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
      this.recording = this.playing = false
      this.incr = 0
      this.clockTime = 0
      this.clocks = [] // zo'os
      this._clocks = {}
      this.connected = []
      this.samples = []
      this.tracks = []
      this.channels = 0
      this.maxChannels = 32
      this.output = master.createChannelMerger(this.maxChannels) // +1 master clock
      this.nodeToChannel = {}
      this.idToNode = {}
      this.availableInputs = new Array(this.maxChannels).fill(0).map((e,i)=> i)
      let self = this
      this.masterClock = jsynth(master, function(t, i){
        self.tick(t, i)
        return 0
      }, 256*2)
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
      if(this.recording){
        this.streamBuf = jstreambuf(master, null, (e, source)=>{
          if(e) console.log(e) 
        })
        this.currentTrack = this.streamBuf
        if(!this.playing) this.play()
      }
      if(this.currentTrack){
        let i = this.tracks.push(this.currentTrack)
        //this.download(i)
        this.currentTrack = null
      }
    }

    download(i, name=new Date().getTime(), cb=()=>{}){
      let track = this.tracks[i]
      if(track){
        var blob = track.getBuffer().buffer
        dlblob(new Float32Array(blob), this.sampleRate, null, true, (e, a)=>{
          // a is href to dom blob
          a.name = name
          cb(e, a)
          //audio mergenode silentthis.currentTrack = undefined
        })
      }
    }


    tick(t, i){
      this.time = t
      this.clocks.forEach(e => e.tick(t,i))
    }

    registerClock(clock){
      clock.sampleRate = this.sampleRate
      let id = ++this.incr
      clock._id = id 
      this._clocks[id] = clock
      this.clocks = Object.values(this._clocks)
      let self = this
      clock.release = _ => {
        delete self._clocks[id] 
        this.clocks = Object.values(this._clocks)
      }
    }

    createClock(bpm=60, interval=1, pattern=[1]){
      let clock = new Clock(this.sampleRate, bpm, interval, pattern)
      //clock.sampleRate = this.sampleRate
      this.clocks.push(clock)
      let id = ++this.incr
      clock._id = id 
      this._clocks[id] = clock

      this.clocks = Object.values(this._clocks)
      let self = this
      clock.release = _ => {
        delete self._clocks[id] 
        this.clocks = Object.values(this._clocks)
      }
      clock.onbeat = event => {
        let evt = event.triggered
        evt = self.createSample(evt)
        evt.id = ++self.incr
          //console.log(evt)
        if(evt instanceof AudioNode){
          try{
            self.connect(evt)//.connect(master.destination)
            //evt.start(0)
            //evt.play()
            evt.onended = function(){
              //console.log('ended')
              //evt.disconnect()
              self.disconnect(evt)
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
      //let sam = jstreambuf(this.master, i)
      let sam = fileSample(this.master, i) 
      return sam
    }

    createMic(){}
    
    disconnect(node){
      let chan = this.nodeToChannel[node.id]
      node.disconnect(this.output)
    //  node.connected = false 
      //console.log('dis', chan)
      //this.channels-=1
      
      //this.availableInputs.push(chan)
      //this.nodeToChannel[node.id] = null 
    }

    connect(node){
      //this.connected.push(node)
      //console.log(node)
      if(node.id == undefined) node.id = this.channels+Math.random()
      this.idToNode[node.id] = node
      let first = this.channels % this.maxChannels//this.availableInputs.shift()
      //console.log('con',first, first)
      this.nodeToChannel[node.id] = first
      node.connect(this.output)//master.destination)
      node.start(0)
      //node.connected = true
      this.channels+=1
      //this.updateChannelMerger()
    }
    
    updateChannelMerger(){
      if(this.availableInputs.length == 0){ //this.channels == this.maxChannels-1){
        let prev = this.output
        this.availableInputs = this.availableInputs.concat(new Array(this.maxChannels).fill(0).map((e,i)=>i+this.maxChannels))
        this.maxChannels *= 2
        let next = this.master.createChannelMerger(this.maxChannels)
        this.reconnect(prev, next)
        this.output = next
        this.masterFX.disconnect()
        this.masterFX.source = next
        this.masterFX.connect()
      }
    }
    
    reconnect(prev, next){
      for(var id in this.nodeToChannel){
        let node = this.idToNode[id]
        node.disconnect(prev)
        node.connect(next, 0, this.nodeToChannel[id])
      }
    }

    clearClock(id){
      if(id instanceof Clock) id = id.id
      delete this._clocks[id]
      this.clocks = Object.values(this._clocks)
    }
    clearClocks(){
      this._clocks = {}
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
