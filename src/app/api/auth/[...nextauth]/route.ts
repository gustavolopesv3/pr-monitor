import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
    providers: [
        GithubProvider({
          clientId: String(process.env.GITHUB_ID),
          clientSecret: String(process.env.GITHUB_SECRET),
          authorization: {
            params: {
              scope: "read:user user:email repo",
            },
          },
          
        }),
      ],
      callbacks: {
        async jwt({token, account}) {
            if(account?.access_token) {
                token.accessToken = account.access_token
            }
            return {
                ...token,
            }
        },
        async session({session, token}) {
            return {
                ...session,
                accessToken: token,
            }
        }
      }
});

export { handler as GET, handler as POST };
