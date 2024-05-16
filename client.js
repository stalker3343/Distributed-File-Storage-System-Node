const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const SERVER_HOST = "http://localhost";
const SERVER_PORT = 5558;
const CHUNK_SIZE = 20 * 1024; // 20KB

const FILE_PATH = process.argv[2];

if (!FILE_PATH) {
  console.error("Usage: node client.js <file_path>");
  process.exit(1);
}

if (!fs.existsSync(FILE_PATH)) {
  console.error(`File not found: ${FILE_PATH}`);
  process.exit(1);
}

async function getUploadUrl() {
  try {
    const response = await axios.get(
      `${SERVER_HOST}:${SERVER_PORT}/get-upload-url`
    );
    return response.data.uploadUrl;
  } catch (error) {
    console.error("Error getting upload URL:", error);
    process.exit(1);
  }
}

async function uploadChunk(uploadUrl, chunk, chunkIndex) {
  const form = new FormData();
  form.append("chunk", chunk, `chunk_${chunkIndex}.bin`);
  console.log(`${SERVER_HOST}:${SERVER_PORT}${uploadUrl}`);

  try {
    const response = await axios.post(
      `${SERVER_HOST}:${SERVER_PORT}${uploadUrl}`,
      form,
      {
        headers: form.getHeaders(),
      }
    );
    console.log(`Chunk ${chunkIndex} uploaded successfully:`, response.data);
  } catch (error) {
    // console.error(`Error uploading chunk ${chunkIndex}:`, error);
    process.exit(1);
  }
}

async function uploadFileInChunks(uploadUrl, filePath) {
  const fileStream = fs.createReadStream(filePath, {
    highWaterMark: CHUNK_SIZE,
  });
  let chunkIndex = 0;

  fileStream.on("data", async (chunk) => {
    fileStream.pause(); // Приостанавливаем поток пока не загрузим текущий чанк
    await uploadChunk(uploadUrl, chunk, chunkIndex);
    chunkIndex++;
    fileStream.resume(); // Возобновляем поток для следующего чанка
  });

  fileStream.on("end", () => {
    console.log("File transmission complete");
  });

  fileStream.on("error", (err) => {
    console.error("Error reading file:", err);
  });
}

(async () => {
  const uploadUrl = await getUploadUrl();
  await uploadFileInChunks(uploadUrl, FILE_PATH);
})();
