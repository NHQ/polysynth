var Clock = require('./default.js')

clock = new Clock(10)
clock.beats = [1, [{g: 8/5},[2,3]],0,[4,0,0,5]]
for(x = 0; x < clock.sr*clock._beats.length*2; x++) clock.tick()

