import { Toaster } from 'sonner'
import './globals.css'

export const metadata = {
  title: 'Drawing Place',
  description: 'A collaborative drawing board',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors />
      </body>
    </html>
  )
}
