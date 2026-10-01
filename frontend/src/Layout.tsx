import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Header from './components/Header'

export default function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Toaster richColors theme="dark" position="top-center" />
    </>
  )
}
