import { useEffect, useState } from "react"
import { Fullscreen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
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

	return (
		<header className="sticky top-0 h-14 w-full bg-background/80 backdrop-blur-md border-b border-border/40 px-6 flex items-center justify-between z-50 shrink-0">
			<div className="flex items-center gap-4">
				<div
					className="flex items-center justify-center size-8 rounded-lg bg-foreground text-background font-bold text-sm"
					aria-hidden="true"
				>
					Δ
				</div>
				<div className="flex items-center gap-3">
					<span className="font-medium text-sm tracking-tight">Gaia Studio</span>
					<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium uppercase tracking-wider">
						<span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
						WIP
					</div>
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