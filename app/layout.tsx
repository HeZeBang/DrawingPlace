import { Toaster } from 'sonner'
import { RuntimeConfigProvider } from '@/components/RuntimeConfigProvider'
import { getRuntimeConfig } from '@/lib/runtime-config'
import './globals.css'

export const metadata = {
  title: 'Drawing Place',
  description: 'A collaborative drawing board',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 在服务端获取运行时配置
  const config = getRuntimeConfig();

  return (
    <html lang="en">
      <body>
        <RuntimeConfigProvider config={config}>
          {children}
        </RuntimeConfigProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
