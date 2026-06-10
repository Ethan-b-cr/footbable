export async function onRequestPost() {
  return new Response(
    JSON.stringify({
      ok: false,
      message: "支付异步通知占位接口已创建。接入真实支付后，请在这里完成验签、订单确认和会员开通。",
    }),
    { status: 501, headers: { "content-type": "application/json; charset=UTF-8" } }
  );
}
