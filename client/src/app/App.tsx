
import AppRouter from './AppRouter';
import AuthMenuSync from './shared/components/AuthMenuSync';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ElectronNavHandler() {
	const navigate = useNavigate();
	useEffect(() => {
		// @ts-ignore preload injection
		if (window.electronAPI?.onNavigate) {
			// Avoid duplicate handlers: remove previous then add
			const handler = (_: any, route: string) => {
				if (route && typeof route === 'string') navigate(route);
			};
			window.electronAPI.onNavigate(handler);
		}
	}, [navigate]);
	return null;
}

export default function App() { return <><AuthMenuSync /><ElectronNavHandler /><AppRouter /></>; }


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
