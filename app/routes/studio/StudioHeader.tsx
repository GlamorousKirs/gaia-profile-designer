import { useEffect, useState } from "react"
import { Fullscreen, Info, LayoutGrid, Home, LibraryBig, Palette, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ThemePicker } from "~/components/ThemePicker"
import { UserAvatar } from "@/components/UserAvatar"

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
		{ name: "Home", icon: Home, href: "/" },
		{ name: "Gallery", icon: LibraryBig, href: "/gallery" },
		{ name: "Logo Recolor", icon: Palette, href: "/logo-recolor" },
		{ name: "Avatar Stylizer", icon: Wand2, href: "/avatar-stylizer" },
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
								<a
									key={link.name}
									href={link.href}
									className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
								>
									<link.icon className="size-4" />
									{link.name}
								</a>
							))}
						</nav>
					</HoverCardContent>
				</HoverCard>
				<div className="flex items-center gap-3">
					<span className="font-medium text-sm tracking-tight">Gaia Studio</span>
					<Popover>
						<PopoverTrigger>
							<Button variant="ghost" size="icon" className="size-5 rounded-full">
								<Info className="size-3.5 text-muted-foreground" />
							</Button>
						</PopoverTrigger>
						<PopoverContent side="bottom" className="w-64 text-[11px] bg-popover text-popover-foreground border-border">
							<ul className="list-disc pl-3 space-y-1">
								<li>If something worked before, now gets buggy, I probably updated it. Please clear your browser storage or remove specific data from your storage.</li>
							</ul>
						</PopoverContent>
					</Popover>
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