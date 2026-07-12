import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { extend } from "colord";
import namesPlugin from "colord/plugins/names";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, X, Edit2, Check, Search, ChevronDown, Library } from "lucide-react";
import { ColorPickerUI } from "./colorpicker-colorpicker";
import { GradientColorPicker } from "./GradientColorPicker";

extend([namesPlugin]);

interface ColorPickerProps {
	color: string;
	onChange: (color: string) => void;
}

interface GradientStop {
	id: string;
	color: string;
	position: number;
}

const STORAGE_KEY = "gstudio-libraries";
const DEFAULT_LIB = "Default";
const MAX_COLORS_PER_LIB = 24;
const MAX_LIBRARIES = 100;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 15;

const DEFAULT_GRADIENT_STOPS: GradientStop[] = [
	{ id: "1", color: "#99c5ff", position: 0 },
	{ id: "3", color: "#ff99d3", position: 100 }
];
const DEFAULT_GRADIENT_ANGLE = 90;
const DEFAULT_SOLID_COLOR = "#605270";

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
	const [activeMode, setActiveMode] = useState<"solid" | "gradient">("solid");
	const [stops, setStops] = useState<GradientStop[]>(DEFAULT_GRADIENT_STOPS);
	const [angle, setAngle] = useState(DEFAULT_GRADIENT_ANGLE);

	const validColor = color || DEFAULT_SOLID_COLOR;
	const [isDeleteMode, setIsDeleteMode] = useState(false);
	const [isSelectOpen, setIsSelectOpen] = useState(false);
	const [newLibName, setNewLibName] = useState("");
	const [editingLib, setEditingLib] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [activeLib, setActiveLib] = useState(DEFAULT_LIB);
	const [notify, setNotify] = useState<string | null>(null);
	const [isMounted, setIsMounted] = useState(false);
	const [libSearch, setLibSearch] = useState("");

	const debounceTimer = useRef<NodeJS.Timeout | null>(null);

	const [libraries, setLibraries] = useState<Record<string, string[]>>({
		[DEFAULT_LIB]: [DEFAULT_SOLID_COLOR, "#ffffff"]
	});

	const generateGradientString = useCallback((s: GradientStop[], deg: number) => {
		const sorted = [...s].sort((a, b) => a.position - b.position);
		return `linear-gradient(${deg}deg, ${sorted.map(stop => `${stop.color} ${stop.position}%`).join(", ")})`;
	}, []);

	const handleGradientChange = (newStops: GradientStop[], newAngle: number) => {
		setStops(newStops);
		setAngle(newAngle);
		onChange(generateGradientString(newStops, newAngle));
	};

	const filteredLibraries = useMemo(() => {
		return Object.keys(libraries).filter(lib =>
			lib.toLowerCase().includes(libSearch.toLowerCase())
		);
	}, [libraries, libSearch]);

	useEffect(() => {
		setIsMounted(true);
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				setLibraries(JSON.parse(stored));
			} catch {
				console.error("Failed to parse libraries");
			}
		}
	}, []);

	useEffect(() => {
		if (!isMounted) return;
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(libraries));
		}, 500);
		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [libraries, isMounted]);

	const triggerNotify = (msg: string) => {
		setNotify(msg);
		setTimeout(() => setNotify(null), 3000);
	};

	const handleSaveColor = () => {
		const valToSave = activeMode === "solid" ? validColor : generateGradientString(stops, angle);
		setLibraries(prev => {
			const current = prev[activeLib] || [];
			if (current.includes(valToSave)) return prev;
			if (current.length >= MAX_COLORS_PER_LIB) {
				triggerNotify(`Max ${MAX_COLORS_PER_LIB} colors`);
				return prev;
			}
			return { ...prev, [activeLib]: [...current, valToSave] };
		});
	};

	const createLibrary = () => {
		const name = newLibName.trim();
		if (Object.keys(libraries).length >= MAX_LIBRARIES) {
			triggerNotify(`Limit reached.`);
			return;
		}
		if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
			triggerNotify(`Invalid name length.`);
			return;
		}
		if (libraries[name]) {
			triggerNotify("Library exists.");
			return;
		}
		setLibraries(prev => ({ ...prev, [name]: [] }));
		setActiveLib(name);
		setNewLibName("");
	};

	const renameLibrary = (oldName: string) => {
		const name = editName.trim();
		if (name === oldName || !name || libraries[name]) {
			setEditingLib(null);
			return;
		}
		setLibraries(prev => {
			const { [oldName]: colors, ...rest } = prev;
			return { ...rest, [name]: colors };
		});
		setActiveLib(name);
		setEditingLib(null);
	};

	const deleteLibrary = (libName: string) => {
		if (libName === DEFAULT_LIB) return;
		setLibraries(prev => {
			const next = { ...prev };
			delete next[libName];
			return next;
		});
		if (activeLib === libName) setActiveLib(DEFAULT_LIB);
	};

	const deleteColor = (colorToDelete: string) => {
		setLibraries(prev => ({
			...prev,
			[activeLib]: prev[activeLib].filter(c => c !== colorToDelete)
		}));
	};

	if (!isMounted) return null;

	return (
		<>
			<style>{`
				.custom-layout .react-colorful { width: 200px; height: 150px; display: flex; flex-direction: column; gap: 10px; background: transparent; }
				.custom-layout .react-colorful__saturation { flex-grow: 1; border-radius: var(--radius); margin-bottom: 5px; }
				.custom-layout .react-colorful__hue, .custom-layout .react-colorful__alpha { height: 10px; border-radius: 9999px; }
				.custom-layout .react-colorful__saturation-pointer { width: 12px; height: 12px; }
				.custom-layout .react-colorful__hue-pointer, .custom-layout .react-colorful__alpha-pointer { width: 12px; height: 12px; border-radius: 50%; background: white; border: 2px solid var(--border); }
			`}</style>
			<Popover onOpenChange={(open) => { if (!open) { setIsDeleteMode(false); setNotify(null); setEditingLib(null); setLibSearch(""); setIsSelectOpen(false); } }}>
				<PopoverTrigger>
					<button
						type="button"
						className="size-5 rounded-full border border-border cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
						style={{ background: validColor }}
						aria-label="Pick a color"
					/>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
					<div className="custom-layout p-0 rounded-(--radius) backdrop-blur-md bg-background border flex flex-col w-64 overflow-hidden">
						<div className="flex p-1 gap-1 border-b">
							<button 
								onClick={() => {
									setActiveMode("solid");
									onChange(DEFAULT_SOLID_COLOR);
								}} 
								className={`flex items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold rounded-[calc(var(--radius)-2px)] ${activeMode === "solid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
							>
								SOLID
							</button>
							<button 
								onClick={() => {
									setActiveMode("gradient");
									setStops(DEFAULT_GRADIENT_STOPS);
									setAngle(DEFAULT_GRADIENT_ANGLE);
									onChange(generateGradientString(DEFAULT_GRADIENT_STOPS, DEFAULT_GRADIENT_ANGLE));
								}} 
								className={`flex items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold rounded-[calc(var(--radius)-2px)] ${activeMode === "gradient" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
							>
								GRADIENT
							</button>
						</div>

						<div className="p-4 flex flex-col items-center gap-3">
							{activeMode === "solid" ? (
								<ColorPickerUI color={validColor} onChange={onChange} />
							) : (
								<GradientColorPicker stops={stops} angle={angle} onChange={handleGradientChange} />
							)}
						</div>

						<div className="relative flex items-center bg-muted">
							<input
								type="text"
								className="w-full pl-3 pr-8 py-1.5 bg-transparent text-foreground text-xs font-mono focus:outline-none"
								value={validColor}
								onChange={(e) => onChange(e.target.value)}
								placeholder="hex or gradient"
							/>
							<button type="button" onClick={handleSaveColor} className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" title="Save color">
								<Plus className="size-3.5" />
							</button>
						</div>

						<div className="p-2.5 flex items-center justify-between border-t">
							<Popover open={isSelectOpen} onOpenChange={setIsSelectOpen}>
								<PopoverTrigger>
									<button className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-1 rounded-(--radius) cursor-pointer hover:text-foreground hover:bg-muted">
										<Library className="size-3" />
										<span className="truncate max-w-20">{activeLib}</span>
										<ChevronDown className="size-3" />
									</button>
								</PopoverTrigger>
								<PopoverContent className="w-56 p-0 bg-background border shadow-xl rounded-(--radius) overflow-hidden" align="start">
									<div className="p-2.5 pb-1">
										<div className="flex items-center justify-between mb-2">
											<h4 className="text-[10px] font-bold uppercase">Manage Libraries</h4>
											<button onClick={() => setIsSelectOpen(false)}><X className="size-3" /></button>
										</div>
										<div className="flex gap-1 mb-2">
											<input className="w-full text-xs border rounded-[calc(var(--radius)-2px)] px-1.5 py-1 bg-transparent" placeholder="New name..." value={newLibName} maxLength={MAX_NAME_LENGTH} onChange={(e) => setNewLibName(e.target.value)} />
											<button onClick={createLibrary} className="bg-primary text-primary-foreground p-1 rounded-[calc(var(--radius)-2px)] text-xs shrink-0">
												<Plus className="size-3" />
											</button>
										</div>
										<div className="relative flex items-center mb-1">
											<Search className="absolute left-1.5 size-3 text-muted-foreground" />
											<input className="w-full text-xs border rounded-[calc(var(--radius)-2px)] pl-6 py-1 bg-transparent" placeholder="Search..." value={libSearch} onChange={(e) => setLibSearch(e.target.value)} />
										</div>
									</div>
									<ScrollArea className="px-2.5 h-60">
										{filteredLibraries.map((lib, i, arr) => (
											<div key={lib} className="py-1">
												<div className={`flex items-center justify-between text-xs p-1.5 rounded-(--radius) ${activeLib === lib ? "bg-primary/10 text-primary" : ""}`}>
													{editingLib === lib ? (
														<div className="flex w-full items-center">
															<input autoFocus className="w-full text-xs border rounded-(--radius) px-1" value={editName} maxLength={MAX_NAME_LENGTH} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && renameLibrary(lib)} />
															<button className="p-1 hover:bg-muted rounded-(--radius)" onClick={() => renameLibrary(lib)}><Check className="size-3 ml-1" /></button>
														</div>
													) : (
														<>
															<div className="flex flex-col truncate cursor-pointer grow" onClick={() => { setActiveLib(lib); setIsSelectOpen(false); }}>
																<span className="font-bold">{lib}</span>
																<span className="text-[9px] opacity-70">{libraries[lib].length} colors</span>
															</div>
															<div className="flex items-center shrink-0 ml-2">
																{lib !== DEFAULT_LIB && (
																	<>
																		<button className="p-1 hover:bg-muted rounded-(--radius)" onClick={(e) => { e.stopPropagation(); setEditingLib(lib); setEditName(lib); }}><Edit2 className="size-3" /></button>
																		<button className="p-1 hover:bg-muted rounded-(--radius)" onClick={(e) => { e.stopPropagation(); deleteLibrary(lib); }}><Trash2 className="size-3 text-destructive" /></button>
																	</>
																)}
															</div>
														</>
													)}
												</div>
												{i < arr.length - 1 && <Separator className="mt-0.5 bg-border/50" />}
											</div>
										))}
									</ScrollArea>
								</PopoverContent>
							</Popover>

							<button type="button" onClick={() => setIsDeleteMode(!isDeleteMode)} className={`p-0.5 rounded-(--radius) transition-colors cursor-pointer shrink-0 ${isDeleteMode ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground"}`}>
								<Trash2 className="size-3" />
							</button>
						</div>

						{libraries[activeLib]?.length > 0 && (
							<div className="px-2.5 py-2.5 border-t max-h-32 overflow-y-auto">
								<div className="flex flex-wrap gap-1.5">
									{libraries[activeLib].map((c, i) => (
										<button key={`${c}-${i}`} type="button" className={`relative size-3 rounded-full border border-border/40 cursor-pointer transition-transform hover:scale-110 ${isDeleteMode ? "ring-1 ring-destructive/50" : ""}`} style={{ background: c }} onClick={() => !isDeleteMode ? onChange(c) : deleteColor(c)}>
											{isDeleteMode && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[7px] text-white rounded-full font-bold">×</span>}
										</button>
									))}
								</div>
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
};