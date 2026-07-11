import { ColorPickerUI } from "./colorpicker-colorpicker";

interface SolidColorPickerProps {
	color: string;
	onChange: (color: string) => void;
}

export const SolidColorPicker = ({ color, onChange }: SolidColorPickerProps) => {
	return (
		<div className="w-full">
			<ColorPickerUI color={color} onChange={onChange} />
		</div>
	);
};