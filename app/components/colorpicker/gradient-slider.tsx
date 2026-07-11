import { useRef } from "react";
import { cn } from "~/lib/utils";

interface GradientSliderProps {
	value: number[];
	onValueChange: (value: number[]) => void;
	max?: number;
	step?: number;
	thumbColors: string[];
	className?: string;
}

export function GradientSlider({
	value,
	onValueChange,
	thumbColors,
	className,
}: GradientSliderProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const handleDrag = (index: number, e: React.PointerEvent) => {
		if (!containerRef.current) return;

		const rect = containerRef.current.getBoundingClientRect();
		const position = ((e.clientX - rect.left) / rect.width) * 100;
		const clamped = Math.max(0, Math.min(100, position));

		const newValue = [...value];
		newValue[index] = Math.round(clamped);
		onValueChange(newValue);
	};

	const sortedStops = value
		.map((pos, i) => ({ pos, color: thumbColors[i] }))
		.sort((a, b) => a.pos - b.pos);

	return (
		<div
			ref={containerRef}
			className={cn("relative w-full h-8 flex items-center select-none", className)}
		>
			<div className="absolute w-full h-1 bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-primary"
					style={{
						background: `linear-gradient(90deg, ${sortedStops
							.map((s) => `${s.color} ${s.pos}%`)
							.join(", ")})`
					}}
				/>
			</div>

			{value.map((pos, index) => (
				<div
					key={index}
					className="absolute size-4 rounded-full border-2 border-white shadow-sm ring-1 ring-black/20 cursor-pointer touch-none hover:scale-110 transition-transform"
					style={{
						left: `${pos}%`,
						backgroundColor: thumbColors[index],
						transform: "translateX(-50%)",
						zIndex: index
					}}
					onPointerMove={(e) => e.buttons === 1 && handleDrag(index, e)}
					onPointerDown={(e) => {
						(e.target as HTMLElement).setPointerCapture(e.pointerId);
						handleDrag(index, e);
					}}
				/>
			))}
		</div>
	);
}