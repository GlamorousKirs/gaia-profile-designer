import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { ANNOUNCEMENTS } from "@/data/announcement-data";

export function Announcement() {
	const [hasUnread, setHasUnread] = useState(false);
	const latestDate = ANNOUNCEMENTS[0].date;

	useEffect(() => {
		const lastRead = localStorage.getItem("announcement-last-read");
		if (lastRead !== latestDate) setHasUnread(true);
	}, [latestDate]);

	const handleOpenChange = (open: boolean) => {
		if (open) {
			localStorage.setItem("announcement-last-read", latestDate);
			setHasUnread(false);
		}
	};

	const clearStorage = () => {
		localStorage.clear();
		window.location.reload();
	};

	return (
		<Popover onOpenChange={handleOpenChange}>
			<PopoverTrigger>
				<Button variant="ghost" size="icon" className="relative rounded-full">
					<Megaphone size={18} />
					{hasUnread && (
						<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-background" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-4" align="end">
				<div className="flex flex-col gap-4">
					<h4 className="font-semibold text-sm">Announcements</h4>
					<div className="flex flex-col gap-4">
						{ANNOUNCEMENTS.map((item, index) => (
							<div key={index} className="flex flex-col gap-2">
								<div className="flex justify-between items-center">
									<p className="text-sm font-medium">{item.date}</p>
									<span className="text-[10px] text-muted-foreground">{item.timestamp}</span>
								</div>
								<p className="text-xs text-muted-foreground">{item.message}</p>
								{item.warning && (
									<p className="text-[10px] text-destructive italic">{item.warning}</p>
								)}
								<div className="flex flex-wrap gap-2 text-xs">
									{item.links.map((link, lIdx) => (
										<span key={lIdx}>
											{link.prefix}
											<a
												href={link.url}
												target="_blank"
												rel="noreferrer"
												className="text-primary underline underline-offset-4"
											>
												{link.label}
											</a>
										</span>
									))}
									{index === 1 && (
										<button
											onClick={clearStorage}
											className="text-destructive underline underline-offset-4"
										>
											Clear Storage
										</button>
									)}
								</div>
								{index < ANNOUNCEMENTS.length - 1 && <Separator className="mt-2" />}
							</div>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}