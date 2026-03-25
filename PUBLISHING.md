# Curtain - Chrome Web Store 上架步驟

## 前置作業

### 1. 註冊開發者帳號
1. 前往 https://chrome.google.com/webstore/devconsole
2. 支付一次性 **$5 USD** 註冊費
3. 確認 Google 帳號已啟用**兩步驟驗證**

### 2. 託管隱私政策
隱私政策頁面已在 `privacy-policy.html`，你需要把它放到一個公開可訪問的 URL。選項：
- **GitHub Pages**: 把專案推到 GitHub，啟用 Pages → `https://你的帳號.github.io/curtain-extension/privacy-policy.html`
- **自有網域**: 上傳到你的網站

### 3. 準備截圖與宣傳圖
參考 `store-assets/ASSETS-GUIDE.md`，需要：
- [ ] **至少 1 張截圖** (1280x800 px)，建議 5 張
- [ ] **小型宣傳圖** (440x280 px)

---

## 打包與上傳

### 4. 打包 Extension
```bash
./build.sh
```
產出 `curtain-extension-v1.0.0.zip` (約 12KB)

### 5. 上傳到 Chrome Web Store
1. 前往 https://chrome.google.com/webstore/devconsole
2. 點擊「New Item」
3. 上傳 `curtain-extension-v1.0.0.zip`

### 6. 填寫商店資訊
參考 `store-listing.md` 中的文案：

| 欄位 | 值 |
|------|-----|
| 名稱 | Curtain - Privacy Curtain |
| 簡短說明 | Hide sensitive bookmarks & browsing history with one click. Restore them when you're ready. 100% local, zero data collection. |
| 詳細說明 | 見 `store-listing.md` |
| 類別 | Productivity |
| 語言 | Chinese (Traditional) |

### 7. 上傳圖片素材
- 截圖 (至少 1 張)
- 小型宣傳圖 (440x280)

### 8. 隱私權設定
- **隱私政策 URL**: 填入你託管的 privacy-policy.html 網址
- **資料用途聲明**:
  - 勾選「Bookmarks」→ 用途：核心功能
  - 勾選「Web history」→ 用途：核心功能
  - 聲明：不收集、不傳輸、不分享任何使用者資料

### 9. 提交審核
- 點擊「Submit for Review」
- 首次提交審核時間約 **1-3 個工作天**
- 因使用 `history` 和 `bookmarks` 權限，可能需要較長審核時間

---

## 審核注意事項

- Extension 只要求最少必要權限（4 個）
- 所有資料處理都在本地完成
- 沒有遠端程式碼載入
- 程式碼未經混淆，審核員可直接閱讀
- 隱私政策清楚說明每個權限的用途

## 更新版本

1. 修改 `manifest.json` 中的 `version`（例如 `1.0.1`）
2. 執行 `./build.sh`
3. 在 Developer Dashboard 上傳新的 zip 檔
4. 提交審核
