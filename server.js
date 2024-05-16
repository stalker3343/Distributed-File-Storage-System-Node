const http = require("http");
const fs = require("fs");
const path = require("path");
const { IncomingForm } = require("formidable");

const PORT = 5558;

let chunkCounter = 0;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/get-upload-url") {
    // Отправляем URL для загрузки файла
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ uploadUrl: "/upload-chunk" }));
  } else if (req.method === "POST" && req.url === "/upload-chunk") {
    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server Error");
        return;
      }

      const chunkFile = files.chunk;
      console.log("🚀 ~ form.parse ~ chunkFile:", chunkFile[0].filepath);
      const newPath = path.join(__dirname, `chunk_${chunkCounter}.bin`);
      const readStream = fs.createReadStream(chunkFile[0].filepath);
      const writeStream = fs.createWriteStream(newPath);

      readStream.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log(`Chunk saved to ${newPath}`);
        chunkCounter++;
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Chunk uploaded successfully");
      });

      writeStream.on("error", (err) => {
        console.error("File write error:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("File write error");
      });
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});
