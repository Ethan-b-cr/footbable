const planConfig = {
  monthly: { name: "基础会员月卡", amountFen: 3900 },
  quarterly: { name: "专业会员季卡", amountFen: 9900 },
  single: { name: "单场焦点包", amountFen: 1900 },
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") || "monthly";
  const config = planConfig[plan] || planConfig.monthly;

  if (!env.WECHAT_MCH_ID || !env.WECHAT_APP_ID) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "微信支付参数未配置。请在 Cloudflare Pages 环境变量中补齐 WECHAT_MCH_ID、WECHAT_APP_ID 等参数。",
        plan,
        config,
      }),
      { status: 501, headers: { "content-type": "application/json; charset=UTF-8" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: false,
      message: "微信支付正式下单逻辑待接入。当前结构已预留，可直接替换为 Native/H5 下单代码。",
      plan,
      config,
    }),
    { status: 501, headers: { "content-type": "application/json; charset=UTF-8" } }
  );
}
