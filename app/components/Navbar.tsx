'use client'

import { useState, useEffect, useRef, memo, useTransition } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { Sparkles, Menu, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemePicker } from "@/components/ThemePicker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProfileStore } from "@/store/useProfileStore"
import { LocalProfile } from "./LocalProfile"

const NAV_LINKS = [
	{ name: "Home", to: "/" },
	{ name: "Gallery", to: "/gallery" },
] as const


const baseUrl = import.meta.env.BASE_URL;

const TOOL_LINKS = [
	{ name: "Logo Recolor", to: "/logo-recolor", desc: "Recolor the Gaia logo for your profile header.", image: `${baseUrl}optimized-assets/logo-recolor-preview.webp` },
	{ name: "Avatar Animator", to: "/avatar-animation", desc: "Stylize your friend's or your avatar for your profile.", image: `${baseUrl}optimized-assets/avatar-animator.webp` },
] as const

interface UserAvatarProps {
	onOpenProfile: () => void
	username: string
	userId: string
	avatarUrl: string
}

export const UserAvatar = memo(function UserAvatar({
	onOpenProfile,
	username,
	userId,
	avatarUrl,
}: UserAvatarProps) {
	const navigate = useNavigate()

	const displayName = username || "Guest"
	const displayId = userId || "No ID"
	const initial = username?.[0]?.toUpperCase() || "U"

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button
					variant="ghost"
					size="icon"
					className="size-8 rounded-full cursor-pointer shrink-0"
					aria-label="User menu"
				>
					<Avatar className="relative size-8 overflow-hidden">
						{avatarUrl ? (
							<AvatarImage
								src={avatarUrl}
								alt={displayName}
								loading="lazy"
								className="h-27.5 w-20 max-w-none -ml-4.5 -mt-6 object-cover"
							/>
						) : (
							<AvatarFallback>{initial}</AvatarFallback>
						)}
					</Avatar>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-56 z-55">
				<div className="flex flex-col p-2">
					<span className="text-sm font-medium">{displayName}</span>
					<span className="text-xs font-normal text-muted-foreground truncate max-w-full">
						{displayId}
					</span>
				</div>
				<div className="my-1 h-px bg-border" />
				<div onClick={onOpenProfile} className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground">
					Edit Local Profile
				</div>
				<div onClick={() => navigate("/settings")} className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground">
					Settings
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
})
UserAvatar.displayName = "UserAvatar"

const MobileDropdown = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
	<div
		role="navigation"
		aria-label="Mobile navigation"
		data-lenis-prevent
		className={`absolute left-0 top-20 w-full bg-background/95 backdrop-blur-xl border-b border-border transition-all duration-200 ease-in-out origin-top lg:hidden ${isOpen
			? "opacity-100 translate-y-0 pointer-events-auto"
			: "opacity-0 -translate-y-2 pointer-events-none"
			}`}
	>
		<div className="container mx-auto flex flex-col items-center gap-4 px-6 py-8">
			{NAV_LINKS.map((link) => (
				<Link key={link.to} to={link.to} onClick={onClose} className="text-on-surface py-2 text-sm font-bold uppercase tracking-widest hover:text-primary">
					{link.name}
				</Link>
			))}
			{TOOL_LINKS.map((link) => (
				<Link key={link.to} to={link.to} onClick={onClose} className="text-on-surface py-2 text-sm font-bold uppercase tracking-widest hover:text-primary">
					{link.name}
				</Link>
			))}
		</div>
	</div>
))
MobileDropdown.displayName = "MobileDropdown"

const MenuButton = memo(({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => (
	<button
		onClick={onClick}
		className="bg-surface rounded-xl border border-border p-2.5 lg:hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
		aria-expanded={isOpen}
		aria-label={isOpen ? "Close main menu" : "Open main menu"}
	>
		{isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
	</button>
))
MenuButton.displayName = "MenuButton"

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const [isProfileOpen, setIsProfileOpen] = useState(false)
	const [isToolsOpen, setIsToolsOpen] = useState(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const [, startTransition] = useTransition()
	const location = useLocation()
	const sentinelRef = useRef<HTMLDivElement>(null)

	const username = useProfileStore((state) => state.username)
	const userId = useProfileStore((state) => state.userId)
	const avatarUrl = useProfileStore((state) => state.avatarUrl)

	const hasUserData = !!(username || userId || avatarUrl)

	const handleMouseEnter = () => {
		if (timerRef.current) clearTimeout(timerRef.current)
		setIsToolsOpen(true)
	}

	const handleMouseLeave = () => {
		timerRef.current = setTimeout(() => {
			setIsToolsOpen(false)
		}, 150)
	}

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => setIsScrolled(!entry.isIntersecting),
			{ threshold: [0], rootMargin: "-20px 0px 0px 0px" }
		)
		if (sentinelRef.current) observer.observe(sentinelRef.current)
		return () => observer.disconnect()
	}, [])

	useEffect(() => { setIsOpen(false) }, [location.pathname])

	const handleToggle = () => startTransition(() => setIsOpen(prev => !prev))
	const handleClose = () => startTransition(() => setIsOpen(false))

	if (location.pathname === "/studio") return null

	return (
		<>
			<style>{`
				@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
				@keyframes shimmer-spin { to { --angle: 360deg; } }
			`}</style>
			<div ref={sentinelRef} className="absolute top-0 h-5 w-full pointer-events-none" />

			<nav className="fixed top-0 left-0 z-50 w-full will-change-transform">
				<div className={`absolute inset-0 -z-10 transition-opacity duration-300 ${isScrolled || isOpen || isToolsOpen ? "bg-background/80 backdrop-blur-xl opacity-100" : "bg-transparent opacity-0"}`} />
				<div className="container mx-auto px-4 md:px-6 relative z-10">
					<div className="flex h-20 items-center justify-between">
						<Link to="/" className="group flex items-center gap-2.5">
							<div className="bg-surface p-2 rounded-xl border border-border"><Sparkles size={20} className="text-primary" /></div>
							<div className="flex flex-col"><span className="text-sm font-bold uppercase">Gaia</span><span className="text-[10px] font-black text-primary uppercase">Profile Design</span></div>
						</Link>

						<div className="bg-surface/40 hidden lg:flex items-center rounded-2xl border border-border p-1.5 backdrop-blur-md">
							{NAV_LINKS.map((link) => (
								<Link key={link.to} to={link.to} className="px-5 py-2 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">{link.name}</Link>
							))}
							
							<div 
								className="relative"
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}
							>
								<button className="px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-primary outline-hidden">
									Tools <ChevronDown size={12} className={`transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
								</button>

								<AnimatePresence>
									{isToolsOpen && (
										<motion.div
											initial={{ opacity: 0, y: 10, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: 10, scale: 0.95 }}
											transition={{ duration: 0.2, ease: "easeOut" }}
											className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-screen max-w-3xl px-4"
										>
											<div className="bg-background backdrop-blur-xl border border-border rounded-3xl p-6 shadow-2xl">
												<div className="grid grid-cols-2 gap-6">
													{TOOL_LINKS.map((tool) => (
														<motion.div
															key={tool.to}
															whileHover={{ y: -4 }}
															transition={{ duration: 0.2, ease: "easeInOut" }}
														>
															<Link to={tool.to} className="block overflow-hidden rounded-2xl border border-border hover:border-border transition-colors">
																<div className="aspect-video w-full overflow-hidden rounded-2xl">
																	<img src={tool.image} alt={tool.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
																</div>
																<div className="p-4">
																	<div className="font-bold text-sm">{tool.name}</div>
																	<div className="text-xs text-muted-foreground mt-1">{tool.desc}</div>
																</div>
															</Link>
														</motion.div>
													))}
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<ThemePicker />
							{hasUserData && <UserAvatar onOpenProfile={() => setIsProfileOpen(true)} username={username} userId={userId} avatarUrl={avatarUrl} />}
							<button className="relative p-[1.5px] bg-transparent rounded-full overflow-hidden group shrink-0">
								<div className="absolute inset-0" style={{ background: 'conic-gradient(from var(--angle), transparent 25%, var(--primary), transparent 50%)', animation: 'shimmer-spin 2.5s linear infinite' }} />
								<Link to="/studio" className="relative z-10 flex px-4 py-2 text-sm font-bold uppercase tracking-wider bg-card rounded-full">Studio</Link>
							</button>
							<MenuButton isOpen={isOpen} onClick={handleToggle} />
						</div>
					</div>
				</div>
				<MobileDropdown isOpen={isOpen} onClose={handleClose} />
			</nav>
			<LocalProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
		</>
	)
}