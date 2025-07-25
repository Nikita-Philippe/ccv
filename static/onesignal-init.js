const init = () => {
  if (!globalThis?.document) {
    console.error("Document is not defined. OneSignal initialization failed.");
    return Promise.reject("Document is not defined.");
  }

  // Get parameters from the script's own URL
  const currentScript = document.currentScript;
  const scriptUrl = new URL(currentScript.src);
  const appId = scriptUrl.searchParams.get("appId");
  const safariWebId = scriptUrl.searchParams.get("safariWebId");
  const userId = scriptUrl.searchParams.get("userId");
  const isLocal = scriptUrl.searchParams.get("isLocal") === "true";

  globalThis.OneSignalDeferred = globalThis.OneSignalDeferred || [];
  OneSignalDeferred.push(async function (OneSignal) {

    await OneSignal.init({
      appId: appId,
      safari_web_id: safariWebId,
      notifyButton: {
        enable: false,
      },
      autoResubscribe: true,
      allowLocalhostAsSecureOrigin: isLocal,
      // requiresUserPrivacyConsent: true,
      welcomeNotification: {
        title: "Welcome to ccv!",
        message: "You can now receive notifications about your daily entries and more.",
      },
    });

    // OneSignal.Debug.setLogLevel("debug");

    const currentId = OneSignal.User.externalId;

    if (userId && currentId !== userId) {
      if (currentId) await OneSignal.logout();
      await OneSignal.login(userId);
    }
  });
};

init();
