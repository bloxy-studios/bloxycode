// src/provider/linkedin.ts
import { Oauth2Provider } from "./oauth2.js";
function LinkedInAdapter(config) {
  return Oauth2Provider({
    ...config,
    type: "linkedin",
    endpoint: {
      authorization: "https://www.linkedin.com/oauth/v2/authorization",
      token: "https://www.linkedin.com/oauth/v2/accessToken"
    }
  });
}
export {
  LinkedInAdapter
};
