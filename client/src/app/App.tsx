
import AppRouter from './AppRouter';
export default function App() { return <AppRouter />; }


// import React, { useEffect } from 'react'
// import { MemoryRouter, useNavigate } from 'react-router-dom'
// import AppRouter from './AppRouter'


// declare global {
//   interface Window {
//     electronAPI?: {
//       onNavigate: (cb: (e: any, route: string) => void) => void
//     }
//   }
// }

// export default function App() {
//   return (
//     <MemoryRouter>
//       <ElectronNavHandler />
//       <AppRouter />
//     </MemoryRouter>
//   )
// }

// function ElectronNavHandler() {
//   const navigate = useNavigate()

//   useEffect(() => {
//     if (window.electronAPI) {
//       window.electronAPI.onNavigate((_, route) => {
//         navigate(route)
//       })
//     }
//   }, [navigate])

//   return null
// }
