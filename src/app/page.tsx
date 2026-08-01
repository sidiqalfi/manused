import { auth, signOut } from "@/auth"
import { SignIn } from "@/components/sign-in"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-zinc-900">
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-md text-center max-w-md w-full border border-gray-100 dark:border-zinc-700">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Berhasil Login! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Selamat datang kembali, <span className="font-semibold text-gray-900 dark:text-white">{session.user.name || session.user.email}</span>!
          </p>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-6 bg-gray-100 dark:bg-zinc-700/50 p-4 rounded-lg text-left space-y-1">
            <p><span className="font-semibold">Email:</span> {session.user.email}</p>
            <p><span className="font-semibold">User ID:</span> {session.user.id}</p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition shadow-sm"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gray-50 dark:bg-zinc-900">
      <SignIn />
    </main>
  )
}
