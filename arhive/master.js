const fs = require("fs");
const zmq = require("zeromq");

// Создаем сокет для принятия данных
const socket = zmq.socket("pull");
// socket.bindSync(`tcp://${listenIP}:${listenPort}`);
socket.connect("tcp://localhost:5558");
let chankCount = 0;
// Функция для принятия данных и сохранения в файл
function receiveFile() {
  let totalBytes = 0;
  const chunks = [];

  socket.on("message", (chunk) => {
    chunks.push(chunk);
    totalBytes += chunk.length;
    console.log(`Received ${chunk.length} bytes`);
    console.log("🚀 ~ socket.on ~ totalBytes:", totalBytes);

    // Проверяем, получены ли все чанки
    // if (totalBytes === expectedFileSize) {
    const filePath = `chank.${chankCount}.txt`; // Генерируем имя файла
    chankCount++;
    const buffer = Buffer.concat(chunks); // Объединяем все чанки в один буфер
    fs.writeFile(filePath, chunk, (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log(`File saved as ${filePath}`);
        // После сохранения файла снова ожидаем новый файл
        receiveFile();
      }
    });
    // }
  });
}

// Получаем размер файла и его расширение
const expectedFileSize = parseInt(process.argv[2]);
const fileExtension = process.argv[3];

// Проверяем, переданы ли размер файла и его расширение
if (!expectedFileSize || !fileExtension) {
  console.error("Usage: node client.js <file_size> <file_extension>");
  process.exit(1);
}

// Запускаем принятие данных
receiveFile();
