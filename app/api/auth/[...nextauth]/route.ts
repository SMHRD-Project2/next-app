import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import clientPromise from "@/lib/mongodb"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { Session } from "next-auth"


export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise),      // USER 컬렉션 재사용
  pages: {
    signIn: "/auth/login",                     // 실패 시 돌아올 페이지
  },
  callbacks: {
    // 세션 객체에 DB-id 넣어두기
    async session({ session, user }: { session: Session; user: any }) {
      ;(session as any).userId = user.id
      ;(session as any).role   = (user as any).role ?? "user"
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 