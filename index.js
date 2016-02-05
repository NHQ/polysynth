var fs = require('fs')
var metastasis = fs.readFileSync('./stateMachine.js', 'utf8')

var jsynth = require('../jsynth/stereo')
var falafel = require('falafel')
var knob = require('../parametrical/knob')
//var knob = require('../parametrical/xy')

module.exports = app 

var ap = app.prototype

function app(master, synth, channels){ // synth is a jsynth function
  if(!(this instanceof app)) return new app(master, synth)
  this.master = master
  this.rate = master.sampleRate
  this.channels = channels || 1
  this.nodes = []
  this.vals = []
  this.dsp = undefined
  this.script = synth
  this.auto = false
  this.state = undefined
}

ap.stateSynth = function(script){
    var self = this
    var vals = []
    var fn = undefined 
    script = script || this.script
/*    var s = falafel(new Function([], script), function(node){
      if(node.type === 'VariableDeclarator' && node.id && node.id.name === 'state') {
        node.init.elements.forEach(function(e,i){
          if(e.type === 'Literal' && !isNaN(e.value)){
            var l = vals.length
            vals.push(node.value)
            e.update('$ui['+l+']')
          }
        })
      }
    })
    fn = s.toString()
*/
    console.log($ui)
    prefun = new Function(['$ui'], script)
    console.log(fn)
    fn = prefun($ui)
    console.log(fn, fn.toString())
    self.dsp = function(t, c, i){
      return fn(t, c, i)
    }

    return this.nodes.length ? {ui: self.nodes, synth: self.dsp} : undefined 

    function $ui(ob){
      self.state = self.state || {}
      var keys = Object.keys(ob)
      keys.forEach(function(j){
        
        if(typeof ob[j] === 'Object'){
          if(self.state[j]) return self.state[j] = ob[j].value
          
        }
        if(typeof ob[j] === 'Array'){ // String Lieral options shorthand
          if(self.state[j]) return self.state[j] = ob[j]
          
        }
        else{
          if(self.state[j]) return self.state[j] = ob[j]
          var v = ob[j]
          var spinner = knob(function(d, a){
            self.state[j] = self.state[j] + d / Math.PI / 2
            console.log(self.state[j])
            fn = prefun($ui)
          })
          self.nodes.push(spinner)
          self.state[j] = ob[j]
        }
        function parse(o){
          j = j.toLowerCase()
          switch(j){
            case 'name':
            break
            case 'author':
            break
            case 'bpm':
            case 'tempo':
            break
          }
        }
        
      })
      return self.state
    }

    function update(){
      fn = prefun($ui)
    }
}


ap.autoSynth = function(script){
  script = script || this.script
  var nodes = []
  var vals = []
  var f32s = undefined
  var fn = new Function([], script)
  fn = falafel(fn, function(node){
    if(node.type === 'Literal'){
      if(!(isNaN(node.value))){
        var l = nodes.length
        var spinner = knob(function(d,a){
          vals[l] = vals[l] + d / Math.PI / 2
          update()
        })
        nodes.push(spinner)
        node.update('$ui['+ l +']')
        vals.push(node.value)
      }
    }
  })
  var prefun = new Function('$ui', 'return (' + fn.toString() + ')($ui)')
  var synth = prefun(vals)
  var dsp = function(t, s, i){
    return synth(t, s, i)
  }
  
  this.synth = dsp
  return {ui: nodes, synth: dsp}
  
  function update(){
    synth = prefun(vals)
/*
    vals = []
    var f = falafel(script, function(node){
      if(node.type === 'Literal'){
        if(!(isNaN(node.value))){
          var i = vals.length
          vals.push(node.value)
          node.update(f32[i])
        }
      }
    })
    f = new Function('', 'return ' + f.toString() + '()')()
    fn = f
*/
  }
}

ap.init = function(){
  var dsp = jsynth(this.master, this.synth)
  return dsp
}

ap.process = function(dur){
  var out1 = new Float32Array(Math.floor(this.master.sampleRate * dur))
  var rate = this.rate
  for(var x = 0; x < out1.length; x++){
    var t = x / rate
    var ret = this.synth(t, x, 0)
    out1[x] = ret
  }
  return out1
}

ap.processDual = function(dur){
  var out1 = new Float32Array(Math.floor(master.sampleRate * dur))
  var out2 = new Float32Array(Math.floor(master.sampleRate * dur))
  var rate = this.rate
  for(var x = 0; x < out.length; x++){
    var t = x / rate
    if(this.channels === 1)
      out1[x] = out2[x] = this.synth(t, x, 0)
    else if(this.channels === 2){
      var ret = this.synth(t, x, [0,0])
      out1[x] = ret[0]
      out2[x] = ret[1]
    }
  }
  return [out1, out2]
}
