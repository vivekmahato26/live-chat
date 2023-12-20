const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { v4: uuid } = require("uuid");
const app = express();

app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: "*",
});

const users = [];
const chats = [];
io.on("connection", (socket) => {
  io.emit("users", users);
  socket.on("register", (userData) => {
    const checkUser = users.find((e) => e.username == userData.username);
    if (checkUser) {
      socket.emit("registerError", "select different username");
      return;
    }
    const id = "user_" + uuid().split("-").join("");
    const user = {
      userId: id,
      name: userData.name,
      username: userData.username,
      messages: [],
      socketId: socket.id,
    };
    users.push(user);
    io.to(socket.id).emit("loggedInUser", user);
    io.emit("users", users);
  });

  socket.on("sendMessage", (data) => {
    const message = {
      id: "message_" + uuid().split("-").join(""),
      sender: data.sender,
      receiver: data.receiver,
      createdAt: new Date(),
      text: data.text,
    };
    const findChatIndex = chats.findIndex((e) => {
      // e.id == data.chatId
      const senderCheck = e.users.find((usr) => usr == data.sender);
      const receiverCheck = e.users.find((usr) => usr == data.receiver);
      return senderCheck && receiverCheck ? true : false;
    });

    if (findChatIndex >= 0) {
      chats[findChatIndex].messages.push(message);
    } else {
      chats.push({
        id: "chat_" + uuid().split("-").join(""),
        users: [data.sender, data.receiver],
        messages: [message],
      });
    }
    const receiverUser = users.find((e) => e.userId == data.receiver);
    const resChat =
      findChatIndex >= 0 ? chats[findChatIndex] : chats[chats.length - 1];
    io.to(receiverUser.socketId).emit("chat", resChat);
    io.to(socket.id).emit("chat", resChat);
  });

  socket.on("selectUser", ({ u1, u2 }) => {
    const findChatIndex = chats.findIndex((e) => {
      // e.id == data.chatId
      const senderCheck = e.users.find((user) => user == u1);
      const receiverCheck = e.users.find((user) => user != u2);
      return senderCheck && receiverCheck ? true : false;
    });
    io.emit("selectedChat", findChatIndex >= 0 ? chats[findChatIndex] : []);
  });
});

httpServer.listen(4000);
