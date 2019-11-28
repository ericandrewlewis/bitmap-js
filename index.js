const fs = require("fs");

function padImageData({ unpaddedImageData, width, height }) {
  const colorValuesPerRow = unpaddedImageData.length / height;
  const padding = 4 - colorValuesPerRow % 4;
  const unpaddedRowLength = colorValuesPerRow;
  const paddedRowLength = colorValuesPerRow + padding;
  const padded = Buffer.alloc(paddedRowLength * height);
  for (let i = 0; i < height; i++) {
    unpaddedImageData.copy(
      padded,
      paddedRowLength * i,
      unpaddedRowLength * i,
      unpaddedRowLength * i + unpaddedRowLength
    );
  }
  return padded;
}

function bitmapFileHeader({
  filesize = 0,
  applicationHeader = 0,
  imageDataOffset = 0
}) {
  const buffer = Buffer.alloc(14);
  // A bitmap file starts with a "BM" in ASCII.
  buffer.write("B", 0);
  buffer.write("M", 1);
  // The entire filesize.
  buffer.writeInt32LE(filesize, 2);
  // 4 bytes reserved for the application creating the image.
  buffer.writeInt32LE(applicationHeader, 6);
  // The byte offset to access the pixel data.
  buffer.writeInt32LE(imageDataOffset, 10);
  return buffer;
}

// Creates a DIB header, specifically a BITMAPINFOHEADER type
// since it's the most widely supported.
function dibHeader({
  width,
  height,
  bitsPerPixel,
  bitmapDataSize,
  numberOfColorsInPalette
}) {
  const buffer = Buffer.alloc(40);
  // The size of the header.
  buffer.writeInt32LE(40, 0);
  // The width and height of the bitmap image.
  buffer.writeInt32LE(width, 4);
  buffer.writeInt32LE(height, 8);
  // The number of color planes, which in bitmap files is always 1
  buffer.writeInt16LE(1, 12);
  buffer.writeInt16LE(bitsPerPixel, 14);

  // Compression method, not supported in this package.
  buffer.writeInt32LE(0, 16);
  buffer.writeInt32LE(bitmapDataSize, 20);
  // The horizontal and vertical resolution of the image.
  // On monitors: 72 DPI × 39.3701 inches per metre yields 2834.6472
  buffer.writeInt32LE(2835, 24);
  buffer.writeInt32LE(2835, 28);
  // Number of colors in the palette.
  buffer.writeInt32LE(numberOfColorsInPalette, 32);
  // Number of important colors used.
  buffer.writeInt32LE(0, 36);
  return buffer;
}

function createBitmapBuffer({
  imageData,
  width,
  height,
  bitsPerPixel,
  colorTable = Buffer.alloc(0)
}) {
    const imageDataOffset = 54 + colorTable.length;
    const filesize = imageDataOffset + imageData.length;
    let fileContent = Buffer.alloc(filesize);
    let fileHeader = bitmapFileHeader({
      filesize,
      imageDataOffset
    });
    fileHeader.copy(fileContent);
    dibHeader({
      width,
      height,
      bitsPerPixel,
      bitmapDataSize: imageData.length,
      numberOfColorsInPalette: colorTable.length / 4
    }).copy(fileContent, 14);

    colorTable.copy(fileContent, 54);

    imageData.copy(fileContent, imageDataOffset);

    return fileContent;
}

function createBitmapFile({
  filename,
  imageData,
  width,
  height,
  bitsPerPixel,
  colorTable = Buffer.alloc(0)
}) {
  return new Promise((resolve, reject) => {

    let fileContent = createBitmapBuffer({
      imageData,
      width,
      height,
      bitsPerPixel,
      colorTable
    });

    fs.writeFile(filename, fileContent, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function readBitmapFileHeader(filedata) {
  return {
    filesize: filedata.readInt32LE(2),
    imageDataOffset: filedata.readInt32LE(10)
  };
}

const dibHeaderLengthToVersionMap = {
  12: "BITMAPCOREHEADER",
  16: "OS22XBITMAPHEADER",
  40: "BITMAPINFOHEADER",
  52: "BITMAPV2INFOHEADER",
  56: "BITMAPV3INFOHEADER",
  64: "OS22XBITMAPHEADER",
  108: "BITMAPV4HEADER",
  124: "BITMAPV5HEADER"
};

function readDibHeader(filedata) {
  const dibHeaderLength = filedata.readInt32LE(14);
  const header = {};
  header.headerLength = dibHeaderLength;
  header.headerType = dibHeaderLengthToVersionMap[dibHeaderLength];
  header.width = filedata.readInt32LE(18);
  header.height = filedata.readInt32LE(22);
  if (header.headerType == "BITMAPCOREHEADER") {
    return header;
  }
  header.bitsPerPixel = filedata.readInt16LE(28);
  header.compressionType = filedata.readInt32LE(30);
  if (header.headerType == "OS22XBITMAPHEADER") {
    return header;
  }
  header.bitmapDataSize = filedata.readInt32LE(34);
  header.numberOfColorsInPalette = filedata.readInt32LE(46);
  header.numberOfImportantColors = filedata.readInt32LE(50);
  if (header.headerType == "BITMAPINFOHEADER") {
    return header;
  }
  // There are more data fields in later versions of the dib header.
  // I hear that BITMAPINFOHEADER is the most widely supported
  // header type, so I'm not going to implement them yet.
  return header;
}

function readColorTable(filedata) {
  const dibHeader = readDibHeader(filedata);
  const colorTable = Buffer.alloc(dibHeader.numberOfColorsInPalette * 4);
  const sourceStart = 14 + dibHeader.headerLength;
  filedata.copy(colorTable, 0, 54, 54 + colorTable.length);
  return colorTable;
}

function readBitmapFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, filedata) => {
      if (err) return reject(err);
      const fileHeader = readBitmapFileHeader(filedata);
      const dibHeader = readDibHeader(filedata);
      const imageDataLength = dibHeader.bitmapDataSize;
      const imageDataOffset = fileHeader.imageDataOffset;
      const imageData = Buffer.alloc(imageDataLength);
      const colorTable = readColorTable(filedata);
      filedata.copy(imageData, 0, imageDataOffset);
      resolve({
        fileHeader,
        dibHeader,
        imageData,
        colorTable
      });
    });
  });
}

module.exports = {
  padImageData,
  bitmapFileHeader,
  readBitmapFileHeader,
  readDibHeader,
  dibHeader,
  createBitmapBuffer,
  createBitmapFile,
  readBitmapFile,
  readColorTable
};
