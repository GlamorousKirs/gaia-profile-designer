import { useState, useCallback, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { GradientSlider } from "~/components/colorpicker/gradient-slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { ColorPickerUI } from "./colorpicker-colorpicker";

interface GradientStop {
	id: string;
	color: string;
	position: number;
}

interface GradientColorPickerProps {
	stops: GradientStop[];
	angle: number;
	onChange: (stops: GradientStop[], angle: number) => void;
}

const isValidHex = (hex: string) => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

export const GradientColorPicker = ({ stops, angle, onChange }: GradientColorPickerProps) => {
	const addStop = useCallback(() => {
		if (stops.length >= 5) return;

		const sortedStops = [...stops].sort((a, b) => a.position - b.position);
		let maxGap = -1;
		let newPos = 50;

		const potentialIntervals = [
			{ start: 0, end: sortedStops[0].position },
			...sortedStops.slice(0, -1).map((s, i) => ({ start: s.position, end: sortedStops[i + 1].position })),
			{ start: sortedStops[sortedStops.length - 1].position, end: 100 }
		];

		potentialIntervals.forEach(interval => {
			const gap = interval.end - interval.start;
			if (gap > maxGap) {
				maxGap = gap;
				newPos = Math.round(interval.start + gap / 2);
			}
		});

		const newStop = { id: crypto.randomUUID(), color: "#ffffff", position: newPos };
		onChange([...stops, newStop], angle);
	}, [stops, angle, onChange]);

	const removeStop = useCallback((id: string) => {
		if (stops.length <= 2) return;
		onChange(stops.filter(s => s.id !== id), angle);
	}, [stops, angle, onChange]);

	const updateStop = useCallback((id: string, updates: Partial<GradientStop>) => {
		onChange(stops.map(s => s.id === id ? { ...s, ...updates } : s), angle);
	}, [stops, angle, onChange]);

	const stopPositions = useMemo(() => stops.map((s) => s.position), [stops]);
	const stopColors = useMemo(() => stops.map((s) => s.color), [stops]);

	return (
		<div className="w-full space-y-4">
			<div className="flex items-center gap-3 px-1">
				<GradientSlider
					value={stopPositions}
					onValueChange={(vals) => {
						const next = stops.map((s, i) => ({ ...s, position: vals[i] }));
						onChange(next, angle);
					}}
					max={100}
					step={1}
					thumbColors={stopColors}
				/>
			</div>

			<div className="space-y-2">
				{stops.map((stop) => (
					<div key={stop.id} className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger>
								<button
									type="button"
									className="size-6 rounded border cursor-pointer"
									style={{ backgroundColor: stop.color }}
									aria-label={`Select color for stop at ${stop.position}%`}
								/>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-2" sideOffset={10}>
								<ColorPickerUI color={stop.color} onChange={(c) => updateStop(stop.id, { color: c })} />
							</PopoverContent>
						</Popover>
						<input
							className="w-20 text-[10px] px-1 py-1 border rounded"
							value={stop.color}
							onChange={(e) => {
								if (isValidHex(e.target.value)) {
									updateStop(stop.id, { color: e.target.value });
								}
							}}
						/>
						<input
							type="number"
							min="0"
							max="100"
							className="w-12 text-[10px] px-1 py-1 border rounded"
							value={stop.position}
							onChange={(e) => {
								const val = parseInt(e.target.value, 10);
								if (!isNaN(val)) updateStop(stop.id, { position: Math.max(0, Math.min(100, val)) });
							}}
						/>
						{stops.length > 2 && (
							<Button 
								variant="ghost" 
								size="icon" 
								className="size-6" 
								onClick={() => removeStop(stop.id)}
							>
								<X className="size-3" />
							</Button>
						)}
					</div>
				))}
			</div>

			<div className="flex items-center justify-between px-1">
				<span className="text-[10px] font-bold text-muted-foreground uppercase">Stops</span>
				<Button 
					variant="ghost" 
					size="icon" 
					className="size-6" 
					onClick={addStop} 
					disabled={stops.length >= 5}
				>
					<Plus className="size-3" />
				</Button>
			</div>

			<div className="flex items-center gap-3 px-1">
				<span className="text-[10px] font-bold text-muted-foreground w-8 shrink-0">{angle}°</span>
				<Slider
					value={[angle]}
					onValueChange={(val) => {
						const newValue = Array.isArray(val) ? val[0] : val;
						onChange(stops, newValue);
					}}
					min={0}
					max={360}
					step={1}
					className="flex-1"
				/>
			</div>
		</div>
	);
};