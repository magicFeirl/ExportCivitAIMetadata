## 导出 .safetensors 文件的 metadata 

.safetensors 文件的 metadata 字段可能保存了模型的训练数据，包括学习率、数据集重复次数等参数，使用本脚本可以直接从 [civitai.com](http://civitai.com) 的模型页面导出模型的 metadata。

This is a simple script that allows you to export the metadata of .safetensors files on [civitai.com](http://civitai.com). The metadata may include some training parameters such as learning rate and dataset repetition etc and you can use these parameters to your project or anywhere you want.



**使用方法 / Usage**

**1.** 安装油猴扩展 / Install Tampermonkey

https://www.tampermonkey.net/



**2.** 从 GreasyFork 或者 Github 安装脚本 / Install my script from GreasyFork or Github

[[GreasyFork\]](https://greasyfork.org/zh-CN/scripts/467975-exportcivitaimetadata)

[[Github\]](https://raw.githubusercontent.com/magicFeirl/ExportCivitAIMetadata/main/index.js)



**3.** 刷新网页，进入一个模型页面 / Refresh the page and go to a model page

在按钮旁边应该有个复制按钮 / You can see there is a copying button alongside the download button

![img](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/8522bd31-5f01-4e8a-940e-7f5b90c2d663/width=525/8522bd31-5f01-4e8a-940e-7f5b90c2d663.jpeg)



**4.** 点击该按钮即可导出模型的 metadata / Click the copying button and then you can export the metadata of the model

![img](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/06535416-65ef-4267-9efa-9bd315cb4ff1/width=525/06535416-65ef-4267-9efa-9bd315cb4ff1.jpeg)



如果你觉得这个脚本对你有帮助的话可以点个 star / Please give me a star if you think this script is useful :).



***从其它网站读取 .safetensors 文件的 metadata\***

见 SafetensorsHeaderReader 类

## LICENSE

MIT

