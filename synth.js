// Press play to start audio context
// Press record to start record, press again to stop
//   a link to download the recording will appear, this can be repeated
// Edit the code and press shift-enter to compile and change the sound live
// 
// @folkstack 

var sn = snare()
var bpm = 144
var tempo = bpm / 60
var qm = [10, 50, 100, 150].reverse()
var qmr = qm.reverse()
var dur = 192

return function (t, i) {
  t *= tempo
	if(t % dur < 96){
		t /= 2
    sn((t * 2 + .5) % 1/4)
    if(t%16>5 && (t % 16 < 4.2 || t % bpm * tempo < 8)){
      sn((t * 42*2*2*2*2*2 ) % 1/12)
    }
    if(t % 8 < 4.2) sn((t * 8) % 1/6)
    sn(t * 5 % 6)
    sn((t + .05) % 2)
    sn((t  * 2 + .05) % 4)
    var s = sn((t) % 1/4) * 2 / 3
    var d = 1/2
    var p = pluck((t * d + .5) % 1/d, 342, 1/(1/d), amod(14, Math.PI, t, tempo * 4 * 3/2)) * amod(1/16, 1/32, t, -1/16)
    return p + pluck((t + .5) % 1, amod(amod(47+20,(t%8>2?100:10),t + .5,1/2) , 44, t, 1/4), 5, 10) + s;
  }
	else if(t % dur > 96 && t % dur < 152){
		t /= 2
//    sn(((t * 42/2/2/2/2/2) % 1/2))
    var s = sn((t/8) % 1/4)
    var d = 1/4/2
    var p =  pluck((t*4) % 1, amod(amod(47+20,(t%8<2?100:10),t,1/6) , 44, t, 1/12), 5, 1/2)
    return (s * 2 / 3) + p + pluck((t * d) % 1/d, qmr[Math.floor(t/2%qmr.length)], 1/(1/d), amod(14, 7, t, 3/2 * tempo)) / 4
  }
  else {
		t/=2
//    sn((t  + .05) % 2)
//    if(t % bpm * tempo < 120 * tempo) (sn((t / 4) % 1 % 1/16) && sn((t * 8) % 1/4)) 
    if(t % dur > 184) (sn((t * 16) % 1/2))
//    if(t % bpm * tempo > 120 * tempo && t % 16 > 12) (sn((t / 4) % 1 % 1/16))
			sn((t * 16) % 3/4)
//			sn((t/8) % 1/8)
    var s = sn((t/8) % 1/4) * 3 / 3
    var d = 1/8
    var p = pluck((t * d + .5) % 1/d, qm[Math.floor(t/2%qm.length)], 1/(1/d), amod(14, 7, t, 3/2 * tempo)) / 4
    var pp = pluck((t + .5) % 1, amod(amod(0,(qm[Math.floor(t/2%qm.length)]),t, 3/2 * tempo), 44, t, 1/8 * tempo), 5, 1)*2 * 2
    return s + pp + p;
  }
}

function amod (c, r, t, f){
  return (c + (r * Math.sin(Math.PI * 2 * t * f)))
}

function pluck (t, freq, duration, steps) {
    freq /= tempo
    var n = duration;
    var scalar = Math.max(0, 0.95 - (t * n) / ((t * n) + 1));
    var sum = 0;
    for (var i = 0; i < steps; i++) {
        sum += Math.sin(2 * Math.PI * t * (freq + i * freq));
    }
    return (scalar * sum / 6) * amod(2, 2, t, 1/12 * freq);
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
