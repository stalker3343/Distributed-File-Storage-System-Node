const fs = require("fs");
const zmq = require("zeromq");

// IP адрес и порт для отправки данных
// const targetIP = "ваш_адрес";
// const targetPort = "ваш_порт";

// Создаем сокет для отправки данных
const socket = zmq.socket("push");
// socket.connect(`tcp://${targetIP}:${targetPort}`);

socket.bindSync("tcp://*:5557");

// Функция для отправки чанков данных
function sendChunks(filePath) {
  const chunkSize = 20 * 1024; // 20KB
  let offset = 0;

  const readStream = fs.createReadStream(filePath, {
    highWaterMark: chunkSize,
  });

  readStream.on("data", (chunk) => {
    socket.send(chunk); // Отправляем чанк данных по ZeroMQ
    offset += chunk.length;
    console.log(`Sent ${offset} bytes`);
  });

  readStream.on("end", () => {
    console.log("File sent successfully.");
    socket.close();
  });

  readStream.on("error", (err) => {
    console.error("Error reading file:", err);
    socket.close();
  });
}

// Получаем путь к файлу из аргументов командной строки
const filePath = process.argv[2];

// Проверяем, передан ли путь к файлу
if (!filePath) {
  console.error("Usage: node program.js <file_path>");
  process.exit(1);
}

console.log("Press enter when the workers are ready...");
process.stdin.on("data", function () {
  // Запускаем отправку чанков данных
  sendChunks(filePath);

  // work();
  process.stdin.pause();
});
