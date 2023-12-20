const socket = io("ws://localhost:4000");

const myModal = new bootstrap.Modal(document.getElementById("registerUser"), {
  backdrop: true,
  focus: true,
});

const registerBtn = document.getElementById("registerBtn")
const nameInput = document.getElementById("nameInput")
const usernameInput = document.getElementById("usernameInput")
const userList = document.getElementById("usersList");
const selectedUser = document.getElementById("selectedUser");
const chat = document.getElementById("chat");
const sendBtn = document.getElementById("sendBtn");
const messageInp = document.getElementById("messageInp");


window.addEventListener("load", () => {
  if(localStorage.getItem("userId")) return;
  myModal.show();
  registerBtn.addEventListener("click", () => {
    if(!nameInput.value || !usernameInput.value) {
      return alert("add name and username");
    }
    socket.emit("register", {
      name: nameInput.value,
      username: usernameInput.value
    })
    myModal.hide();
    socket.on("registerError", data => {
      alert(data);
      myModal.show();
    })
  })
});

socket.on("loggedInUser",(data) => {
  const {userId,socketId,username} = data;
  localStorage.setItem("userId",userId);
  localStorage.setItem("socketId",socketId);
  localStorage.setItem("username",username);
})
socket.on("users",(data) => {
  displayUsers(data);
})

sendBtn.addEventListener("click", () => {
  const message = {
    sender: localStorage.getItem("userId"),
    receiver: selectedUser.getAttribute("userId"),
    text: messageInp.value
  };
  socket.emit("sendMessage",message);
})
socket.on("chat", (data) => {
  displayMessages(data.messages);
})

function clearInner(node) {
  while (node.hasChildNodes()) {
    clear(node.firstChild);
  }
}

function clear(node) {
  while (node.hasChildNodes()) {
    clear(node.firstChild);
  }
  node.parentNode.removeChild(node);
}



chat.style.maxHeight = "500px"
chat.style.overflowY = "scroll"
const displayUsers = (users) => {
  users.forEach((e) => {
    const checkPresent = document.querySelector(`[userId="${e.userId}"]`);
    if (checkPresent) {
      checkPresent.setAttribute("socketId", e.socketId);
      return;
    }
    const p = document.createElement("p");
    p.innerText = e.name;
    p.setAttribute("userId", e.userId);
    p.setAttribute("socketId", e.socketId);
    p.setAttribute("username", e.username);
    const classes =
      "border-bottom shadow p-3 mb-2 bg-body-tertiary rounded text-body";
    classes.split(" ").forEach((e) => p.classList.add(e));
    userList.appendChild(p);
    p.addEventListener("click", () => {
      selectedUser.innerText = e.name;
      selectedUser.setAttribute("userId", e.userId);
      selectedUser.setAttribute("socketId", e.socketId);
      selectedUser.setAttribute("username", e.username);
      const classes =
        "border-bottom shadow-sm text-center p-3 mb-2 bg-body-tertiary rounded text-primary";
      classes.split(" ").forEach((e) => selectedUser.classList.add(e));
      socket.emit("selectUser", {
        u1: localStorage.getItem("userId"),
        u2: e.userId
      });
      socket.on("selectedChat",data => displayMessages(data.messages))
    });
  });
};

const displayMessages = (messages) => {
  clearInner(chat);
  messages.forEach((e) => {
    const currentDate = new Date().getTime();
    const messageDate = new Date(e.createdAt).getTime();
    const diff = currentDate - messageDate;
    let dateStr = "";
    if (59000 > diff) dateStr = parseInt(diff / 1000) + " secs ago";
    else if (59 * 60000 > diff) dateStr = parseInt(diff / 60000) + " mins ago";
    else if (23 * 3600000 > diff)
      dateStr = parseInt(diff / 3600000) + " hrs ago";
    else dateStr = parseInt(diff / (24 * 3600000)) + " days ago";
    console.log(dateStr);
    const checkPresent = document.querySelector(`[messageId="${e.id}"]`);
    if (checkPresent) {
      checkPresent.childNodes[1].innerText = dateStr;
      return;
    }
    const sender = localStorage.getItem("userId") == e.sender; // T - R , F - L
    const div = document.createElement("div");
    const textPara = document.createElement("p");
    const textDate = document.createElement("p");
    div.classList.add(sender ? "float-end" : "float-start");
    div.style.clear = "both";
    const paraClasses = `${sender ? "bg-success-subtle" : "bg-secondary-subtle"} shadow-sm text-center fs-5 p-0 mb-0 bg-body-tertiary rounded text-black`;
    const dateClasses = "text-end fs-6 p-0 mb-0 text-info";
    paraClasses.split(" ").forEach(e => textPara.classList.add(e));
    dateClasses.split(" ").forEach(e => textDate.classList.add(e));
    div.appendChild(textPara);
    div.appendChild(textDate);
    textPara.innerText = e.text;
    textDate.innerText = dateStr;
    div.setAttribute("messageId",e.messageId);
    chat.appendChild(div);
  });
};


socket.on("disconnect", (reason, details) => {
  localStorage.clear();
  window.location.reload();
});