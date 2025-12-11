import { Toaster } from 'sonner'
import { RuntimeConfigProvider } from '@/components/RuntimeConfigProvider'
import './globals.css'

export const metadata = {
  title: 'Drawing Place',
  description: 'A collaborative drawing board',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RuntimeConfigProvider>
          {children}
        </RuntimeConfigProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
