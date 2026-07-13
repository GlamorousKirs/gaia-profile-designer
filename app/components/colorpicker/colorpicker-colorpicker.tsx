import { HexAlphaColorPicker } from "react-colorful";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

interface ColorPickerUIProps {
	color: string;
	onChange: (color: string) => void;
}

export const ColorPickerUI = ({ color, onChange }: ColorPickerUIProps) => {
	const safeColor = colord(color).isValid() 
		? colord(color).toHex() 
		: "#000000";

	return (
		<div className="custom-layout">
			<HexAlphaColorPicker 
				color={safeColor} 
				onChange={(newColor) => onChange(newColor)} 
			/>
		</div>
	);
};