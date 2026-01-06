import BurgerMenu from "@/app/shared/components/BurgerMenu"

export const Header = () => {
    return <header className="bg-gray-900 text-white py-5 px-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-cyan-500" />
            <div className="font-extrabold tracking-wide">PawnExpress</div>
        </div>
        <div className="flex items-center gap-4">
            <div className="opacity-85">
                {new Date().toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </div>
            <BurgerMenu />
        </div>
    </header>
}