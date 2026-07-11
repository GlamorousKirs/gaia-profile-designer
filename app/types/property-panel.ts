export interface PropertyConfig {
	id: string
	label: string
	type: "slider" | "color"
	property: string
	suffix?: string
	fallback?: any
	min?: number
	max?: number
}

export interface SectionConfig {
	title: string
	hasCollapsibleSide?: boolean
	collapsibleKey?: "showPadding" | "showMargin"
	gridProperties?: PropertyConfig[]
	properties?: PropertyConfig[]
	groups?: {
		type: "axis"
		labelX: string
		labelY: string
		propertiesX: string[]
		propertiesY: string[]
	}[]
}

export const PROPERTY_SECTIONS: SectionConfig[] = [
	{
		title: "Dimensions",
		properties: [
			{ id: "width", label: "W", type: "slider", property: "width", suffix: "px", fallback: 0 },
			{ id: "height", label: "H", type: "slider", property: "height", suffix: "px", fallback: 0 }
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
			{ id: "paddingTop", label: "P-T", type: "slider", property: "padding-top", suffix: "px" },
			{ id: "paddingBottom", label: "P-B", type: "slider", property: "padding-bottom", suffix: "px" },
			{ id: "paddingLeft", label: "P-L", type: "slider", property: "padding-left", suffix: "px" },
			{ id: "paddingRight", label: "P-R", type: "slider", property: "padding-right", suffix: "px" }
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
			{ id: "marginTop", label: "M-T", type: "slider", property: "margin-top", suffix: "px" },
			{ id: "marginBottom", label: "M-B", type: "slider", property: "margin-bottom", suffix: "px" },
			{ id: "marginLeft", label: "M-L", type: "slider", property: "margin-left", suffix: "px" },
			{ id: "marginRight", label: "M-R", type: "slider", property: "margin-right", suffix: "px" }
		]
	},
	{
		title: "Typography",
		properties: [
			{ id: "fontSize", label: "Size", type: "slider", property: "font-size", suffix: "px", fallback: 14 },
			{ id: "letterSpacing", label: "Kern", type: "slider", property: "letter-spacing", suffix: "px" },
			{ id: "textColor", label: "Color", type: "color", property: "color", fallback: "#000000" }
		]
	},
	{
		title: "Borders & Shapes",
		properties: [
			{ id: "borderRadius", label: "Rad", type: "slider", property: "border-radius", suffix: "px" },
			{ id: "borderWidth", label: "Thick", type: "slider", property: "border-width", suffix: "px" },
			{ id: "borderColor", label: "Color", type: "color", property: "border-color", fallback: "#000000" }
		]
	},
	{
		title: "Fills & Appearance",
		properties: [
			{ id: "bgColor", label: "Fill", type: "color", property: "background-color", fallback: "#ffffff" },
			{ id: "opacityVal", label: "Opac", type: "slider", property: "opacity", suffix: "%", fallback: 100 }
		]
	}
]