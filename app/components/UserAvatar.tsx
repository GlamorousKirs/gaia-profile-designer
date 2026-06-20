import { memo } from "react"
import { useNavigate } from "react-router"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProfileStore } from "@/store/useProfileStore"

interface UserAvatarProps {
  onOpenProfile: () => void
}

export const UserAvatar = memo(function UserAvatar({
  onOpenProfile,
}: UserAvatarProps) {
  const navigate = useNavigate()
  
  const username = useProfileStore((state) => state.username)
  const userId = useProfileStore((state) => state.userId)
  const avatarUrl = useProfileStore((state) => state.avatarUrl)

  const displayName = username || "Guest"
  const displayId = userId || "No ID"
  const initial = username?.[0]?.toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          aria-label="User menu"
        >
          <Avatar className="relative size-8 overflow-hidden">
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
                loading="lazy"
                className="h-27.5 w-20 max-w-none -ml-4.5 -mt-6"
              />
            ) : (
              <AvatarFallback>{initial}</AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {displayId}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onOpenProfile} className="cursor-pointer">
            {username ? "Edit Local Profile" : "Setup Local Profile"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})