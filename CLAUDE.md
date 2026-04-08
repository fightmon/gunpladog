# 模物獵人 — 鋼普拉比價工具

## 專案說明
鋼普拉模型二手價格追蹤工具，單一 HTML 檔案，搭配 Firebase Realtime Database。

## 主要檔案
- `gundam-price-tracker.html` — 主工具（所有功能都在這個單一檔案）
- `index.html` — 與 gundam-price-tracker.html 完全相同（同步副本）

## 修改規則
每次修改 `gundam-price-tracker.html` 後，必須同步 `index.html`：
```
cp gundam-price-tracker.html index.html
```

## 技術架構
- 單一 HTML 檔案（無 build system）
- Firebase Realtime Database（CDN ES module，無 Auth）
- Groq API（meta-llama/llama-4-scout-17b-16e-instruct）做 AI 解析
- AI 文字解析：`parseWithAI(text)` / `AI_PROMPT`
- AI 圖片解析：`analyzeImageWithAI()` / `IMAGE_PROMPT`
