var st = {
  bpm:  69,
  mfy: 6,
  tu: 3
}

//var $ = require('./cheatcode')
sampleRate = 44800
bpm = st.bpm
timer = $.zerone(bpm, sampleRate)
generator = new $.chrono()
generator2 = new $.chrono()
var t12s = 1
var deep
var del = $.jdelay(deep = Math.floor(st.bpm * sampleRate / 60 * 4 * 10), 2/3, 1)

var beep = function(ti, b, off, swing){
//  if(b<4)return
  var mfy = 1
  var amp = [[0,0/8],[0,1], [1,3/4]]
  var dec = [[0,3/4],[0,0], [1,0]]
  var r = Math.random()
  var iir = $.iir(2)
  var dur = [1/64, 72/64 + r/2]
  var dd, delay = $.jdelay(Math.floor(dd = st.bpm * sampleRate / 60 / (b % 6)), 2/3, 1)


  var d = dur.reduce(function(a, e){ return a + e}, 0)
  var synth = function(t, s, i){
     var tt = t
     t = t - ti 
     var tone = $.gtone(t, 666, $.amod(0, 2, tt, d/6), Math.sqrt(7), 3/4 + (1/3 * $.oz.sig(t, d*4)), 17, $.ph.sine, $.amod(-1/2, -1/2, t, 1/d*4))
     return iir(delay(tone))
  }
  //generator2.set(ti, synth, {curves: [amp, dec], durations: dur})

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
t0 = timer.beat(1/3, [1], snares)
//t1 = timer.beat(3/2/2, [1,0,0,0,[,,,1],0,0,0], beep)

var music = function(t, s, i){
  timer.tick(t)
  return (generator.tick(t, s, i)) + (del(generator2.tick(t, s, i), Math.floor($.amod(deep/10, -deep/10/3, t * st.bpm/60,0)), .5 + (.5 * $.sigmoid($.amod(6, 6, t * st.bpm /60, 3))), 1))
}

return function(t, s, i){
  return (music(t, s, i))
}
