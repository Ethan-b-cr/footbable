const planConfig = {
  monthly: { name: "基础会员月卡", amount: "39.00" },
  quarterly: { name: "专业会员季卡", amount: "99.00" },
  single: { name: "单场焦点包", amount: "19.00" },
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") || "monthly";
  const config = planConfig[plan] || planConfig.monthly;

  if (!env.ALIPAY_APP_ID || !env.ALIPAY_GATEWAY) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "支付宝参数未配置。请在 Cloudflare Pages 环境变量中补齐 ALIPAY_APP_ID、ALIPAY_GATEWAY 等参数。",
        plan,
        config,
      }),
      { status: 501, headers: { "content-type": "application/json; charset=UTF-8" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: false,
      message: "支付宝正式下单逻辑待接入。当前结构已预留，可直接替换为真实签名与下单代码。",
      plan,
      config,
    }),
    { status: 501, headers: { "content-type": "application/json; charset=UTF-8" } }
  );
}
