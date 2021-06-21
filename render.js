
module.exports = function(self){
  self.addEventListener('load', e => {
  
    var master = new AudioContext
    var cheatcode = require('./cheatcode.js')
    var webmidi = require('web-midi')
    var {Synth, PolySynth, Event, Clock} = require('./default.js')(master)
    var dlblob = require('./blob')
    var samples = []
    //cheatcode.fileSample = fileSample 

    ps = polysynth = new PolySynth()


    class Beat extends Clock {

      constructor(bpm=60, interval=1, pattern=[1]) {
        super(bpm, interval, pattern)
        ps.registerClock(this)
        this.trigger = evt => 0
        this.onbeat = evt=> {
          if(Boolean(evt.value)) this.trigger(evt)
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
          clock.relativity = false
          ps.registerClock(clock)
          clock.onbeat = evtx => {
            evt.type = 0 
            evt.time = evtx.time
            self.noteOff(evt)
            clock.release()
          }
        }
      }
    }

    self.addEventListener('message', m => {
        //self.parent.postMessage('yow')
        //console.log(m.data)
        if(m.data.type == 'sample'){
          samples.push(new Float32Array(m.data.value))
          console.log('sample added')
        }
        if(m.data.type == 'system'){
          polysynth.play()
        
        }
        if(m.data.type == 'compile'){
          polysynth.play()
          compile(m.data.value)
        
        }
      })

    //window.midi = webmidi({index: 0, normalizeNotes: false})

    require('./source.js')(s=>{
      webmidi.getPortNames(function(e,d){
         d.forEach((e,i) => {
           /*
           let el = document.createElement('option')
           el.value = e
           el.id = i
           el.innerText = e
           el.selected = false
           midis.appendChild(el)
          */
         })
      })
    })

    function compile(txt){
      var script = txt 
      window.localStorage['polysynth'] = script 
        
      var prefun = new Function(['samples', '$', 'sampleRate', 'master', 'Clock', 'Beat', 'Measure', 'self'], script)
      //console.log(fn)
      var fn = prefun(samples,cheatcode, master.sampleRate, master, Clock, Beat, Measure, self)
      

      
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
  })
}
