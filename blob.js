var encoder = require('wav-encoder')
module.exports = function(buf, sampleRate, name, click, cb){
  var audioData = {
    sampleRate: sampleRate,
    channelData: [buf],
    bitDepth: 32, 
    floatingPoint: true,
  }
  
  encoder.encode(audioData).then(function(buf){

    var blob = new Blob([buf], {type: 'audio/wav'})

    var a = document.createElement('a')
    
    a.href = URL.createObjectURL(blob)
    
    a.download = name ? name  + '.wav' : 'untitled_track.wav'

    a.rel = a.name = buf.name || 'untitled-track.wav'
    
    a.innerText = a.rel
    
    if(click) {

      var ev = new CustomEvent('click')
      
      a.dispatchEvent(ev)

    }
    
    if(cb) cb(null, a)
    
  }, function(e){cb(e)})


}
