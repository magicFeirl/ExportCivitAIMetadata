class SafetensorReader {
  static async readLengthFromURL(url) {
    const resp = await fetch(url, {
      headers: {
        range: "bytes=0-7"
      },
      cors: "cors"
    })

    return new DataView(await resp.arrayBuffer()).getBigUint64(0, true)
  }

  static async readMetadataFromURL(url) {
    const metaLength = await SafetensorReader.readLengthFromURL(url)
    const resp = await fetch(url, {
      headers: {
        range: `bytes=8-${metaLength + 7n}`
      }
    })

    return await resp.json()
  }
}