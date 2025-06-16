import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import clientPromise from "@/lib/mongodb"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { Session } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise),
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async session({ session, user }: { session: Session; user: any }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role ?? "user";
      }
      return session;
    },
  },
})

export { handler as GET, handler as POST } 