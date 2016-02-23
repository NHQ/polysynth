var reqmic = require('jsynth-mic')

module.exports = function(master, cb){
  var mic = reqmic(master)

  mic.on('node', function(node){
    cb(null, node)
  })
}
