export interface PropertyConfig {
	id: string;
	label: string;
	type: 'text' | 'number' | 'boolean' | 'select' | 'slider' | 'color';
	property: string;
	fallback?: any;
	suffix?: string;
	min?: number;
	max?: number;
	step?: number;
	options?: { label: string; value: any }[];
}

export interface SectionConfig {
	title: string;
	hasCollapsibleSide?: boolean;
	collapsibleKey?: "showPadding" | "showMargin";
	gridProperties?: PropertyConfig[];
	properties?: PropertyConfig[];
	groups?: {
		type: "axis";
		labelX: string;
		labelY: string;
		propertiesX: string[];
		propertiesY: string[];
	}[];
}

export const PROPERTY_SECTIONS: SectionConfig[] = [
	{
		title: "Clip Path",
		properties: [
			{ id: "clipPath", label: "Path", type: "select", property: "clip-path", fallback: "none" }
		]
	},
	{
		title: "Dimensions",
		properties: [
			{ id: "width", label: "W", type: "slider", property: "width", suffix: "px", fallback: 0, min: 0, max: 1200 },
			{ id: "height", label: "H", type: "slider", property: "height", suffix: "px", fallback: 0, min: 0, max: 1200 }
		]
	},
	{
		title: "Position",
		properties: [
			{ id: "positionType", label: "Type", type: "select", property: "position" } as any
		],
		gridProperties: [
			{ id: "posTop", label: "Top", type: "slider", property: "top", suffix: "px", min: -500, max: 500 },
			{ id: "posRight", label: "Right", type: "slider", property: "right", suffix: "px", min: -500, max: 500 },
			{ id: "posBottom", label: "Bottom", type: "slider", property: "bottom", suffix: "px", min: -500, max: 500 },
			{ id: "posLeft", label: "Left", type: "slider", property: "left", suffix: "px", min: -500, max: 500 }
		]
	},
	{
		title: "Padding",
		hasCollapsibleSide: true,
		collapsibleKey: "showPadding",
		groups: [
			{
				type: "axis",
				labelX: "P-X",
				labelY: "P-Y",
				propertiesX: ["padding-left", "padding-right"],
				propertiesY: ["padding-top", "padding-bottom"]
			}
		],
		gridProperties: [
			{ id: "paddingTop", label: "P-T", type: "slider", property: "padding-top", suffix: "px", min: 0, max: 200 },
			{ id: "paddingBottom", label: "P-B", type: "slider", property: "padding-bottom", suffix: "px", min: 0, max: 200 },
			{ id: "paddingLeft", label: "P-L", type: "slider", property: "padding-left", suffix: "px", min: 0, max: 200 },
			{ id: "paddingRight", label: "P-R", type: "slider", property: "padding-right", suffix: "px", min: 0, max: 200 }
		]
	},
	{
		title: "Margin",
		hasCollapsibleSide: true,
		collapsibleKey: "showMargin",
		groups: [
			{
				type: "axis",
				labelX: "M-X",
				labelY: "M-Y",
				propertiesX: ["margin-left", "margin-right"],
				propertiesY: ["margin-top", "margin-bottom"]
			}
		],
		gridProperties: [
			{ id: "marginTop", label: "M-T", type: "slider", property: "margin-top", suffix: "px", min: 0, max: 200 },
			{ id: "marginBottom", label: "M-B", type: "slider", property: "margin-bottom", suffix: "px", min: 0, max: 200 },
			{ id: "marginLeft", label: "M-L", type: "slider", property: "margin-left", suffix: "px", min: 0, max: 200 },
			{ id: "marginRight", label: "M-R", type: "slider", property: "margin-right", suffix: "px", min: 0, max: 200 }
		]
	},
	{
		title: "Typography",
		properties: [
			{ id: "fontSize", label: "Size", type: "slider", property: "font-size", suffix: "px", fallback: 14, min: 8, max: 128 },
			{ id: "letterSpacing", label: "Kern", type: "slider", property: "letter-spacing", suffix: "px", min: -10, max: 50 },
			{ id: "textColor", label: "Text Color", type: "color", property: "color", fallback: "#000000" }
		]
	},
	{
		title: "Borders & Shapes",
		properties: [
			{ id: "borderRadius", label: "Rad", type: "slider", property: "border-radius", suffix: "px", min: 0, max: 100 },
			{ id: "borderWidth", label: "Thick", type: "slider", property: "border-width", suffix: "px", min: 0, max: 20 },
			{ id: "borderColor", label: "Border Color", type: "color", property: "border-color", fallback: "#000000" }
		]
	},
	{
		title: "Fills & Appearance",
		properties: [
			{ id: "bgColor", label: "Background Color", type: "color", property: "background-color", fallback: "#ffffff" },
			{ id: "opacityVal", label: "Opac", type: "slider", property: "opacity", suffix: "%", fallback: 100, min: 0, max: 100 }
		]
	},

	{
		title: "Transform",
		properties: [
			{ id: "scale", label: "Scale", property: "scale", type: "slider", min: 0, max: 2, step: 0.1, fallback: 1 },
			{ id: "rotate", label: "Rotate", property: "rotate", type: "slider", min: -180, max: 180, suffix: "°", fallback: 0 }
		]
	}
];