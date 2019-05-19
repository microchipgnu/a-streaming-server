const NodeMediaServer = require('node-media-server')
const config = require('./config')

const params = {
  rtmp: {
    port: config.rtmp_port,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: config.http_port,
    allow_origin: '*'
  }
}

var nms = new NodeMediaServer(params)
nms.run()