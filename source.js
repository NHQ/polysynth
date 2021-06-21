
module.exports = function(cb){
  if (typeof MediaStreamTrack === 'undefined' ||
      typeof navigator.mediaDevices.enumerateDevices === 'undefined') {
    alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
  } else {
    navigator.getUserMedia({audio:true, video:false}, function(){navigator.mediaDevices.enumerateDevices().then(cb)}, console.log)
  }
} 
