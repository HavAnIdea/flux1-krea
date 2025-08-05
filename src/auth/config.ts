import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { handleSignInUser } from "./handler";

// 本地开发代理配置
if (
  process.env.NODE_ENV === 'development' &&
  process.env.HTTPS_PROXY
) {
  const proxyUrl = process.env.HTTPS_PROXY;
  process.env.HTTP_PROXY = proxyUrl;
  process.env.HTTPS_PROXY = proxyUrl;
  process.env.ALL_PROXY = proxyUrl;

  try {
    const { setGlobalDispatcher, ProxyAgent } = require('undici');
    const proxyAgent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(proxyAgent);
  } catch (error) {
    // 静默处理错误，使用环境变量作为备用方案
  }
}

let providers: Provider[] = [];

// Google One Tap Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
) {
  providers.push(
    CredentialsProvider({
      id: "google-one-tap",
      name: "google-one-tap",

      credentials: {
        credential: { type: "text" },
      },

      async authorize(credentials, req) {
        const googleClientId = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID;
        if (!googleClientId) {
          console.log("invalid google auth config");
          return null;
        }

        const token = credentials!.credential;

        const response = await fetch(
          "https://oauth2.googleapis.com/tokeninfo?id_token=" + token
        );
        if (!response.ok) {
          console.log("Failed to verify token");
          return null;
        }

        const payload = await response.json();
        if (!payload) {
          console.log("invalid payload from token");
          return null;
        }

        const {
          email,
          sub,
          given_name,
          family_name,
          email_verified,
          picture: image,
        } = payload;
        if (!email) {
          console.log("invalid email in payload");
          return null;
        }

        const user = {
          id: sub,
          name: [given_name, family_name].join(" "),
          email,
          image,
          emailVerified: email_verified ? new Date() : null,
        };

        return user;
      },
    })
  );
}

// Google Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // 明确指定 callback URL
      ...(process.env.NEXT_PUBLIC_WEB_URL && {
        callbackUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/api/auth/callback/google`,
        authorization: {
          params: {
            redirect_uri: `${process.env.NEXT_PUBLIC_WEB_URL}/api/auth/callback/google`,
          },
        },
      }),
    })
  );
}

// Github Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" &&
  process.env.AUTH_GITHUB_ID &&
  process.env.AUTH_GITHUB_SECRET
) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // 使用环境变量中的 URL 作为回调地址的基础
      ...(process.env.NEXT_PUBLIC_WEB_URL && {
        authorization: {
          params: {
            redirect_uri: `${process.env.NEXT_PUBLIC_WEB_URL}/api/auth/callback/github`,
          },
        },
      }),
    })
  );
}

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "google-one-tap");

export const authOptions: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/auth/signin",
  },
  // 使用环境变量中的 URL 作为 base URL
  basePath: "/api/auth",
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  useSecureCookies: true,
  callbacks: {
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 使用环境变量中的 URL 作为 baseUrl
      const appUrl = process.env.NEXT_PUBLIC_WEB_URL;
      if (url.startsWith("/")) return `${appUrl || baseUrl}${url}`;
      else if (new URL(url).origin === (appUrl || baseUrl)) return url;
      return appUrl || baseUrl;
    },
    async session({ session, token, user }) {
      if (token && token.user && token.user) {
        session.user = token.user;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      try {
        if (!user || !account) {
          return token;
        }

        const userInfo = await handleSignInUser(user, account);
        if (!userInfo) {
          throw new Error("save user failed");
        }

        token.user = {
          uuid: userInfo.uuid,
          email: userInfo.email,
          nickname: userInfo.nickname,
          avatar_url: userInfo.avatar_url,
          created_at: userInfo.created_at,
        };

        return token;
      } catch (e) {
        console.error("jwt callback error:", e);
        return token;
      }
    },
  },
};