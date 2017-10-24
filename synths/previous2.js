var st = $ui({
  bpm: 57,
  mfy: 6,
  amp: {'type' : 'bezier', name: 'timbre', value: [[0,0], [1/4, 1], [1/3, 1/2], [2/3, 1/2],[3/4, 1/2], [1,0]]}
})

var bpm = st.bpm
timer = $.zerone(bpm, sampleRate)
generator = new $.chrono()
generator2 = new $.chrono()

//console.log(timer, st)
//t0.emit('stop')
t1 = timer.beat(6/4*3, [1], function(ti, b){
console.log(st.amp)

 // if(b % 6 ===0)return
  var iir = $.iir(3)
  var amp = st.amp//[[0,1],[0,1],[1,1], [0,0]]
  var dec = [[0,0],[0,0], [1,0]]
  var dur = [5/2 * st.bpm/60]
  if(b % 2 === 0) dur[0] = 5/3 + Math.random() / 2
  var d = dur.reduce(function(a, e){ return a + e}, 0)
  var b = {}
  b.f = 432 / 6
  b.m = Math.PI * 2
  b.i = 5
  b.c = Math.sqrt(7)
  b.wave = 'tri'
  var bass = $.meffisto(b)
  var synth = function(t){ t= t - ti
     bass.m = $.amod(Math.PI / 3, Math.PI * 6, t, 6/4/3/3)
     return (bass.ring(t) * $.amod(.667, .111, t, -6/4/$.amod(2, 1, t, 1/dur[0] / 2)))
  }
  generator.set(ti, synth, {curves: [amp], durations: dur})

})

var t12s = 1
var del = $.jdelay(Math.floor(sampleRate * st.bpm / 60 / 3 / 3), 1/3, 1)

var btz = [[1,1],[,1,,1,,false],[1,1,1]]

t0 = timer.beat(3/4/2, btz, tink)

function tink(ti, b, off, swing){
  var mfy = 1
  if(b%24 > 15) return
  if(b%2 ===0) mfy = st.mfy
  var amp = [[0,0],[1,1/2],[0,1], [0,1/8]]
  var dec = [[0,1/8],[0,0], [1,0]]
  var dur = [3/64+Math.random()/24]//, 24/64/1+Math.random()/8]
  var d = dur.reduce(function(a, e){ return a + e}, 0)
  var iir = $.iir(5)
  var env = $.env([amp], dur)
  var o = {}
  o.c = Math.sqrt(2)
  o.m = 1/3
  o.i = 5
  o.f = b % 4 === 0 ? 432 * mfy : (432) * mfy
  o.wave = 'tri'
  if(b%16===0) {
    o.f = 432 * mfy
    o.wave = 'sq'
  }
  if(b%6===0){
     t12s = 1
  }

  if(b%4===0) {
    o.f = 432 * mfy * Math.pow(2, (t12s++/8) % 32)
    o.wave = 'sq'
    if(b%3===2)t12s++
  }


  if(b%4 ===0) o.wave = 'triangle'
  var buzz = $.meffisto(o)
  var synth = function(t, s, i){
    var tt = t
    t = t - ti + 1007
//    buzz.i = wmod_(14,2, t, buzz.f/3)
    buzz.m = 2 + amod_(0, 1/3/2/2/2, t, 3/4/2/ Math.pow(2, 3 + (b * 2) % 24)) 
    var s = (buzz.ring(t, $.amod(0, Math.PI/3/3/3, t, buzz.f*2)))                 

    return (iir(s/2))
    function tri (x) { return tri_(x,t) }
    function tri_ (x,t) { return Math.abs(1 - t % (1/x) * x * 2) * 2 - 1 }
  
    function amod_(c, r, t, f){ return c + r * ((Math.log((1.0001 + sin(f, t)) * 50) / Math.log(10))/2-2) }
    function wmod_(c, r, t, f){ return c + Math.floor(r * ((Math.log((1.0001 + sin(f, t)) * 50) / Math.log(10))/2-2)) }
    function amod(c, r, f){ return c + r * ((Math.log((1.0001 + sin(f)) * 50) / Math.log(10))/2-2) }
    function sin (x) { return Math.sin(2 * Math.PI * t * x) }
    function sin_ (x, t) { return Math.sin(2 * Math.PI * t * x) }
  }
  generator2.set(ti, synth, {curves: [amp], durations: dur})
}

dell = $.jdelay(Math.floor(_SAMPLERATE * st.bpm / 60 / 2 / 3), 0.855, .435)
var music = function(t, s, i){
  timer.tick(t)
  var g2 = generator2.tick(t, s, i)
  return generator.tick(t, s, i) + (dell(g2)/2 + g2/2)
}

return function(t, s, i){
  return (music(t, s, i))
}