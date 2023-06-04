class SafetensorsHeaderReader {
  // 不知道为什么 range 返回的 length 少 7 bytes 
  static RANGE_OFFSET = 7n

    static async getHeaderLengthFromURL(url) {
        const resp = await fetch(url, { headers: { range: 'bytes=0-7' } })
        const buffer = new BigUint64Array(await resp.arrayBuffer()).buffer
        return new DataView(buffer).getBigUint64(0, true) + SafetensorsHeaderReader.RANGE_OFFSET
    }

    static async readFromURL(url) {
        if (!url) {
            return console.error('No model url')    
        }

        const headerLength = await this.getHeaderLengthFromURL(url)
        const resp = await fetch(url, { headers: { range: `bytes=8-${headerLength}` } })
        const data = await resp.json()
        return data
    }
    // TODO: readHeader from file
}

class CopyHeaderBotton {
    static COPY_SVG = `<?xml version="1.0" ?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 8V7C10 6.05719 10 5.58579 10.2929 5.29289C10.5858 5 11.0572 5 12 5H17C17.9428 5 18.4142 5 18.7071 5.29289C19 5.58579 19 6.05719 19 7V12C19 12.9428 19 13.4142 18.7071 13.7071C18.4142 14 17.9428 14 17 14H16M7 19H12C12.9428 19 13.4142 19 13.7071 18.7071C14 18.4142 14 17.9428 14 17V12C14 11.0572 14 10.5858 13.7071 10.2929C13.4142 10 12.9428 10 12 10H7C6.05719 10 5.58579 10 5.29289 10.2929C5 10.5858 5 11.0572 5 12V17C5 17.9428 5 18.4142 5.29289 18.7071C5.58579 19 6.05719 19 7 19Z" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    static _LOADED = false

    static init() {
        if (CopyHeaderBotton._LOADED) {
            return;
        }

        const buttonWrapper = document.querySelector('.mantine-Group-root .mantine-Stack-root a[download]').parentElement.parentElement
        const btnCopy = buttonWrapper.lastChild.cloneNode(true)
        const modelURL = buttonWrapper.querySelector('a[download]').href

        const svg = btnCopy.querySelector('span.mantine-Button-label')
        svg.innerHTML = CopyHeaderBotton.COPY_SVG

        btnCopy.onclick = () => {
            SafetensorsHeaderReader.readFromURL(modelURL)
        }

        buttonWrapper.appendChild(btnCopy)

        CopyHeaderBotton._LOADED = true
    }
}

CopyHeaderBotton.init()

