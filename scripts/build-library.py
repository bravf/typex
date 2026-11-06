import json,re,sys,unicodedata,collections,csv
from pathlib import Path
R=Path(__file__).resolve().parents[1];C=Path(sys.argv[1]);D=R/'src/data'
def read(n):return json.loads((C/n).read_text())
def objects(n):return json.loads('['+(C/n).read_text().strip().rstrip(',')+']')
def plain(s):return ''.join(c for c in unicodedata.normalize('NFD',re.sub('[ǖǘǚǜü]','v',s.replace('ɡ','g'))) if not unicodedata.combining(c)).lower()
cmu=read('cmudict.json')
ipa_map=dict(zip('AA AE AH AO AW AY B CH D DH EH ER EY F G HH IH IY JH K L M N NG OW OY P R S SH T TH UH UW V W Y Z ZH'.split(),'ɑ æ ʌ ɔ aʊ aɪ b tʃ d ð ɛ ɝ eɪ f ɡ h ɪ i dʒ k l m n ŋ oʊ ɔɪ p ɹ s ʃ t θ ʊ u v w j z ʒ'.split()))
def ipa(w):
 seq=cmu.get(w.lower(),cmu.get(w.lower().replace('-',''),[]))
 if not seq:return ''
 result=''
 for p in seq[0]:
  b=p.rstrip('012');stress=p[len(b):]
  result+=('ˈ' if stress=='1' else 'ˌ' if stress=='2' else '')+('ə' if b=='AH' and stress=='0' else 'ɚ' if b=='ER' and stress=='0' else ipa_map.get(b,''))
 return '/'+result+'/'
notes=['联系自己和家人理解这个词。介绍人物时，可以配合姓名、年龄或家庭关系来表达。','把单词与课堂或书包里的物品联系起来记忆，留意它在课表或教室里的使用场景。','观察动物的外形、生活环境或行为，把英文名称和真实动物联系起来。','可以在吃饭、购物时复习。不同食物的数量表达不一定相同，不要给每个食物名直接加 s。','把单词与身体部位或健康习惯联系起来；描述不舒服时，可以向家长或老师求助。','联系每天穿衣、整理物品的场景来记忆，留意衣物名称的单复数。','在家里找一找对应的物品或位置，把英文和实物配对。','想一想今天的天气、周围的植物和景色，把词语与观察到的事物联系起来。','结合日历、时钟或数量练习。日期、时刻和数量使用的表达方式各有不同。','观察物品的颜色、形状或大小，试着把单词与观察结果配对。','想象或做一做这个动作。动词会随时间和主语变化，这里先练基本拼写。','联系上学、问路、乘车和参观的情境，认识公共场所和出行用语。','联系自己或身边人的感受、特点来理解，不同情境可能需要不同的中文译法。','联系课外活动、运动或身边人的工作，理解这个词在生活中指什么。','这类词要放在句子里理解；位置或搭配改变，意思也可能变化。','这是可选拓展词，不表示每个年级都必须掌握。先理解常用意思，再逐步熟悉搭配。']
examples=json.loads((R/'scripts/english-notes.json').read_text()) if (R/'scripts/english-notes.json').exists() else {}
entries=[];seen=set();idx=-1
for line in (R/'scripts/english-seed.txt').read_text().splitlines():
 if not line:continue
 if line.startswith('#'):topic,emoji,level=line[2:].split('|');idx+=1;continue
 word,meaning=line.split('|',1)
 if word.lower() in seen:continue
 seen.add(word.lower());e=examples.get(word,{})
 entries.append(dict(id='word-'+word.lower(),word=word,meaning=meaning,phonetic=e.get('phonetic',ipa(word)),partOfSpeech=e.get('pos',''),explanation=e.get('note',f'常用意思：{meaning}。'+notes[idx]),example=e.get('example'),exampleTranslation=e.get('translation'),topic=topic,level=int(level),emoji=emoji,source='自编选词与中文注释；CMUdict 美式音素转写'))
# ECDICT supplies lexical detail; only sense lines overlapping the curated meaning are used.
source=C/'ecdict-full.csv'
if source.exists():
 by={e['word'].lower():e for e in entries}
 names={'n':'名词','a':'形容词','adj':'形容词','adv':'副词','ad':'副词','v':'动词','vt':'及物动词','vi':'不及物动词','prep':'介词','pron':'代词','num':'数词','conj':'连词','interj':'感叹词','int':'感叹词','det':'限定词','aux':'助动词'}
 for row in csv.DictReader(source.open()):
  e=by.get(row['word'].lower())
  if not e:continue
  phon=row.get('phonetic','')
  if not examples.get(e['word'],{}).get('phonetic') and phon:
   e['phonetic']='/'+phon.split('. ')[0].replace("'",'ˈ').replace(':','ː').replace('ә','ə').replace('^','ɡ').replace('ai','aɪ').replace('ei','eɪ').replace('au','aʊ').replace('oi','ɔɪ').replace('əu','oʊ').replace('əː','ɜː')+'/'
  translation=row.get('translation','')
  bits=re.split(r'；|，|;',e['meaning']);needles=[x.strip('（）() ') for x in bits if len(x.strip())>=2]
  selected=[];parts=[]
  for line in translation.split(chr(92)+'n'):
   m=re.match(r'([a-z]+)\.\s*(.+)',line)
   if not m:continue
   pos,gloss=m.groups()
   # Keep only a definition line that actually matches the intended elementary meaning.
   glosses=[g.strip() for g in gloss.split(',') if any(n in g for n in needles) and not re.search(r'阴部|性交|淫|妓|杀人|毒品|家伙|瞄准|\[医法计\]|自杀|残杀|剥夺|弑|胁迫|淫秽',g)]
   if glosses:
    parts.append(names.get(pos,pos+'.'));selected.append('、'.join(glosses[:3]))
  if not parts:
   parts=[names.get(m.group(1),m.group(1)+'.') for line in translation.split(chr(92)+'n') if (m:=re.match(r'([a-z]+)\.\s*(.+)',line))][:2]
  if not e['partOfSpeech'] and parts:e['partOfSpeech']='；'.join(dict.fromkeys(parts))
  if e['word'] not in examples and selected:
   e['explanation']='常用意思：'+e['meaning']+'。'+('用作'+e['partOfSpeech']+'时，可表示'+ '；'.join(dict.fromkeys(selected))+'。' if e['partOfSpeech'] else '')+e['explanation'].split('。',1)[-1]
  e['source']='自编选词与教学注释；ECDICT（MIT）音标、词性与释义参考；缺省音标参考 CMUdict'
(D/'words.json').write_text(json.dumps(dict(name='小学英语通用与拓展词库',status='curated',note='小学生活主题自编选词，含可选拓展；不是官方必背清单或学校教材词表。',items=entries),ensure_ascii=False,indent=2)+'\n')
print('English:',len(entries),'missing IPA:',[x['word'] for x in entries if not x['phonetic']])
import pypinyin
base=[x for x in objects('char_common_base.json') if x['frequency']<2]
detail={x['char']:x for x in objects('detail.json')}
original={x[0]:x for x in json.loads((R/'scripts/hanzi-original.json').read_text())['items']}
sentences=(R/'scripts/hanzi-examples.txt').read_text().splitlines()
vocabulary='学习 学校 同学 学生 老师 书本 读书 写字 铅笔 语文 汉字 听课 说话 朋友 画画 上课 练习 回家 关爱 开心 美好 快乐 长大 行走 跑步 微笑 美丽 女孩 绿色 小鸟 小鱼 明亮 高山 河水 春风 下雨 白云 天空 花朵 小草 大树 树叶 星星 月亮 雪花 春天 秋天 桌子 帽子 桥梁 小猫 我的 土地 得到 睡觉 音乐 还有 重量 重要 方便 数学 数量 角落 发现 只要 好人 空气 干净 苹果 鸡蛋 宽敞 螺丝 水果 食物 森林 语言 回答 问题 工具 冬天 夏天 衣服 图画 笑容 种子 热闹 安静 安全 医生 手臂 胳膊 孩子 背包 垃圾 葡萄 玻璃 蘑菇 萝卜 蝴蝶 蚯蚓 骆驼 企鹅 熊猫 猴子 拼音 键盘 准确 数字 符号 成长 帮助 承认 改正 规则 尊重 耐心 诚实 勇敢 眼睛 身体 鼻子 嘴巴 牙齿 耳朵 头脑 脚步 心情 交通 城市 村庄 田野 农民 青菜 米饭 牛奶 面包 颜色 红色 黄色 蓝色 白色 黑色 紫色 方向 东西 南北 左右 前后 上下 大小 多少 高低 长短 远近 快慢 轻重 真假 正反 冷热 胖瘦 新旧 好坏 对错 弯曲 直线 地球 宇宙 星空 海洋 陆地 湖泊 山峰 沙漠 草原 岛屿 港口 轮船 火车 飞机 汽车 道路 隧道 公路 广场 公园 超市 商店 医院 邮局 银行 工厂 图书馆 博物馆 电影院 体育馆 劳动 幸福 责任 希望 理想 梦想 勤奋 努力 进步 创造 观察 实验 科学 研究 自然 生命 世界 文化 历史 祖国 人民 社会 民族 团结 和平 友谊 祝福 礼貌 谦虚 骄傲 整齐 干燥 潮湿 柔软 坚硬 粗糙 光滑 透明 清澈 浑浊 温暖 炎热 寒冷 凉爽 焦急 害怕 担心 惊喜 兴奋 激动 悲伤 愤怒 失望 满意 羡慕 欣赏 珍惜 节约 浪费 保护 损坏 修理 检查 整理 收拾 擦拭 打扫 洗涤 烹饪 饭碗 筷子 勺子 盘子 杯子 瓶子 盒子 篮子 箱子 柜子 抽屉 窗户 屋顶 屋檐 墙壁 地板 楼梯 走廊 阳台 厨房 卧室 客厅 浴室 浴巾 毛巾 肥皂 牙刷 梳子 镜子 被子 枕头 床单 帘子 钟表 闹钟 冰箱 空调 电扇 电灯 电视 电话 电池 插座 电线 电源 开关 屏幕 鼠标 文件 照片 故事 童话 寓言 诗歌 小说 文章 段落 句子 词语 标点 逗号 句号 顿号 感叹 问号 朗读 背诵 阅读 书写 绘画 歌唱 舞蹈 弹琴 吹笛 音符 节奏 旋律 鼓声 锣鼓 号角 笛子 琵琶 吉他 钢琴 小提琴 篮球 足球 排球 羽毛球 乒乓球 游泳 跳水 滑冰 滑雪 爬山 拔河 跳绳 赛跑 投掷 体操 武术 拳头 射箭 棋子 象棋 围棋 积木 拼图 迷宫 魔方 陀螺 风筝 气球 玩具 布娃娃 机器 机器人'.split()
freq={}
for line in (C/'jieba-dict.txt').read_text().splitlines():
 s=line.split()
 if len(s)>2 and s[2] not in ['nr','nrfg','nrt','ns','nt','nz']:freq[s[0]]=int(s[1])
unsafe=re.compile('嫖|妓|奸|淫|娼|屌|睾|肛|精液|阴茎|阴道|性交|黄片|自杀|杀人|强奸|毒品|鸦片|刑罚|处死|阉|屠杀')
contexts=collections.defaultdict(list)
for w in vocabulary:
 for c in w:
  if w not in contexts[c]:contexts[c].append(w)
for x in base:
 c=x['char'];candidates=[]
 for pr in detail[c].get('pronunciations',[]):
  for ex in pr.get('explanations',[]):
   for obj in ex.get('words',[]):
    for w in re.split('[;；,，、]',obj.get('word','')):
     if c in w and re.fullmatch('[一-鿿]{2,3}',w) and freq.get(w,0)>=100 and not unsafe.search(w):candidates.append(w)
 for w in sorted(set(candidates),key=lambda w:-freq[w]):
  if w not in contexts[c]:contexts[c].append(w)
for c in [x['char'] for x in base]:
 if not contexts[c]:
  ws=[w for w,f in freq.items() if c in w and re.fullmatch('[一-鿿]{2,3}',w) and f>=500 and not unsafe.search(w)]
  contexts[c]=sorted(ws,key=lambda w:-freq[w])[:4]
overrides=json.loads((R/'scripts/hanzi-notes.json').read_text())
modern=dict(line.split('=',1) for line in (R/'scripts/hanzi-modern.txt').read_text().splitlines() if '=' in line)
def clean(s):return re.sub(r'\([^)]*\)|（[^）]*）','',s).replace(';','；').strip(' ,，;；。')
bad=re.compile('^又$|古|即今|中国汉代|假借|引申|比喻|喻|骂|詈|放荡|放纵|象形|形声|会意|本作|甲骨|古文|古代|古时|古称|古同|通“|同“|姓|地名|国名|人名|官名|又作|又如|另见|同本义|本义|——|《|冤|贱|妓|淫|奸|杀戮|刑|祭祀|占卜|封建|迷信')
items=[];issues=[]
for x in base:
 c=x['char'];prons=detail[c].get('pronunciations',[]);ov=overrides.get(c)
 ws=contexts[c][:4];context=ov[1] if ov else original[c][3] if c in original else ws[0] if ws else c
 pinyin=ov[0] if ov else pypinyin.pinyin(context,style=pypinyin.Style.TONE)[context.index(c)][0]
 pr=next((p for p in prons if plain(p['pinyin'])==plain(pinyin)),{})
 if not pr:pr=prons[0] if prons else {}
 candidates=[]
 for ex in pr.get('explanations',[]):
  s=clean(ex.get('content',''))
  if s and len(s)<=90 and not bad.search(s) and not unsafe.search(s) and not s.startswith('同'):candidates.append(s)
 meaning=candidates[0] if candidates else ''
 if not meaning:
  for ex in pr.get('explanations',[]):
   m=re.search(r'本义[:：]([^)。]+)',ex.get('content',''))
   if m and not unsafe.search(m[1]):meaning=clean(m[1]);break
 if c in modern:meaning=modern[c]
 if ov:meaning=ov[2]
 if not meaning and not ov:issues.append(c);meaning='常用于“'+context+'”，建议结合词语理解'
 meaning=meaning.rstrip('。')+'。'
 if len(meaning)<4:meaning='常用意思是：'+meaning
 if len(meaning)>150:meaning=meaning.split('，')[0].split(',')[0]+'。'
 if context not in ws:ws=[context]+ws[:3]
 # Keep compounds only when their pronunciation agrees with this exercise.
 ws=[w for w in ws if pypinyin.pinyin(w,style=pypinyin.Style.TONE)[w.index(c)][0]==pinyin]
 example=next((s for s in sentences if context in s and pypinyin.pinyin(s,style=pypinyin.Style.TONE)[s.index(c)][0]==pinyin),None)
 explanation=meaning
 if len(prons)>1 and not ov:explanation+=' 这个字有不同读音，本题结合“'+context+'”练习 '+pinyin+'。'
 items.append(dict(id='hanzi-'+c,char=c,pinyin=pinyin,input=plain(pinyin),meaning=meaning,explanation=explanation,words=[w for w in ws if w!=c],example=example,context=context,topic=original[c][4] if c in original else '常用汉字',level=1 if x['frequency']==0 else 2 if x['frequency']==1 and x['index']<2000 else 3,source='Chinese Dictionary（MIT）释义参考及自编现代释义；词语参考 jieba；自编例句；拼音参考 pypinyin'))
(D/'hanzi.json').write_text(json.dumps(dict(name='常用汉字小学练习库',status='curated',note='从开放字典常用字中选择 2500 字作小学范围练习；不是已核实的教材清单。释义经规则整理，义项需结合语境。',items=items),ensure_ascii=False,indent=2)+'\n')
print('Chinese:',len(items),'review:', ''.join(issues),'examples:',sum(bool(e['example']) for e in items))
