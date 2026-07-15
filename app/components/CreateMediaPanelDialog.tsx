import { useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@/components/ui/field"
import { generateNumericId } from "@/lib/generate-panel-id";

export function CreateMediaPanelDialog({ open, onOpenChange, onConfirm, defaultValues }: any) {
	const [formData, setFormData] = useState({ name: "Media", id: "", url: "" })
	const [isInvalid, setIsInvalid] = useState(false)

	useEffect(() => {
		if (open) {
			setFormData(defaultValues ? {
				name: defaultValues.name,
				id: defaultValues.id.replace('#id_media_', ''),
				url: defaultValues.url || ""
			} : { name: "Media", id: "", url: "" })
			setIsInvalid(false)
		}
	}, [defaultValues, open])

	const validateYoutubeUrl = (url: string) => {
		const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
		return regex.test(url);
	};

	const handleSubmit = () => {
		if (!validateYoutubeUrl(formData.url)) {
			setIsInvalid(true)
			return
		}

		const suffix = formData.id.trim() === "" 
			? generateNumericId() 
			: formData.id.replace('#id_media_', '');
		
		onConfirm({ 
			id: `#id_media_${suffix}`, 
			name: formData.name.trim() === "" ? "Media" : formData.name, 
			url: formData.url 
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{defaultValues ? "Edit Media Panel" : "Create Media Panel"}</DialogTitle>
				</DialogHeader>
				<div className="grid">
					<Field data-invalid={isInvalid ? true : undefined}>
						<FieldLabel htmlFor="youtube-url">YouTube URL</FieldLabel>
						<Input 
							id="youtube-url"
							value={formData.url} 
							onChange={(e) => {
								setFormData(p => ({...p, url: e.target.value}));
								setIsInvalid(false);
							}} 
							placeholder="https://www.youtube.com/watch?v=..." 
							aria-invalid={isInvalid}
						/>
						{isInvalid && (
							<FieldDescription>
								Please enter a valid YouTube URL.
							</FieldDescription>
						)}
					</Field>
				</div>
				<DialogFooter>
					<Button onClick={handleSubmit}>{defaultValues ? "Save Changes" : "Create"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}