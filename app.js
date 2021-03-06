var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var chat = ["", "", "", "", "", "", "", "", "", ""];

app.set("view engine", "ejs");
app.use(bodyParser.json());
mongoose.connect(process.env.ENDERCHAT_DB, {useMongoClient: true });
var db = mongoose.connection;
db.once("open", function() {
  console.log("> DataBase connected!");
});
db.on("error", function(err) {
  console.log("> DataBase Error");
  console.log(err);
});

var dataSchema = mongoose.Schema({
  name:{type:String},
  count:{type:Number},
  val:{type:String},
  lines:{type:Number}
});
var Data = mongoose.model('data', dataSchema);
Data.findOne({name:"enderChat"}, function(err, data) {
  if(err) {
    console.log("! Data Error");
    console.log(err);
  }
  if(!data) {
    Data.create({name:"enderChat", count:1, val:"", lines:0}, function (err, data) {
      if(err) {
        console.log("! Data creating Error");
        console.log(err);
      }
      console.log("> Counter initialized");
      console.log(data);
    });
  }
});

app.get('/', function(req, res) {
  res.sendfile("disconnected.html");
  /*
  Data.findOne({name:"enderChat"}, function(err, data) {
    if(err) return console.log("! Data Error\n" + err);
    data.save(function(err) {
      if(err) return console.log("! Data Error\n" + err);
    });
  });*/
});

app.get('/del', function(req, res) {
  Data.findOne({name:"enderChat"}, function(err, data) {
    if(err) return console.log("! Data Error\n" + err);
    data.count=1;
    data.val="";
    data.lines=0;
    data.save(function(err) {
      if(err) return console.log("! Data Error\n" + err);
    });
  });
  console.log('> Chat deleted!');
  res.sendfile("client.html");
  io.emit('del');
  for (var i = 0; i < 10; i++) {
    chat[i] = "";
  }
    res.sendfile("client.html");
});

io.on('connection', function(socket){
  res.sendfile("client.html");
  console.log('> user connected: ', socket.id);
  var name;
  Data.findOne({name:"enderChat"}, function(err, data) {
    if(err) return console.log("! Data Error\n" + err);
    name = "user" + data.count++;
    io.to(socket.id).emit('change name', name);
    io.to(socket.id).emit('start', data.val, chat[0]);
    data.save(function(err) {
      if(err) return console.log("! Data Error\n" + err);
    });/*
    for (var i = 0; i < 10; i++) {
      io.to(socket.id).emit('change chat', i, chat[i]);
    }*/
  });

  socket.on('disconnect', function(){
    console.log('> user disconnected: ', socket.id);
  });

  socket.on('send message', function(name,text){
    var name2 = name;
    if (name) {} else name2 = "unnamed user";
    var msg = 'From ' + name2 + ' to Everyone : ' + text;
    console.log("> " + msg);
    Data.findOne({name:"enderChat"}, function(err, data) {
      if(err) return console.log("! Data Error\n" + err);
      io.emit('receive message', data.val, name, text);
      data.val = data.val + msg + "\n";
      data.lines++;
      data.save(function(err) {
        if(err) return console.log("! Data Error\n" + err);
      });
    });
    for (var i = 0; i < 9; i++) {
      chat[i + 1] = chat[i];
    }
    chat[0] = text;
    for (var j = 0; j < 10; j++) {
      io.emit('change chat', j, chat[j]);
    }
  });
});

var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('> Server on!');
});
