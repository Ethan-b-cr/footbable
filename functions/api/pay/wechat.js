const planConfig = {
  monthly: { name: "基础会员月卡", amountFen: 3900 },
  quarterly: { name: "专业会员季卡", amountFen: 9900 },
  single: { name: "单场焦点包", amountFen: 1900 },
};

function buildCheckoutUrl(origin, provider, plan, config, mode) {
  const checkoutUrl = new URL("/checkout.html", origin);
  checkoutUrl.searchParams.set("provider", provider);
  checkoutUrl.searchParams.set("plan", plan);
  checkoutUrl.searchParams.set("amount", (config.amountFen / 100).toFixed(2));
  checkoutUrl.searchParams.set("title", config.name);
  checkoutUrl.searchParams.set("mode", mode);
  return checkoutUrl.toString();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") || "monthly";
  const config = planConfig[plan] || planConfig.monthly;
  const orderId = `WX-${Date.now()}`;

  if (!env.WECHAT_MCH_ID || !env.WECHAT_APP_ID) {
    return new Response(
      JSON.stringify({
        ok: false,
        provider: "wechat",
        mode: "manual",
        orderId,
        plan,
        config,
        checkoutUrl: buildCheckoutUrl(url.origin, "wechat", plan, config, "manual"),
        message: "微信支付参数还没有补齐，当前先由站内结账页承接。",
        successUrl: `${url.origin}/pay-success.html?orderId=${orderId}`,
        failedUrl: `${url.origin}/pay-failed.html?orderId=${orderId}`,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json; charset=UTF-8" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      provider: "wechat",
      mode: "gateway-ready",
      orderId,
      plan,
      config,
      checkoutUrl: buildCheckoutUrl(url.origin, "wechat", plan, config, "gateway"),
      message: "微信支付环境变量已识别。把真实 Native/H5 下单逻辑接入这里后，即可切到正式支付。",
      successUrl: `${url.origin}/pay-success.html?orderId=${orderId}`,
      failedUrl: `${url.origin}/pay-failed.html?orderId=${orderId}`,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json; charset=UTF-8" },
    }
  );
}
