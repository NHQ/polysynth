var st = $ui({
  bpm:  72/2,
  mfy: 3,
  tu: 3
})
TIME = 0
console.log($, $.midi.getPortNames(function(e,d){console.log(d)}))
$.midi("Q49 MIDI 1", {index:0}).on('data', function(d, t){
 // console.log(d)
  var fq = $.teoria.note.fromMIDI(d[1]).fq()
  scale = $.westerns.upscale(fq, 'dorian', 8, 12).filter((e,i) => (i + 1) % 3 === 1 ? true : false)//.filter(Boolean)
//console.log(scale)
//  beep(fq, TIME, 0, 0, 0, scale)
  if(d[0] == 144)  beep(fq, TIME, 0,0,0,scale)//scale.forEach(function(e,i, x){ beep(e, TIME + 2/3 * (st.bpm / 60) * i, 0, 0, 0, scale)})

})

var bpm = st.bpm
timer = $.zerone(bpm, sampleRate)
generator = new $.chrono()
generator2 = new $.chrono()
var t12s = 1

var deep
//del = $.jdelay(Math.floor(st.bpm * $.sampleRate / 60 * 4), 2/3, 1)
delay = $.jdelay(Math.floor(_SAMPLERATE * st.bpm / 60 * 2 / 3), 4.5/10, 4/4)

function beep(fq, ti, b, off, swing, scale){
console.log(scale)
  var mfy = 1
  var amp = [[0,3/8],[0,1], [1,3/4]]
  var dec = [[0,3/4],[0,0], [1,0]]
  var r = Math.random()
  var iir = $.iir(2)
  var dur = [3/64, 64/64]

  var d = dur.reduce(function(a, e){ return a + e}, 0)
  var synth = function(t, s, i){
     var tone = $.gtone(t-ti, fq, $.amod(0, 12, t-ti, 12), $.amod(4, 2, t-ti,fq/8), Math.PI /2 , 5, $.ph.saw, $.amod(0, 0, t * st.bpm / 60, fq))  * $.winfunk.hann(t, fq)//.planckt(t, fq, 1/10 * $.oz.sine(t * st.bpm / 60, fq))
     return (((tone)))
  }
  generator2.set(ti, synth, {curves: [amp, dec], durations: dur})

}



snares = function(ti, b, off, swing){
  var mfy = 1
  var amp = [[0,0/8],[0,1], [1,3/4]].reverse()
  var dec = [[0,3/4],[0,0], [1,0]].reverse()
  var dur = [4/64, 22/64]
  if((b%2==0)) {dec = dec.reverse(); amp = amp.reverse();}// dur[1] = dur[1] + 12/64}
  if((b%8==4 || b%8==6)) {dur[1] = dur[1] + 22/64}

  var d = dur.reduce(function(a, e){ return a + e}, 0)
  var synth = function(t, s, i){
    var tt = t
     t = t - ti 
      var s = $.ph.sig(t, 64 * $.ph.sine(t, ($.sigmoid($.amod(6, 6, t, st.tu)) * 1/st.tu) * Math.random(), $.amod(0, -1/12, t, 1/128/2)), $.amod(-1/6, -1/9, t, 1/3))
     return s/2   
  }
  generator.set(ti, synth, {curves: [amp, dec], durations: dur})
}
//t0.emit('stop')
//t0 = timer.beat(1/3, [1], snares)
//t1 = timer.beat(3/2/2, [1,0,0,0,[,,,1],0,0,0], beep)

var music = function(t, s, i){
  timer.tick(t)
  return (generator2.tick(t, s, i)) //+  (del(generator2.tick(t, s, i), Math.floor($.amod(deep/10, -deep/10/3, t * st.bpm/60,0)), .5 + (.15 * $.sigmoid($.amod(6, 6, t * st.bpm /60, 3))), 1))
}

return function(t, s, i){
  TIME = t
  return  (music(t, s, i))
}
