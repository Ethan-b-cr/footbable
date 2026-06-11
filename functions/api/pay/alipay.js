const planConfig = {
  monthly: { name: "基础会员月卡", amount: "39.00" },
  quarterly: { name: "专业会员季卡", amount: "99.00" },
  single: { name: "单场焦点包", amount: "19.00" },
};

function buildCheckoutUrl(origin, provider, plan, config, mode) {
  const checkoutUrl = new URL("/checkout.html", origin);
  checkoutUrl.searchParams.set("provider", provider);
  checkoutUrl.searchParams.set("plan", plan);
  checkoutUrl.searchParams.set("amount", config.amount);
  checkoutUrl.searchParams.set("title", config.name);
  checkoutUrl.searchParams.set("mode", mode);
  return checkoutUrl.toString();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") || "monthly";
  const config = planConfig[plan] || planConfig.monthly;
  const orderId = `ALI-${Date.now()}`;

  if (!env.ALIPAY_APP_ID || !env.ALIPAY_GATEWAY) {
    return new Response(
      JSON.stringify({
        ok: false,
        provider: "alipay",
        mode: "manual",
        orderId,
        plan,
        config,
        checkoutUrl: buildCheckoutUrl(url.origin, "alipay", plan, config, "manual"),
        message: "支付宝参数还没有补齐，当前先由站内结账页承接。",
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
      provider: "alipay",
      mode: "gateway-ready",
      orderId,
      plan,
      config,
      checkoutUrl: buildCheckoutUrl(url.origin, "alipay", plan, config, "gateway"),
      message: "支付宝环境变量已识别。把真实签名与下单逻辑接入这里后，即可切到正式支付。",
      successUrl: `${url.origin}/pay-success.html?orderId=${orderId}`,
      failedUrl: `${url.origin}/pay-failed.html?orderId=${orderId}`,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json; charset=UTF-8" },
    }
  );
}
