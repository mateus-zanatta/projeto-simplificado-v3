import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

import Layout from './Layout.tsx'
import App from './App.tsx'
import Detalhes from './Detalhes.tsx'
import Acesso from './Acesso.tsx'
import MinhaConta from './MinhaConta.tsx'

import AdminLogin from './admin/AdminLogin.tsx'
import AdminCadastro from './admin/AdminCadastro.tsx'
import AdminPainel from './admin/AdminPainel.tsx'
import AdminDashboard from './admin/AdminDashboard.tsx'

const rotas = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <App /> },
      { path: 'shows/:id', element: <Detalhes /> },
      { path: 'entrar', element: <Acesso /> },
      { path: 'cadastro', element: <Acesso /> },
      { path: 'minha-conta', element: <MinhaConta /> },
      { path: 'admin/entrar', element: <AdminLogin /> },
      { path: 'admin/cadastro', element: <AdminCadastro /> },
      { path: 'admin', element: <AdminPainel /> },
      { path: 'admin/dashboard', element: <AdminDashboard /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={rotas} />
  </StrictMode>,
)
