# 国内支付接入说明

当前站点第一版支付方案：

- 支付宝：网页支付
- 微信支付：优先扫码支付（Native）

## 当前已完成

- 新增 `pay.html` 作为国内支付入口页
- 新增 Cloudflare Pages Functions 占位接口：
  - `functions/api/pay/alipay.js`
  - `functions/api/pay/wechat.js`
  - `functions/api/pay/notify.js`
- 会员中心页已改成引导用户进入支付页

## 上线前还需要补

### 支付宝

- `ALIPAY_APP_ID`
- `ALIPAY_GATEWAY`
- 应用私钥 / 支付宝公钥
- `notify_url`
- `return_url`

### 微信支付

- `WECHAT_MCH_ID`
- `WECHAT_APP_ID`
- API v3 密钥
- 商户证书
- `notify_url`

## 推荐联调顺序

1. 先接支付宝网页支付
2. 再接微信 Native 扫码支付
3. 接支付通知验签
4. 通知成功后开通会员状态
5. 再把当前前端 `localStorage` 会员状态换成正式后端状态

## 会员状态建议字段

- `order_id`
- `user_email`
- `plan`
- `provider`
- `amount`
- `status`
- `paid_at`
- `expire_at`

## Cloudflare Pages 环境变量建议

- `ALIPAY_APP_ID`
- `ALIPAY_GATEWAY`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_PUBLIC_KEY`
- `WECHAT_MCH_ID`
- `WECHAT_APP_ID`
- `WECHAT_API_V3_KEY`
- `WECHAT_PRIVATE_KEY`
- `WECHAT_SERIAL_NO`
