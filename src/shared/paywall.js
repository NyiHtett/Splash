import ExtPay from "extpay";

const extpay = ExtPay("boba-notes");

const TRIAL_DAYS = 3;

function isTrialActive(user) {
  if (!user.trialStartedAt) return false;
  const trialEnd = new Date(user.trialStartedAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  return new Date() < trialEnd;
}

export async function checkProStatus() {
  const user = await extpay.getUser();
  const isPro = user.paid || isTrialActive(user);
  return { isPro, user };
}

export function openPaymentPage() {
  return extpay.openPaymentPage();
}

export function openTrialPage() {
  return extpay.openTrialPage("3-day");
}

export function onPaid(callback) {
  extpay.onPaid.addListener(callback);
}
