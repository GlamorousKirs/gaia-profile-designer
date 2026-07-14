import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function Announcement() {
    return (
        <Popover>
            <PopoverTrigger>
                <Button variant="ghost" size="icon" className="size-8 rounded-full">
                    <Megaphone size={18} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            There's some changes made. If you can't save data, please clear your browser storage. Sorry for the inconvenience! 14/7/26
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}