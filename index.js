/*
 * Copyright (c) 2021. UAVenture AG. All rights reserved.
 */

let dgram = require('dgram');

const mavlib = require('mavlink-lib');

const express = require('express');
const http = require('http');
const { Server } = require(`socket.io`);

const HTTP_PORT = process.env.HTTP_PORT || 81;

// On Balena replace the IP with: copilot
const COPILOT_IP = process.env.COPILOT_IP || 'copilot';
const COPILOT_PORT = process.env.COPILOT_PORT || 44000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let udpClient = dgram.createSocket('udp4');

// Capture kill signal and clean up.
process.on('SIGINT', () => {
  console.log('Closing port');

  if (udpClient) {
    udpClient.close();
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
});

/*****************************************************
 * Webserver
 *****************************************************/

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

server.listen(HTTP_PORT, function() {
  console.log("server is listening on port", HTTP_PORT);
});

/*****************************************************
 * MAVLink
 *****************************************************/
let mav = new mavlib.MavlinkLib(240, 1, null);

mav.on('message', function(message) {
  //console.log(`Message: ${message.name}`);
  io.emit('msg', { name: message.name });
});

const heartbeatInterval = setInterval(function () {
  sendHeartbeat();
}, 1000);

function sendHeartbeat() {
  const heartbeat = new mavlib.messages.heartbeat(
    type = mavlib.mavlink.MAV_TYPE_ONBOARD_CONTROLLER,
    autopilot = mavlib.mavlink.MAV_AUTOPILOT_AIRRAILS,
    base_mode = 64,
    custom_mode = 0,
    system_status = mavlib.mavlink.MAV_STATE_ACTIVE,
    mavlink_version = mavlib.mavlink.WIRE_PROTOCOL_VERSION
  );

  const bytes = new Buffer(heartbeat.pack(mav));

  sendMessage(bytes);
}

/*****************************************************
 * UDP
 *****************************************************/
udpClient.on('message', (data, rinfo) => {
  if (mav) {
    mav.parseData(data);
  }
});

udpClient.on('error', (err) => {
  console.log('MAVLink: client error: ' + err);
  udpClient.close();
});

function sendMessage(bytes) {
  if (udpClient) {
    udpClient.send(bytes, 0, bytes.length, COPILOT_PORT, COPILOT_IP, function (err, bytes) {
      if (err) console.error('MAVLink: UDP Send error: ' + err);
    });
  }
}
