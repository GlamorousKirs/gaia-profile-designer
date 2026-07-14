import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";

export function Announcement() {
	const ANNOUNCEMENT_DATE = "Update #1";
	
	const [hasUnread, setHasUnread] = useState(false);

	useEffect(() => {
		const lastRead = localStorage.getItem("announcement-last-read");
		if (lastRead !== ANNOUNCEMENT_DATE) {
			setHasUnread(true);
		}
	}, []);

	const handleOpen = (open: boolean) => {
		if (open && hasUnread) {
			localStorage.setItem("announcement-last-read", ANNOUNCEMENT_DATE);
			setHasUnread(false);
		}
	};

	const clearStorage = async () => {
		localStorage.clear();
		sessionStorage.clear();

		const databases = await indexedDB.databases();
		databases.forEach((db) => {
			if (db.name) {
				indexedDB.deleteDatabase(db.name);
			}
		});

		const cookies = document.cookie.split(";");
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i];
			const eqPos = cookie.indexOf("=");
			const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
			document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
		}

		window.location.reload();
	};

	return (
		<Popover onOpenChange={handleOpen}>
			<PopoverTrigger>
				<Button variant="ghost" size="icon" className="size-8 rounded-full relative">
					<Megaphone size={18} />
					{hasUnread && (
						<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-background" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
							{ANNOUNCEMENT_DATE}
						</h4>
						<p className="text-sm">
							There's some changes made. If you can't save data, please{" "}
							<button 
								onClick={clearStorage}
								className="text-primary underline underline-offset-4 font-medium"
							>
								clear your browser storage
							</button>
							. Sorry for the inconvenience!
						</p>
						<p className="text-sm">
							Have feedback?{" "}
							<a
								href="https://www.gaiaonline.com/profiles/sunkirs/20150259/?mode=addcomment"
								target="_blank"
								rel="noreferrer"
								className="text-primary underline underline-offset-4 font-medium"
							>
								Let me know
							</a>
						</p>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}