(() => {
  const params = new URLSearchParams(window.location.search);
  const queryApiBase = params.get("payApi");
  const storedApiBase = window.localStorage.getItem("footbablePaymentApiBase");
  const configuredApiBase = queryApiBase || storedApiBase || window.location.origin;

  if (queryApiBase) {
    window.localStorage.setItem("footbablePaymentApiBase", queryApiBase);
  }

  window.FOOTBABLE_CONFIG = {
    paymentApiBase: configuredApiBase.replace(/\/$/, ""),
    paymentMode: "public-self-host",
  };
})();
