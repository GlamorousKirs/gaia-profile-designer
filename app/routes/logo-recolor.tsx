"use client"

import { useState, useEffect } from "react"
import { LogoRecolor } from "@/components/LogoRecolor"
import { AnimatedBackground } from "@/components/AnimatedBackground"

export default function LogoRecolorPage() {
	const [rawSvgContent, setRawSvgContent] = useState<string>("")
	const [isSvgLoading, setIsSvgLoading] = useState(false)
	const TARGET_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1783043322/gaiaonline-svg-logo_zfldzp.svg"

	useEffect(() => {
		const fetchAndSanitizeSvg = async () => {
			setIsSvgLoading(true)
			try {
				const response = await fetch(TARGET_SVG_URL)
				const text = await response.text()
				setRawSvgContent(text)
			} catch (err) {
				console.error("SVG fetch failed", err)
			} finally {
				setIsSvgLoading(false)
			}
		}
		fetchAndSanitizeSvg()
	}, [])

	return (
		<AnimatedBackground>
			<div className="flex items-center justify-center min-h-screen p-8">
				<div className="max-w-3xl w-full bg-background border rounded-xl shadow-2xl overflow-hidden">
					<LogoRecolor 
						rawSvgContent={rawSvgContent} 
						isSvgLoading={isSvgLoading} 
						onSave={(url) => {
							console.log("Saved Logo URL:", url)
							alert("Logo applied!")
						}} 
					/>
				</div>
			</div>
		</AnimatedBackground>
	)
}