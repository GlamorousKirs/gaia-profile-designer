import { HexAlphaColorPicker } from "react-colorful";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

interface ColorPickerUIProps {
	color: string;
	onChange: (color: string) => void;
}

export const ColorPickerUI = ({ color, onChange }: ColorPickerUIProps) => {
	const validColor = colord(color).isValid() ? color : "#c7e6ff";

	return (
		<div className="custom-layout">
			<HexAlphaColorPicker
				color={validColor}
				onChange={(newColor) => onChange(newColor)}
			/>
		</div>
	);
};