export async function onRequestPost() {
  return new Response(
    JSON.stringify({
      ok: true,
      mode: "notify-placeholder",
      message: "支付异步通知入口已预留。接入真实支付后，请在这里完成验签、订单确认和会员开通。",
    }),
    { status: 200, headers: { "content-type": "application/json; charset=UTF-8" } }
  );
}
