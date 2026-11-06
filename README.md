# TypeX

给小朋友的五分钟打字探险。React + TypeScript + Vite + Tailwind CSS + Motion，纯前端，无需注册。

## 开发与验证

需要 Node.js 22.12 或更新版本。

- 安装依赖：`npm install`
- 开发：`npm run dev`
- 构建：`npm run build`
- 单元测试：`npm test`
- 浏览器检查：开发服务在 127.0.0.1:5173 启动后，执行 `npm run test:e2e`（使用本机 Google Chrome）。

## 练习内容

1. 键盘寻宝：小写字母 → 数字与常用标点 → 大写与 Shift 符号。
2. 单词森林：1478 个英语词，按主题和内容层级筛选；知识卡展示音标、词性、中文释义与学习提示，部分词条配有例句和翻译。支持手动朗读和设置中的自动读词。
3. 汉字花园：2500 个常用汉字，附拼音、限定词语和字义说明，部分配有例句。可以照着拼音敲字母，也可以使用系统中文输入法输入汉字。ü 以 v 输入，多音字按当前限定词语练习。

词库按基础、进阶、拓展分层。练习范围依次为基础、基础＋进阶、全部；这是产品内容分层，不代表教材年级或学习成绩。字词图书馆支持搜索、层级/主题筛选和详情查看。

每局 300 秒，3 秒准备时间不计入。暂停、打开知识卡和切换后台不消耗练习时间。汉字输入模式打开知识卡会记录一次拼音提示。长按自动重复和粘贴不计分。提前结束保存记录但不评级。

## 减少重复

当前范围内尚未展示过的题目优先；练完当前范围才开始下一轮，尽量避开最近 20 题。进度保存在本浏览器，跨局、刷新后延续。切换主题和层级共享展示记录，两种汉字模式也共享记录。小题库耗尽后仍会重复；题目一旦展示就计入记录，无须答完。

## 评分

完整五分钟才评级，数量和准确率必须同时达标。门槛是产品初始设定，不是教育测评标准，可在 `src/game.ts` 的 `thresholds` 调整。

| 模式 | 达标数量 | 优秀数量 | 数量单位 |
| --- | --- | --- | --- |
| 键盘寻宝 | 60 | 150 | 正确按键次数 |
| 单词森林 | 75 | 175 | 正确字符数 |
| 拼音练习 | 70 | 160 | 正确字母数 |
| 汉字输入 | 12 | 30 | 正确汉字数 |

达标准确率至少 85%，优秀至少 95%。键盘中档门槛乘 0.8，挑战档乘 0.65；字词范围扩大不降低字符门槛。正确字符即使尚未拼完当前题也会计入，完成题数独立显示。旧记录继续采用原来的按题数评级，避免升级后改变历史成绩。

按键、单词、拼音准确率按实际字符尝试计算；中文输入按已提交的汉字答案计算。输入法组合与候选选择不算错误。错误保留当前进度，正确后继续；已正确字符不可撤回。

## 内容来源与边界

这是面向小学阶段的通用复习库，包含可选拓展，**不是已核实的北京昌平教材同步词表，也不是官方必背清单**。英语选词和中文教学提示为项目编写；汉字以开放字典常用字为基础，结合现代释义覆盖、词语限定和拼音校对整理。层级是粗略的内容安排。

- Chinese Dictionary：`https://github.com/mapull/chinese-dictionary`，MIT；常用字与字义参考。
- ECDICT：`https://github.com/skywind3000/ECDICT`，MIT；英语音标、词性及匹配当前释义的词义参考。
- CMUdict：`https://github.com/cmusphinx/cmudict`，BSD 风格许可；少量缺省读音的音素转写参考。
- jieba：`https://github.com/fxsjy/jieba`，MIT；按词频筛选常见搭配。
- pypinyin：`https://github.com/mozillazg/python-pinyin`，MIT；词语中的带声调拼音。

许可证保存在 `public/licenses/`。英语音标沿用来源并做字符规范化，可能包含不同口音；实际朗读调用浏览器和系统英语语音，不是预录音频。优先选用 Samantha，过滤 Albert 等效果音色，语速为正常的 0.96 倍；字词图书馆提供 apple、watermelon、library 三个试听入口。没有英语语音时会给出提示，需要在系统中安装对应声音。开放字典内容并非每条均完成教育编辑审核，复杂义项建议家长结合限定词语讲解。

生成脚本：`uv run --with pypinyin python scripts/build-library.py /path/to/source-cache`。缓存需包含 Chinese Dictionary 的 `char_common_base.json`、`detail.json`（逗号分隔对象格式），`default-pinyin.json`，jieba 的 `jieba-dict.txt`，CMU 的 `cmudict.json`，以及 ECDICT 的 `ecdict-full.csv`。选词、教学提示、现代释义及多音字覆盖保存在 `scripts/`，最终 JSON 随源码提交，日常开发不需要下载或重新生成。

## 本地数据与验证范围

设置、题库展示进度和最近 200 局成绩保存在当前浏览器 localStorage。清除浏览器数据会删除记录，换浏览器/电脑不会同步；存储失败时仍可练习，历史成绩存储失败会提示。

Vitest 覆盖评分迁移、题库完整性、范围组合、持久化和跨轮次不重复逻辑。Playwright 覆盖四条输入路径、错误与长按过滤、暂停、五分钟结算、持久化、词库搜索、朗读、知识卡暂停和移动布局。中文组合事件使用浏览器模拟；实际系统输入法和系统语音仍应在孩子使用的电脑上试用。

## 阿里云部署

生产地址：`https://typex.mushayu.com`。沿用 PromptX 所在服务器 `8.130.37.52`，通过现有 Nginx 提供纯静态站点，不需要常驻 Node 进程。

执行 `scripts/deploy-aliyun.sh`：测试、构建、上传到 `/opt/typex/releases/<UTC时间>/`，通过 `/opt/typex/current` 原子切换，并校验公网首页与本地产物一致。上一个版本保存在 `/opt/typex/previous`。Nginx 配置源为 `deploy/typex.nginx.conf`，服务器安装到 `/usr/local/nginx/conf/vhost/typex.conf`。SSH 目标可用 `TYPEX_REMOTE` 覆盖。

HTTPS 使用 Let's Encrypt webroot 验证，证书路径 `/etc/letsencrypt/live/typex.mushayu.com/`；沿用现有 `certbot.timer` 和 Nginx reload hooks 自动续期。HTTP 自动跳转 HTTPS。可执行 `certbot renew --cert-name typex.mushayu.com --dry-run` 检查续期。

浏览器设置、成绩与去重记录按域名分别保存，localhost 的数据不会自动出现在生产域名下；系统语音也取决于访问设备。
