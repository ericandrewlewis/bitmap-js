var fs = require('fs')

function encode(unencoded, width, height) {
  const colorValuesPerRow = unencoded.length / height
  const padding = 4 - (colorValuesPerRow % 4)
  const unencodedRowLength = colorValuesPerRow
  const encodedRowLength = colorValuesPerRow + padding
  const encoded = Buffer.alloc(encodedRowLength * height)
  for (let i = 0; i < height; i++) {
    unencoded.copy(
      encoded,
      encodedRowLength * i,
      unencodedRowLength * i,
      unencodedRowLength * i + unencodedRowLength
    )
  }
  return encoded
}

function createBitmapFile(file, bitmap, width, height) {
  return new Promise((resolve, reject) => {
    const filesize = 54 + bitmap.length
    let fileContent = Buffer.alloc(filesize)
    fileContent.write('B', 0)
    fileContent.write('M', 1)
    fileContent.writeInt32LE(filesize, 2)
    fileContent.writeInt32LE(0x00000000, 6)
    fileContent.writeInt32LE(54, 10)
    fileContent.writeInt32LE(40, 14)
    fileContent.writeInt32LE(width, 18)
    fileContent.writeInt32LE(height, 22)
    fileContent.writeInt16LE(1, 26)
    fileContent.writeInt16LE(24, 28)
    fileContent.writeInt32LE(0, 30)
    fileContent.writeInt32LE(bitmap.length, 34)
    fileContent.writeInt32LE(2835, 38)
    fileContent.writeInt32LE(2835, 42)
    fileContent.writeInt32LE(0, 46)
    fileContent.writeInt32LE(0, 50)
    bitmap.copy(fileContent, 54)

    fs.writeFile(file, fileContent, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function readBitmapFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, filedata) => {
      if (err) return reject(err)
      const pixelDataLength = filedata.length - 54
      const pixelData = Buffer.alloc(pixelDataLength)
      filedata.copy(pixelData, 0, 54)
      resolve({
        data: pixelData
      })
    })
  })
}

module.exports = {
  encode,
  createBitmapFile,
  readBitmapFile
}
