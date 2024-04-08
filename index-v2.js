// ==UserScript==
// @name         ExportCivitAIMetadata
// @namespace    https://github.com/magicFeirl/ExportCivitAIMetadata.git
// @description  导出 civitai.com 的 safetensors 模型元数据 / Export .safetensor file's metadata from civitAI
// @author       ctrn43062
// @match        https://civitai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=civitai.com
// @version      0.6
// @note         0.6 feat: 添加 cmd args 导出
// @note         0.5 refactor: 重构代码
// @note         0.4 fix: 修改获取文件名逻辑
// @note         0.3 fix: 适配新版UI @gustproof
// @note         0.2 fix: 修复某些情况下复制按钮没有出现的bug
// @note         0.1 init
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/467975/ExportCivitAIMetadata.user.js
// @updateURL https://update.greasyfork.org/scripts/467975/ExportCivitAIMetadata.meta.js
// ==/UserScript==


function downloadFile(filename, content, type = 'text/plain') {
  const a = document.createElement('a')

  if (typeof content === 'object') {
    content = JSON.stringify(content, (k, v) => {
      try {
        return JSON.parse(v)
      } catch {
        return v
      }
    }, 2)
  }

  const url = URL.createObjectURL(new Blob([content], {
    type
  }))

  a.href = url
  a.download = filename || 'untitle.txt'
  a.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 0);
}

/**
 * Usage: SafetensorReader.readMetadataFromURL(url)
*/
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

class civitAI {
  SELECTORS = {
    // 模型下载链接按钮
    downloadBtn: '.mantine-cr35cs',
    modelTitle: '.mantine-127eswf',
    modelOprationGroup: ".mantine-mwqi5l > .mantine-1g4q40w",
    // last button
    thumbUpBtn: `.mantine-mwqi5l > .mantine-1g4q40w > :last-child`
  }

  CMD_ARGS = ["ss_output_name", "ss_learning_rate", "ss_text_encoder_lr", "ss_unet_lr", "ss_gradient_checkpointing", "ss_gradient_accumulation_steps", "ss_max_train_steps", "ss_lr_warmup_steps", "ss_lr_scheduler", "ss_network_module", "ss_network_dim", "ss_network_alpha", "ss_network_dropout", "ss_mixed_precision", "ss_full_fp16", "ss_v2", "ss_clip_skip", "ss_max_token_length", "ss_cache_latents", "ss_seed", "ss_lowram", "ss_noise_offset", "ss_multires_noise_iterations", "ss_multires_noise_discount", "ss_adaptive_noise_scale", "ss_zero_terminal_snr", "ss_training_comment", "ss_max_grad_norm", "ss_caption_dropout_rate", "ss_caption_dropout_every_n_epochs", "ss_caption_tag_dropout_rate", "ss_face_crop_aug_range", "ss_prior_loss_weight", "ss_min_snr_gamma", "ss_scale_weight_norms", "ss_ip_noise_gamma", "ss_debiased_estimation", "ss_noise_offset_random_strength", "ss_ip_noise_gamma_random_strength", "ss_loss_type", "ss_huber_schedule", "ss_huber_c"]

  getModelDownloadURL() {
    const dlBtn = document.querySelector(this.SELECTORS.downloadBtn)
    if (!dlBtn) {
      throw Error('无法找到下载按钮 / Can\'t find the download button')
    }

    return dlBtn.href
  }

  getModelTitle() {
    const titleEl = document.querySelector(this.SELECTORS.modelTitle)
    // 需要规则化
    const title = titleEl ? titleEl.innerText : "untitle"
    return title
  }

  getModelPageId() {
    // /models/123 -> models_123
    return location.pathname.replace(/^\//, '').replace(/\//, '_')
  }


  static hasExportBtnInstalled() {
    return document.querySelector('#EXPORT_BTN_CONTAINER')
  }

  createExportBtn() {
    if (civitAI.hasExportBtnInstalled()) {
      return
    }

    const thumbUpBtn = document.querySelector(this.SELECTORS.thumbUpBtn)
    const exportBtnContainer = thumbUpBtn.cloneNode(true)
    const exportBtn = exportBtnContainer.querySelector('button')

    const group = document.querySelector(this.SELECTORS.modelOprationGroup)

    exportBtn.setAttribute('title', 'Export model\'s metadata')
    try {
      const svgContainer = exportBtn.querySelector('.mantine-Button-label')
      svgContainer.innerHTML = `<?xml version="1.0" ?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 8V7C10 6.05719 10 5.58579 10.2929 5.29289C10.5858 5 11.0572 5 12 5H17C17.9428 5 18.4142 5 18.7071 5.29289C19 5.58579 19 6.05719 19 7V12C19 12.9428 19 13.4142 18.7071 13.7071C18.4142 14 17.9428 14 17 14H16M7 19H12C12.9428 19 13.4142 19 13.7071 18.7071C14 18.4142 14 17.9428 14 17V12C14 11.0572 14 10.5858 13.7071 10.2929C13.4142 10 12.9428 10 12 10H7C6.05719 10 5.58579 10 5.29289 10.2929C5 10.5858 5 11.0572 5 12V17C5 17.9428 5 18.4142 5.29289 18.7071C5.58579 19 6.05719 19 7 19Z" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    } catch {

    }

    // 添加唯一 ID，避免重复插入 node
    exportBtnContainer.id = "EXPORT_BTN_CONTAINER"

    exportBtnContainer.addEventListener('click', () => {
      exportBtn.setAttribute('disabled', true)

      this.exportMetadata().finally(() => {
        exportBtn.removeAttribute('disabled')
      })
    })

    group.appendChild(exportBtnContainer)
  }

  async getMetadata(modelDlUrl) {
    const raw_metadata = await SafetensorReader.readMetadataFromURL(modelDlUrl)
    const metadata = raw_metadata.__metadata__ || raw_metadata

    return metadata
  }

  async exportMetadata() {
    const filename = `${this.getModelPageId()}_${this.getModelTitle()}`

    const metadata = await this.getMetadata(this.getModelDownloadURL())

    if (!metadata || !Object.keys(metadata).length) {
      // no metadata
      alert('This model has no metadata')
      return
    }

    downloadFile(`${filename}.json`, metadata)

    const cmd_args = this.CMD_ARGS.map(arg => [arg.replace('ss_', ''), metadata[arg]]).filter(([name, value]) => value != undefined).map(([name, value]) => `--${name} ${value} \\`).join('\n')
    if (cmd_args) {
      downloadFile(`${filename}_cmd_args.txt`, cmd_args)
    }

    console.log(filename, metadata);
  }
}

/**
 * Single Page Application 页面变化检测
 * 
 * 通过监听 title 变化实现页面变化检测
*/
class SPAMonitor {
  constructor() {
    this.event = new CustomEvent('page-change')
    this.eventCallbacks = new Set()

    this.dispacher = window
    this._initPageChangeListener()
  }

  _initPageChangeListener() {
    const ob = new MutationObserver((mutations) => {
      this.dispacher.dispatchEvent(this.event)
    })

    // 实际只是监听 title 变化
    // 某些网页会动态改变 title，可能会有 bug
    ob.observe(document.querySelector('title'), {
      childList: true,
      subtree: true
    })
  }

  triggerPageChangeEvent() {
    this.dispacher.dispatchEvent(this.event)
  }

  addPageChangeEventListener(cb) {
    if (!cb || !typeof cb === 'function') {
      return;
    }

    const cbString = cb.toString()
    if (!this.eventCallbacks.has(cbString)) {
      this.dispacher.addEventListener('page-change', cb)
      this.eventCallbacks.add(cbString)
    }
  }

  waitForElement(selector, timeout = 10 * 1000, interval = 50) {
    let findTimes = 0

    const findEl = (resolve, reject) => {
      if (findTimes * interval >= timeout) {
        return reject()
      }

      const el = document.querySelector(selector)
      console.log(`finding ${selector}`);

      setTimeout(() => {
        if (!el) {
          findTimes++
          findEl(resolve, reject)
        } else {
          resolve(el)
        }
      }, interval);
    }

    return new Promise((resolve, reject) => {
      findEl(resolve, reject)
    })
  }
}

function main() {
  // 1. 等待页面加载完成
  // 2. 添加 export button
  // 3. 添加事件回调

  const spa = new SPAMonitor()
  const civitai = new civitAI()

  spa.addPageChangeEventListener(() => {
    const isModelPage = /^https?:\/\/civitai.com\/models\/\d+/.test(location.href)

    if (!isModelPage) {
      return
    }

    spa.waitForElement(civitai.SELECTORS.modelOprationGroup).then(() => {
      civitai.createExportBtn()
    })
  })

  spa.triggerPageChangeEvent()
}

(function () {
  main()
})();