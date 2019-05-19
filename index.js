const child_process = require('child_process')
const express = require('express')
const WebSocketServer = require('ws').Server
const http = require('http')
const config = require('./config')

const app = express()
const server = http.createServer(app).listen(config.encoding_port, () => {
	console.log(`Started Encoding Server on localhost:${config.encoding_port}`)
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  let match
  const url_regex = req.url.match(/^\/rtmp\/([a-zA-Z]+)\/(.*)$/)

  if ( !(match = url_regex) ) {
    ws.terminate() // No match, reject the connection.
    return
  }

  const service = match[1]
  if(! (service in config.services)){
	  ws.terminate()
	  return
  }
  
  const rtmpUrl = decodeURIComponent(match[2])
  console.log('Target RTMP URL:', rtmpUrl)
  
  const ffmpeg = child_process.spawn('ffmpeg', [
    '-f', 'lavfi', '-i', 'anullsrc',
    '-i', '-',
    '-shortest',
    '-vcodec', 'libx264',
    '-acodec', 'aac',
	'-f', 'flv',
    rtmpUrl 
  ])
  
  ffmpeg.on('close', (code, signal) => {
    console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal)
    ws.terminate()
  })
  
  ffmpeg.stdin.on('error', (e) => {
    console.log('FFmpeg STDIN Error', e)
  })
  
  ffmpeg.stderr.on('data', (data) => {
    console.log('FFmpeg STDERR:', data.toString())
  })

  ws.on('message', (msg) => {
    console.log('DATA', msg)
    ffmpeg.stdin.write(msg)
  })
  
  ws.on('close', (e) => {
    ffmpeg.kill('SIGINT')
  })
})