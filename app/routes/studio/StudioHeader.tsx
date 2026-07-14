import { useEffect, useState } from "react"
import { Link } from "react-router"
import { Fullscreen, LayoutGrid, Home, LibraryBig, Palette, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ThemePicker } from "~/components/ThemePicker"
import { UserAvatar } from "@/components/UserAvatar"
import { Announcement } from "@/components/Announcement"

interface StudioHeaderProps {
	onOpenProfile: () => void
	version: "v1" | "v2"
	onVersionChange: (version: "v1" | "v2") => void
}

export function StudioHeader({ onOpenProfile, version, onVersionChange }: StudioHeaderProps) {
	const [isFullscreen, setIsFullscreen] = useState(false)

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}

		document.addEventListener("fullscreenchange", handleFullscreenChange)
		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange)
		}
	}, [])

	const toggleFullscreen = async () => {
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen()
			} else {
				await document.exitFullscreen()
			}
		} catch (error) {
			console.error("Error changing fullscreen mode:", error)
		}
	}

	const navLinks = [
		{ name: "Home", icon: Home, to: "/" },
		{ name: "Gallery", icon: LibraryBig, to: "/gallery" },
		{ name: "Logo Recolor", icon: Palette, to: "/logo-recolor" },
		{ name: "Avatar Stylizer", icon: Wand2, to: "/avatar-stylizer" },
	]

	return (
		<header className="sticky top-0 h-14 w-full bg-background/80 backdrop-blur-md border-b border-border/40 px-6 flex items-center justify-between z-50 shrink-0">
			<div className="flex items-center gap-4">
				<HoverCard>
					<HoverCardTrigger delay={10} closeDelay={100}>
						<Button variant="ghost" size="icon" className="size-9 rounded-full">
							<LayoutGrid className="size-4" />
						</Button>
					</HoverCardTrigger>
					<HoverCardContent side="bottom" align="start" className="w-48 p-2">
						<nav className="flex flex-col gap-1">
							{navLinks.map((link) => (
								<Link
									key={link.name}
									to={link.to}
									className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
								>
									<link.icon className="size-4" />
									{link.name}
								</Link>
							))}
						</nav>
					</HoverCardContent>
				</HoverCard>
				<div className="flex items-center gap-3">
					<span className="font-medium text-sm tracking-tight">Gaia Studio</span>
				</div>
			</div>

			<div className="flex-1 flex justify-center">
				<Select
					value={version}
					onValueChange={(val: string | null) => {
						if (val === "v1" || val === "v2") {
							onVersionChange(val)
						}
					}}
				>
					<SelectTrigger className="h-9 w-40 text-xs font-medium bg-muted/50 border-none hover:bg-muted transition-colors">
						<SelectValue>
							{version === "v1" ? "Classic (V1)" : "Current (V2)"}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="v1">Classic (V1)</SelectItem>
						<SelectItem value="v2">Current (V2)</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center gap-2" role="toolbar" aria-label="Header actions">
				<Announcement />

				<div className="h-4 w-px bg-border mx-1" />

				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
					onClick={toggleFullscreen}
					title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
				>
					<Fullscreen className="size-4" aria-hidden="true" />
				</Button>

				<div className="h-4 w-px bg-border mx-1" />

				<ThemePicker />
				<div className="ml-2">
					<UserAvatar onOpenProfile={onOpenProfile} />
				</div>
			</div>
		</header>
	)
}