"use client"

import { useState, useEffect } from "react"
import { AvatarAnimator } from "@/components/AvatarAnimation"
import { AnimatedBackground } from "@/components/AnimatedBackground"

const DEFAULT_AVATAR = "https://a1cdn.gaiaonline.com/dress-up/avatar/ava/f3/77/5e4a907513377f3.png"

export default function AvatarAnimatorPage() {
	const [avatarUrl, setAvatarUrl] = useState<string>("")

	useEffect(() => {
		try {
			const storedData = localStorage.getItem("gstudio-user")
			if (storedData) {
				const parsed = JSON.parse(storedData)
				if (parsed?.state?.avatarUrl) {
					setAvatarUrl(parsed.state.avatarUrl)
					return
				}
			}
		} catch (err) {
			console.error("Failed to read from localStorage", err)
		}
		setAvatarUrl(DEFAULT_AVATAR)
	}, [])

	if (!avatarUrl) {
		return null
	}

	return (
		<AnimatedBackground>
			<div className="flex items-center justify-center min-h-screen p-8">
				<div className="max-w-4xl w-full bg-background border rounded-xl shadow-xl overflow-hidden">
					<AvatarAnimator initialAvatarUrl={avatarUrl} />
				</div>
			</div>
		</AnimatedBackground>
	)
}