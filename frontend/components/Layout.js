import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => router.push('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="text-3xl">🏆</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                مسابقات ورزشی
              </span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              <span>🏠</span>
              <span className="font-medium">خانه</span>
            </button>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">
          <p>ساخته شده با ❤️ برای مدیریت مسابقات ورزشی</p>
        </div>
      </footer>
    </div>
  );
}
