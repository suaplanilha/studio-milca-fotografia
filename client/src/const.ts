export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Studio Milca Lopes Fotografia";

export const APP_LOGO = "/logo.png";

export const COMPANY_INFO = {
  name: "Studio Milca Lopes Fotografia",
  cnpj: "53.667.873/0001-19",
  address: "Avenida Eduardo Franzão número 304",
  city: "Santa Vitória",
  state: "MG",
  zipCode: "38320-000",
  fullAddress: "Avenida Eduardo Franzão número 304 - Santa Vitória MG - CEP: 38320-000",
  developer: "@Studio Apollo Dev"
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
