import { useState, useMemo, useEffect } from "react";
import { Download, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ColorPicker } from "@/components/colorpicker/ColorPicker";
import { useProfileStore } from "@/store/useProfileStore";

const PRESET_IMAGES = [
	{
		label: "Body",
		url: "https://a1cdn.gaiaonline.com/dress-up/avatar/ava/f3/77/5e4a907513377f3.png"
	},
	{
		label: "Bust",
		url: "https://a1cdn.gaiaonline.com/dress-up/avatar/ava/f3/77/5e4a907513377f3_96x96.png"
	},
	{
		label: "Head",
		url: "https://a1cdn.gaiaonline.com/dress-up/avatar/ava/f3/77/5e4a907513377f3_48x48.gif"
	}
];

const KEYFRAME_TEMPLATES: Record<string, string> = {
	bounce: "@keyframes bounce {\n\t0% { transform: translateY(0); }\n\t100% { transform: translateY(-8px); }\n}\n",
	pulse: "@keyframes pulse {\n\t0% { transform: scale(1); }\n\t100% { transform: scale(1.05); }\n}\n",
	spin: "@keyframes spin {\n\t0% { transform: rotate(0deg); }\n\t100% { transform: rotate(360deg); }\n}\n",
	hover_bounce: "@keyframes hover_bounce {\n\t0% { transform: translateY(0); }\n\t100% { transform: translateY(-8px); }\n}\n",
	hover_pulse: "@keyframes hover_pulse {\n\t0% { transform: scale(1); }\n\t100% { transform: scale(1.05); }\n}\n",
	hover_spin: "@keyframes hover_spin {\n\t0% { transform: rotate(0deg); }\n\t100% { transform: rotate(360deg); }\n}\n"
};

function FilterSlider({ label, value, onChange, min = 0, max = 100, step = 1, suffix = "%" }: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
	step?: number;
	suffix?: string;
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-[10px] uppercase font-bold tracking-wider">{label} ({value}{suffix})</Label>
			<Slider
				value={[value]}
				onValueChange={(val) => onChange(Array.isArray(val) ? val[0] : val)}
				min={min}
				max={max}
				step={step}
				className="py-2 w-full"
			/>
		</div>
	);
}

function AnimationControls({ type, setType, duration, setDuration, timing, setTiming, playState, setPlayState }: {
	type: string;
	setType: (v: string) => void;
	duration: number;
	setDuration: (v: number) => void;
	timing: string;
	setTiming: (v: string) => void;
	playState: string;
	setPlayState: (v: string) => void;
}) {
	return (
		<div className="space-y-4 pt-1 pl-2 border-l-2 border-muted">
			<div className="space-y-1.5">
				<Label className="text-[10px] uppercase font-bold tracking-wider">Animation Type</Label>
				<Select value={type} onValueChange={(val) => { if (val) setType(val); }}>
					<SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
					<SelectContent>
						<SelectItem value="bounce">Bounce</SelectItem>
						<SelectItem value="pulse">Pulse</SelectItem>
						<SelectItem value="spin">Spin</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1.5">
				<Label className="text-[10px] uppercase font-bold tracking-wider">Speed ({duration}s)</Label>
				<Slider
					value={[duration]}
					onValueChange={(val) => setDuration(Array.isArray(val) ? val[0] : val)}
					min={0.1}
					max={10}
					step={0.1}
					className="py-2 w-full"
				/>
			</div>

			<div className="space-y-1.5">
				<Label className="text-[10px] uppercase font-bold tracking-wider">Timing Function</Label>
				<Select value={timing} onValueChange={(val) => { if (val) setTiming(val); }}>
					<SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
					<SelectContent>
						<SelectItem value="ease-in-out">Ease In Out</SelectItem>
						<SelectItem value="linear">Linear</SelectItem>
						<SelectItem value="ease">Ease</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1.5">
				<Label className="text-[10px] uppercase font-bold tracking-wider">Play State</Label>
				<Select value={playState} onValueChange={(val) => { if (val) setPlayState(val); }}>
					<SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
					<SelectContent>
						<SelectItem value="running">Running</SelectItem>
						<SelectItem value="paused">Paused</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

function CollapsibleFilters({ grayscale, setGrayscale, brightness, setBrightness, contrast, setContrast }: {
	grayscale: number;
	setGrayscale: (v: number) => void;
	brightness: number;
	setBrightness: (v: number) => void;
	contrast: number;
	setContrast: (v: number) => void;
}) {
	return (
		<Accordion className="w-full rounded-lg px-2">
			<AccordionItem value="visual-filters" className="border-b-0">
				<AccordionTrigger className="py-2 hover:no-underline text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
					Other Filters
				</AccordionTrigger>
				<AccordionContent className="space-y-4 pt-1 pb-2">
					<FilterSlider label="Grayscale" value={grayscale} onChange={setGrayscale} max={100} />
					<FilterSlider label="Brightness" value={brightness} onChange={setBrightness} min={0} max={200} />
					<FilterSlider label="Contrast" value={contrast} onChange={setContrast} min={0} max={200} />
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

export function AvatarAnimator({ initialAvatarUrl = PRESET_IMAGES[0].url }) {
	const profile = useProfileStore();
	const [avatarUrl, setAvatarUrl] = useState<string>(profile.avatarUrl || initialAvatarUrl);

	const templateImages = useMemo(() => {
		if (profile.avatarUrl) {
			const [path, queryString] = profile.avatarUrl.split('?');
			const query = queryString ? `?${queryString}` : '';

			const base = path.replace(/_96x96|_48x48|_flip/g, '');
			const extension = base.endsWith('.gif') ? '.gif' : '.png';
			const cleanBase = base.replace(/\.png|\.gif/g, '');

			return [
				{ label: "Body", url: `${cleanBase}${extension}${query}` },
				{ label: "Bust", url: `${cleanBase}_96x96${extension}${query}` },
				{ label: "Head", url: `${cleanBase}_48x48.gif${query}` }
			];
		}
		return PRESET_IMAGES;
	}, [profile.avatarUrl]);

	useEffect(() => {
		if (profile.avatarUrl) {
			setAvatarUrl(profile.avatarUrl);
		}
	}, [profile.avatarUrl]);

	const [imgError, setImgError] = useState<boolean>(false);
	const [hasDefaultStyles, setHasDefaultStyles] = useState<boolean>(false);
	const [borderRadius, setBorderRadius] = useState<number>(0);
	const [shadowColor, setShadowColor] = useState<string>("#3b82f6");
	const [shadowBlur, setShadowBlur] = useState<number>(0);
	const [grayscale, setGrayscale] = useState<number>(0);
	const [brightness, setBrightness] = useState<number>(100);
	const [contrast, setContrast] = useState<number>(100);
	const [hasDefaultAnimation, setHasDefaultAnimation] = useState<boolean>(false);
	const [animationType, setAnimationType] = useState<string>("bounce");
	const [duration, setDuration] = useState<number>(3);
	const [timingFunction, setTimingFunction] = useState<string>("ease-in-out");
	const [animationPlayState, setAnimationPlayState] = useState<string>("running");

	const [hasHoverStyles, setHasHoverStyles] = useState<boolean>(false);
	const [hoverShadowColor, setHoverShadowColor] = useState<string>("#ef4444");
	const [hoverShadowBlur, setHoverShadowBlur] = useState<number>(0);
	const [hoverGrayscale, setHoverGrayscale] = useState<number>(0);
	const [hoverBrightness, setHoverBrightness] = useState<number>(100);
	const [hoverContrast, setHoverContrast] = useState<number>(100);
	const [hasHoverAnimation, setHasHoverAnimation] = useState<boolean>(false);
	const [hoverAnimationType, setHoverAnimationType] = useState<string>("pulse");
	const [hoverDuration, setHoverDuration] = useState<number>(0.5);
	const [hoverTimingFunction, setHoverTimingFunction] = useState<string>("ease-in-out");
	const [hoverAnimationPlayState, setHoverAnimationPlayState] = useState<string>("running");

	const generatedCss = useMemo(() => {
		const normalKeyframes = (hasDefaultStyles && hasDefaultAnimation) ? (KEYFRAME_TEMPLATES[animationType] || "") : "";
		const hoverKeyframes = (hasHoverStyles && hasHoverAnimation) ? (KEYFRAME_TEMPLATES[`hover_${hoverAnimationType}`] || "") : "";

		const defaultAnimationExpression = hasDefaultStyles && hasDefaultAnimation
			? `\n\tanimation: ${animationType} ${duration}s ${timingFunction} infinite alternate;\n\tanimation-play-state: ${animationPlayState};`
			: "";

		let hoverSelectorExpression = "";
		if (hasHoverStyles) {
			const hoverFilters = [
				hoverShadowBlur > 0 ? `drop-shadow(0px 0px ${hoverShadowBlur}px ${hoverShadowColor})` : "",
				hoverGrayscale > 0 ? `grayscale(${hoverGrayscale}%)` : "",
				hoverBrightness !== 100 ? `brightness(${hoverBrightness}%)` : "",
				hoverContrast !== 100 ? `contrast(${hoverContrast}%)` : ""
			].filter(Boolean).join(" ");

			const hoverAnimationExpression = hasHoverAnimation
				? `\n\tanimation: hover_${hoverAnimationType} ${hoverDuration}s ${hoverTimingFunction} infinite alternate;\n\tanimation-play-state: ${hoverAnimationPlayState};`
				: `\n\tanimation: none;`;

			if (hoverFilters || hoverAnimationExpression) {
				const filterLine = hoverFilters ? `\n\tfilter: ${hoverFilters};` : "";
				hoverSelectorExpression = `\n\n.avatar_decoration img:hover {${filterLine}${hoverAnimationExpression}\n}`;
			}
		}

		const hasFilters = hasDefaultStyles && (
			shadowBlur > 0 || grayscale > 0 || brightness !== 100 || contrast !== 100
		);

		let normalSelectorExpression = "";
		if (hasDefaultStyles && (hasFilters || defaultAnimationExpression || borderRadius > 0)) {
			const normalFilters = [
				shadowBlur > 0 ? `drop-shadow(0px 0px ${shadowBlur}px ${shadowColor})` : "",
				grayscale > 0 ? `grayscale(${grayscale}%)` : "",
				brightness !== 100 ? `brightness(${brightness}%)` : "",
				contrast !== 100 ? `contrast(${contrast}%)` : ""
			].filter(Boolean).join(" ");

			const filterLine = normalFilters ? `\n\tfilter: ${normalFilters};` : "";
			const borderLine = borderRadius > 0 ? `\n\tborder-radius: ${borderRadius}px;` : "";

			normalSelectorExpression = `.avatar_decoration img {${filterLine}${borderLine}${defaultAnimationExpression}\n\ttransition: 0.3s;\n}`;
		}

		return `${normalKeyframes}${hoverKeyframes}${normalSelectorExpression}${hoverSelectorExpression}`.trim();
	}, [
		hasDefaultStyles, borderRadius, shadowColor, shadowBlur, grayscale, brightness, contrast, hasDefaultAnimation, animationType, duration, timingFunction, animationPlayState,
		hasHoverStyles, hoverShadowColor, hoverShadowBlur, hoverGrayscale, hoverBrightness, hoverContrast, hasHoverAnimation, hoverAnimationType, hoverDuration, hoverTimingFunction, hoverAnimationPlayState
	]);

	const handleCopyCss = () => {
		navigator.clipboard.writeText(generatedCss);
	};

	const handleUrlChange = (val: string) => {
		setAvatarUrl(val);
		setImgError(false);
	};

	return (
		<div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto p-4 items-start">
			<div className="w-full lg:w-1/2 lg:sticky lg:top-4 space-y-4">
				<div className="space-y-3 border rounded-xl p-4 bg-muted/10">
					<Label className="text-[10px] uppercase font-bold tracking-wider">Select Preview Template</Label>
					<div className="flex gap-2 flex-wrap">
						{templateImages.map((preset) => (
							<Button
								key={preset.url}
								variant={avatarUrl === preset.url ? "default" : "outline"}
								size="sm"
								className="text-xs flex-1 min-w-20"
								onClick={() => handleUrlChange(preset.url)}
							>
								{preset.label}
							</Button>
						))}
					</div>
					<div className="space-y-1.5 pt-2 border-t border-muted/50">
						<Label className="text-[10px] uppercase font-bold tracking-wider">Custom Image URL</Label>
						<Input
							type="text"
							value={avatarUrl}
							onChange={(e) => handleUrlChange(e.target.value)}
							placeholder="Paste image URL here..."
							className="h-9 text-xs"
						/>
					</div>
				</div>

				<div className="p-8 bg-muted/20 border rounded-xl flex flex-col justify-center items-center min-h-75 relative overflow-hidden backdrop-blur-sm">
					<style>{generatedCss}</style>
					{imgError ? (
						<div className="flex flex-col items-center text-destructive">
							<AlertCircle className="size-10 mb-2" />
							<p className="text-xs">Failed to load image</p>
						</div>
					) : (
						<div className="avatar_decoration relative w-40 h-40 flex items-center justify-center">
							<img
								src={avatarUrl}
								alt="Avatar Preview"
								className="max-w-full max-h-full object-cover"
								onError={() => setImgError(true)}
							/>
						</div>
					)}
					<p className="text-xs text-muted-foreground mt-4 italic">Hover over the image to preview interaction styles</p>
				</div>

				<div className="flex flex-col space-y-1.5 w-full">
					<Label className="text-[10px] uppercase font-bold tracking-wider">Generated CSS</Label>
					<div className="relative border rounded-md p-3 bg-secondary/30 min-h-50 max-h-75 overflow-auto">
						{generatedCss ? (
							<pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap break-all leading-relaxed">
								{generatedCss}
							</pre>
						) : (
							<p className="text-xs text-muted-foreground italic flex items-center justify-center h-full min-h-43.5">No active custom styles found.</p>
						)}
						{generatedCss && (
							<Button
								size="icon"
								variant="ghost"
								className="absolute top-2 right-2 size-7"
								onClick={handleCopyCss}
							>
								<Copy className="size-3.5" />
							</Button>
						)}
					</div>
					<Button className="w-full gap-2" onClick={handleCopyCss} disabled={!generatedCss}>
						<Download className="size-3.5" /> Copy Code Styles
					</Button>
				</div>
			</div>

			<div className="w-full lg:w-1/2 space-y-5 p-6 border rounded-xl bg-background max-h-[calc(100vh-2rem)] overflow-y-auto pr-2">
				<div className="border rounded-xl p-4 bg-muted/10 space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Styles</h3>
						<Switch
							checked={hasDefaultStyles}
							onCheckedChange={setHasDefaultStyles}
						/>
					</div>

					{hasDefaultStyles && (
						<div className="space-y-4 pt-2 border-t border-muted">
							<FilterSlider label="Border Radius" value={borderRadius} onChange={setBorderRadius} max={100} suffix="px" />

							<div className="space-y-1.5">
								<Label className="text-[10px] uppercase font-bold tracking-wider">Glow Color</Label>
								<div className="flex items-center gap-3">
									<ColorPicker color={shadowColor} onChange={setShadowColor} />
									<Input className="h-9 text-xs font-mono" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} />
								</div>
							</div>

							<FilterSlider label="Glow Blur" value={shadowBlur} onChange={setShadowBlur} max={20} suffix="px" />

							<CollapsibleFilters
								grayscale={grayscale}
								setGrayscale={setGrayscale}
								brightness={brightness}
								setBrightness={setBrightness}
								contrast={contrast}
								setContrast={setContrast}
							/>

							<div className="flex items-center justify-between border-t border-muted/50 pt-3">
								<Label className="text-[10px] uppercase font-bold tracking-wider">Add Animation</Label>
								<Switch
									checked={hasDefaultAnimation}
									onCheckedChange={setHasDefaultAnimation}
								/>
							</div>

							{hasDefaultAnimation && (
								<AnimationControls
									type={animationType}
									setType={setAnimationType}
									duration={duration}
									setDuration={setDuration}
									timing={timingFunction}
									setTiming={setTimingFunction}
									playState={animationPlayState}
									setPlayState={setAnimationPlayState}
								/>
							)}
						</div>
					)}
				</div>

				<div className="border rounded-xl p-4 bg-muted/10 space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hover Styles</h3>
						<Switch
							checked={hasHoverStyles}
							onCheckedChange={setHasHoverStyles}
						/>
					</div>

					{hasHoverStyles && (
						<div className="space-y-4 pt-2 border-t border-muted">
							<div className="space-y-1.5">
								<Label className="text-[10px] uppercase font-bold tracking-wider">Glow Color</Label>
								<div className="flex items-center gap-3">
									<ColorPicker color={hoverShadowColor} onChange={setHoverShadowColor} />
									<Input className="h-9 text-xs font-mono" value={hoverShadowColor} onChange={(e) => setHoverShadowColor(e.target.value)} />
								</div>
							</div>

							<FilterSlider label="Glow Blur" value={hoverShadowBlur} onChange={setHoverShadowBlur} max={20} suffix="px" />

							<CollapsibleFilters
								grayscale={hoverGrayscale}
								setGrayscale={setHoverGrayscale}
								brightness={hoverBrightness}
								setBrightness={setHoverBrightness}
								contrast={hoverContrast}
								setContrast={setHoverContrast}
							/>

							<div className="flex items-center justify-between border-t border-muted/50 pt-3">
								<Label className="text-[10px] uppercase font-bold tracking-wider">Add Animation</Label>
								<Switch
									checked={hasHoverAnimation}
									onCheckedChange={setHasHoverAnimation}
								/>
							</div>

							{hasHoverAnimation && (
								<AnimationControls
									type={hoverAnimationType}
									setType={setHoverAnimationType}
									duration={hoverDuration}
									setDuration={setHoverDuration}
									timing={hoverTimingFunction}
									setTiming={setHoverTimingFunction}
									playState={hoverAnimationPlayState}
									setPlayState={setHoverAnimationPlayState}
								/>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}