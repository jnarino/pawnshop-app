
import { logout } from 'app/core/redux/authSlice';
import { AppDispatch, RootState } from 'app/core/redux/store';
import { useDispatch, useSelector } from 'react-redux';


export default function AppHeader() {
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector((s: RootState) => s.auth.user);
    if (!user) return null;
    return (
        <div className="w-full flex items-center justify-between p-3 border-b">
            <div>Signed in as <b>{user.username}</b> ({user.roles.join(', ')})</div>
            <button className="border rounded px-3 py-1" onClick={() => dispatch(logout())}>Logout</button>
        </div>
    );
}
