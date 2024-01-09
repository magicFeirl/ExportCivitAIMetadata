// ==UserScript==
// @name         ExportCivitAIMetadata
// @namespace    https://github.com/magicFeirl/ExportCivitAIMetadata.git
// @description  导出 civitai.com 的 safetensors 模型元数据 / Export .safetensor file's metadata from civitAI
// @author       ctrn43062
// @match        https://civitai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=civitai.com
// @version      0.4
// @note         0.4 fix: 修改获取文件名逻辑
// @note         0.3 fix: 适配新版UI @gustproof
// @note         0.2 fix: 修复某些情况下复制按钮没有出现的bug
// @note         0.1 init
// @license      MIT
// ==/UserScript==

/**
* Usage:
* SafetensorsHeaderReader.readFromURL(url, [offset])
**/
class SafetensorsHeaderReader {
  static async getHeaderLengthFromURL(url, offset = 0) {
    const resp = await fetch(url, { headers: { range: 'bytes=0-7' } })

    try {
      const buffer = new BigUint64Array(await resp.arrayBuffer()).buffer
      return new DataView(buffer).getBigUint64(0, true) + offset
    } catch (error) {
      // backend error?
      console.log('Failed to get header length from backend:', error)
      return -1
    }

  }

  static async readFromURL(url, offset = 0) {
    if (!url) {
      return console.error('No model url')
    }

    const headerLength = await this.getHeaderLengthFromURL(url, BigInt(offset))

    if (headerLength <= 0) {
      return {
        error: 'Failed to get header length from civitai'
      }
    }

    const resp = await fetch(url, { headers: { range: `bytes=8-${headerLength}` } })
    const data = await resp.json()
    return data
  }
  // TODO: readHeader from file
}

function createCopyHeaderButton() {
  const icon = `<?xml version="1.0" ?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
    <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 8V7C10 6.05719 10 5.58579 10.2929 5.29289C10.5858 5 11.0572 5 12 5H17C17.9428 5 18.4142 5 18.7071 5.29289C19 5.58579 19 6.05719 19 7V12C19 12.9428 19 13.4142 18.7071 13.7071C18.4142 14 17.9428 14 17 14H16M7 19H12C12.9428 19 13.4142 19 13.7071 18.7071C14 18.4142 14 17.9428 14 17V12C14 11.0572 14 10.5858 13.7071 10.2929C13.4142 10 12.9428 10 12 10H7C6.05719 10 5.58579 10 5.29289 10.2929C5 10.5858 5 11.0572 5 12V17C5 17.9428 5 18.4142 5.29289 18.7071C5.58579 19 6.05719 19 7 19Z" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  // const downloadBtns = [...document.querySelectorAll('.mantine-Group-root a.mantine-UnstyledButton-root.mantine-Button-root[href^="/api"]')]
  // VAE or Model etc...
  // if(!downloadBtns.length || !downloadBtns.filter(a => a.href.)) {

  // }
  const downloadBtn = document.querySelector('a.mantine-1i0p07i[href^="/api"]')

  if (!downloadBtn) {
    // waiting for DOM loaded
    console.warn('can\'t find download button')
    return {}
  } else {
    console.log(downloadBtn, 'download button finded')
  }

  const buttonWrapper = downloadBtn.parentElement

  const btnCopy = buttonWrapper.lastChild.cloneNode(true)

  // btnCopy.firstChild.style.backgroundColor = '#868e96'
  btnCopy.setAttribute('id', 'CVI-copy-btn')
  btnCopy.setAttribute('title', 'Export model\'s metadata')

  const svg = btnCopy.querySelector('span.mantine-Button-label')
  svg.innerHTML = icon

  buttonWrapper.appendChild(btnCopy)

  return { header: buttonWrapper.parentElement, btn: btnCopy.firstChild }
}

function download(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => link.remove(), 0)
}

function downloadText(text, name) {
  const blob = new Blob([text])
  const url = URL.createObjectURL(blob)
  download(url, name)
  URL.revokeObjectURL(url)
}

function init() {
  // not model page
  if (!location.href.match(/civitai.com\/models\/\d+/)) {
    return;
  }

  // we have init the copy button
  if (document.querySelector('#CVI-copy-btn')) {
    return;
  }

  const { header = undefined, btn = undefined } = createCopyHeaderButton()

  if (!header || !btn) {
    return;
  }

  btn.onclick = () => {
    const isSafetensor = [...header.querySelectorAll('.mantine-Text-root')].map(el => el.textContent).some(text => text.toLowerCase() === 'safetensor')

    function stringifyObject(obj) {
      return JSON.stringify(obj, (_, v) => {
        if (typeof v === 'string') {
          try {
            return JSON.parse(v, null, 2)
          } catch {
            return v
          }
        }

        return v
      }, 2)
    }

    if (!isSafetensor) {
      alert('Not a .safetensors model')
      return;
    }

    const modelURLEl = header.querySelector('a[href^="/api"]')
    if (!modelURLEl) {
      return alert('can\'t find the download url')
    }

    const modelURL = modelURLEl.href
    const RANGE_OFFSET = 7

    const { pathname } = location
    // model title + model url id = filename
    // v0.4 get title from url path
    const title = location.pathname.slice(1).replace(/\//g, '_')
    // const path = pathname.substring(pathname.lastIndexOf('/') + 1)
    const filename = title + '_metadata.json'

    btn.setAttribute('disabled', true)
    SafetensorsHeaderReader.readFromURL(modelURL, RANGE_OFFSET).then((json) => {
      if (json['error']) {
        alert('error: ' + json['error'] + ', please try later.')
        return;
      }

      return json
    }).catch((error) => {
      alert('error: Network error:', error)
      console.error(error)
    }).then(json => {
      if (!json) {
        return
      }

      // 避免 undefined 或 null
      json.__metadata__ = json.__metadata__ || {}

      if (!Object.keys(json.__metadata__).length) {
        alert('This model has no metadata')
        return
      }
      // export __metadata__ to .txt file
      downloadText(stringifyObject(json.__metadata__), filename)
    }).finally(() => {
      btn.removeAttribute('disabled')
    })
  }
}

function initPageChangeObserver(callback, window) {
  const ob = new window.MutationObserver((mutationList) => {
    if (mutationList.some(record => record.type === 'childList')) {
      // model detail page
      if (/civitai\.com\/models\/\d+/.test(location.href)) {
        callback && callback()
      }
    }
  })

  ob.observe(window.document.querySelector('title'), { childList: true, subtree: true })

  return ob
}

function findCopyButton(init) {
  setTimeout(() => {
    if (!document.querySelector('#CVI-copy-btn')) {
      findCopyButton(init)
      init()
      console.log('find')
    }
  }, 50)
}

(function () {
  findCopyButton(init)

  // For SPA
  initPageChangeObserver(() => findCopyButton(init), unsafeWindow || window)
})();