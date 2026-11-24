# BrickGPT Studio

本地 3D 科研演示工作台。使用 React、TypeScript、React Three Fiber 和 Three.js。模型导入、预览、逐块播放和实验表均在浏览器中运行。

## 启动

需要 Node.js 22（开发和验证使用 22.22.2）和支持 WebGL 2 的浏览器。在本目录运行：

```sh
npm ci
npm run dev
```

打开 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)。依赖安装完成后，站点可以离线运行。生产版可用 `npm run build` 构建，再用 `npm run preview` 在同一地址预览。

## 发布到 GitHub Pages

1. 建立一个 GitHub 仓库，把本项目的文件提交到仓库根目录的 `main` 分支。请一并提交隐藏目录 `.github`，里面包含 Pages 工作流。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 **Actions** 打开 **Deploy BrickGPT Studio**。首次配置若已有失败记录，可选 **Run workflow** 再运行一次。部署成功后，在 **Settings → Pages** 打开网页地址。

站点使用相对静态资源路径，支持 `https://<用户名>.github.io/<仓库名>/`。网页源码包含 20 个内置模型及 A2 聚合表。[GitHub Pages 工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 导入和播放

- 点击 **导入坐标**，可同时选择多个 BrickGPT `.txt` 文件。每个非空行是一块积木，例如 `1x2 (7,18,0)`。文件上限为 2 MB。
- 导入后生成缩略图并自动选中本批首个新模型。坐标、原文件和缩略图通过 IndexedDB 保存，刷新后恢复。请使用同一浏览器资料和上面的同一地址。
- 名称和积木坐标均相同的重复项会跳过。部分文件格式有误时，结果提示会列出文件名和行号，可用文件仍会导入。
- 按住鼠标拖动 3D 画面可以环绕模型，滚动可缩放。播放条支持逐块前后切换、拖动定位、播放暂停和倍率选择。点击右侧源文件可下载原始坐标。
- 播放遵循最终生成文件的原始行序。实验中的 SCIP 分数评估的是内置模型成品。普通坐标导入可得到积木总数和规格种类，种子及物理稳定性需要对应实验记录。

## 材质渲染与 PNG 导出

- **材质渲染** 默认开启。开启时展示逐砖配色、木纹或布纹贴图、摄影棚反射与阴影。再次点击可切回原始单色结构视图。两种模式共享坐标、相机视角和当前拼装进度。
- **保存渲染图** 将当前相机和拼装进度导出为 PNG。图片为 WebGL 数字渲染。
- 配色来自 Studio 按模型编写的规则，贴图使用 ambientCG 的 CC0 [Wood 049](https://ambientcg.com/view?id=Wood049) 和 [Fabric 030](https://ambientcg.com/view?id=Fabric030)，包含底色与 OpenGL 法线图，已缩至 512 像素并随网页打包。环境反射使用 [Three.js RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html)。
- 论文的 FlashTex 负责由外观提示词自动生成 UV 贴图。本页的人工配色和现成材质属于展示后处理。消融结果及原始坐标继续按同一实验记录引用。[论文 4.3 节](https://arxiv.org/html/2505.05469v3#S4.SS3)

## 数据来源

- 椅子和桌子来自课程项目 A3 实物候选，分别有 80 块和 59 块。提示词及 SCIP 分数来自 A2 求解器复查。
- 另外 18 个展品来自 A2 正式 SCIP 回退组。按模型库顺序分别是第 182、141、147、184、55、15、208、65、35、191、120、88、37、105、68、154、78、46 条。展品根据渲染与原提示词人工选取，均通过最终结构的 SCIP 物理检查。形状相似度与物理稳定性是两项独立的评价。
- **A2 · 消融实验** 读取随站点打包的 [配对消融原始 CSV](src/data/ablation-paired.csv)。合法数和稳定数使用每组 250 条配对提示词作为分母。表下的 **统计口径与数据来源** 可查看查验覆盖及下载 CSV。
