import { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Image, X, Check, ShieldCheck, PenTool, CornerUpRight } from "lucide-react"
import { useProfileStore } from "@/store/useProfileStore"

interface LocalProfileProps {
  isOpen: boolean
  onClose: () => void
}

const SAFE_URL_REGEX = /^https?:\/\//i

export function LocalProfile({ isOpen, onClose }: LocalProfileProps) {
  const store = useProfileStore()
  const [mounted, setMounted] = useState(false)

  const [username, setUsername] = useState("")
  const [userId, setUserId] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setUsername(store.username || "")
      setUserId(store.userId || "")
      setAvatarUrl(store.avatarUrl || "")
    }
  }, [isOpen, store.username, store.userId, store.avatarUrl])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const hasData = useMemo(() =>
    store.username !== "" || store.userId !== "" || store.avatarUrl !== "",
    [store.username, store.userId, store.avatarUrl]
  )

  const isSafeAvatar = useMemo(() => {
    if (!avatarUrl) return false
    return SAFE_URL_REGEX.test(avatarUrl.trim())
  }, [avatarUrl])

  const handleSave = () => {
    const trimmedAvatar = avatarUrl.trim()
    const sanitizedAvatar = trimmedAvatar ? trimmedAvatar.split('?')[0] : ""

    let finalAvatar = ""
    if (sanitizedAvatar) {
      finalAvatar = SAFE_URL_REGEX.test(sanitizedAvatar)
        ? sanitizedAvatar
        : `https://${sanitizedAvatar.replace(/^\/+/g, "")}`
    }

    store.setProfile({
      username: username.trim(),
      userId: userId.trim(),
      avatarUrl: finalAvatar
    })

    window.dispatchEvent(new Event('profile-updated'))
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg bg-background/95 border border-primary/20 p-6 rounded-2xl shadow-2xl relative overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-xl font-black tracking-tighter text-primary">STUDIO</span>
                <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                      <span className="text-[8px] font-mono opacity-40 text-muted-foreground">user</span>
                    </div>
                    <Input
                      className="bg-primary/5 border-primary/10"
                      placeholder="gaia_user"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">User ID</Label>
                    <Input
                      className="bg-primary/5 border-primary/10"
                      placeholder="0000"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Avatar Source</Label>
                  <Input
                    className="bg-primary/5 border-primary/10 font-mono text-xs"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="size-20 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                    {isSafeAvatar ? (
                      <img
                        src={avatarUrl.trim()}
                        alt="Preview"
                        className="size-full object-cover"
                        onError={(e) => {
                          ; (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <Image className="size-6 text-primary/20" />
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="size-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Privacy Notice</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      These details are stored <strong>locally in your browser</strong>. Your avatar replaces the default one in the Details panel, while your username and Gaia ID are used to generate theme credits in your editor. You can leave any of these fields blank if you prefer.                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-12 px-5 font-black uppercase tracking-widest gap-2 border-primary/20 text-muted-foreground hover:text-foreground"
                >
                  <CornerUpRight className="size-4" />
                  Skip
                </Button>

                <Button
                  onClick={handleSave}
                  className="flex-1 h-12 font-black uppercase tracking-widest gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {hasData ? (
                    <> <Check className="size-4" /> Apply Changes </>
                  ) : (
                    <> <PenTool className="size-4" /> Initialize Profile </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}