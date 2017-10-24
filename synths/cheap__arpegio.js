//$ = require('../polysynth/cheatcode')
scale = $.westerns.upscale(440, 'ionian', 6, 12).concat($.westerns.downscale(440, 'ionian', 6, 12))
fun = arp(1 * 72/60, scale)
iir = $.iir(2);
ti = 0
 fq = scale[0];
       tc = [[0,0],[0,1], [1, .787]];
       td = [[0,.787],[0,.333], [1, .33333]]//.reverse();

 tr = [[0,.3333],[1/3, 1/3], [2/3, 1/6],[1,0]]//.reverse();
       d = [1/32, 3/32, 8/32];
       l = d.reduce(function(a,e){return a+e},0);
       tembre = $.env([tc, td, tr], d);
       p = {};
      p.c = Math.PI/2;
      p.m =  1/3/2/2/2;
      p.i = 2;
      p.f = fq ;
      p.wave = 'tri';
      bell = $.meffisto(p);
      start = ti ;
//      del = $.jdelay(Math.floor(72 * 48000 / 60 * 4), 1/8, .5);

return function(t, m){
  t*=72/60
  var g = fun(bell, t, tembre, l, 2)
  return g * $.sigmod(.75, .25, t, 5)
}

function arp(int, mel){
  return function(vox, t, env, l, b){
     var s = 0, x = 0, i = int
     for(x = 0; x < mel.length; x++){
        vox.f = mel[x]
        s += vox.ring(t-i) * env((t-i)%(l*b))
        i+=int
     }
    return s
  }
}
