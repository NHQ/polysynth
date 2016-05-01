var st = $ui({
  b: {type: 'dial', value: 4, step: 1/8, mag: 12},
  bpm: {type: 'dial', value: 88, step: 1/4, mag: 32},
  mod: {type: 'dial', value: 6, step: 1/4, mag: 32},
  mod2: {type: 'dial', value: 3, step: 1/4, mag: 32},
  xy: {type: 'xy', range: [-1,-1,1,1], value: [1/2,1/2]}

})

var sn = snare()
var sn1 = snare()
var wavez = ['square', 'triangle', 'saw', 'saw']
console.log(st)

d = $.jdelay(12,0,0)
d1 = $.jdelay(12,0,0)
d2 = $.jdelay(12,0,0)

return function(t, s, i){
  t *= st.bpm / 60
  return (d2(d1(d(i * 2 + $.oz.square(t, 0) * ((1 - $.oz.saw(t, 6)) * 0 ), Math.floor(sampleRate * st.bpm / 60 * st.b), st.xy[0], st.xy[1]), Math.floor(sampleRate * st.bpm / 60 * st.mod * st.b), st.xy[0], st.xy[1]), Math.floor(sampleRate * st.bpm / 60 * st.mod2 * st.b), st.xy[0], st.xy[1]))
* $.amod(.33, .25, t, st.bpm / 60 * st.b)
  var w = st.wavez
  var l = wavez.length 
  t = t % 2
  t += 2
  t += st.bpm / 60
  var s = sn1(t * 4 % 7/5) * 8
  sn(t / 5 % 1)
  s += sn(t / 6 % 1)
  return (s * 3) + $.oz.sine(t, $.oz.sine(t, $.oz.triangle(t, $.amod(12, st.z, t, 1/st.z)) * $.amod(.5, .5, t, st.t[0] / st.t[1]))) 
* (1 - $.oz.saw(t, 4))
 + $.oz[wavez[w%l]](t, $.oz[wavez[(w+1)%l]](t, $.oz[wavez[(w+2)%l]](t * 3 / 2 * 2 * 2 * 2, 31*1/Math.pow(2, st.d)))) * (1 - $.oz[wavez[(w+3)%1]](t * 3 / 2, 1/7/3/2*7))  
}

function snare () {
  var low0 = lowpass(30);
  var low1 = lowpass(80);
  var low2 = lowpass(20);
  return function (t) {
    return low0(snare(180, t))*5
      + low1(snare(40, t+1/60))*10
      + low2(snare(80, t+1/30))*5
    ;
    function snare (n, o) {
      var scalar = Math.max(0, 0.95 - (o * n) / ((o * n) + 1));
      return sin(sin(sin(137)*139)*4217) * scalar;
    }
    function sin (x) { return Math.sin(2 * Math.PI * t * x) }
  };
  function lowpass (n) {
    var value = 0;
    return function (x) { return value += (x - value) / n }
  }
}
