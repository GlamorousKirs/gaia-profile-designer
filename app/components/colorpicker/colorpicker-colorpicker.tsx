import { HexAlphaColorPicker } from "react-colorful";

interface ColorPickerUIProps {
	color: string;
	onChange: (color: string) => void;
}

export const ColorPickerUI = ({ color, onChange }: ColorPickerUIProps) => {
	return (
		<div className="custom-layout">
			<HexAlphaColorPicker color={color} onChange={onChange} />
		</div>
	);
};