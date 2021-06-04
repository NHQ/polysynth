var {Clock, Event} = require('./default.js')

clock = new Clock(10)
clock.beats = [1, [{g: 8/5},['two',3]],0,[{four: 4},0,0,5]]
clock.trigger(function(event){ console.log(event)})
clock.trigger(new Event)


for(x = 0; x < clock.sr*clock._beats.length*2; x++) clock.tick()

