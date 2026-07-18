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
import { Label } from "@/components/ui/label";
import { generateNumericId } from "@/lib/generate-panel-id";

export function CreateMediaPanelDialog({ open, onOpenChange, onConfirm, defaultValues }: any) {
	const [formData, setFormData] = useState({
		name: "Media",
		id: "",
		url: "https://www.youtube.com/watch?v=zp7NtW_hKJI&list=RDzp7NtW_hKJI&start_radio=1"
	})
	const [isInvalid, setIsInvalid] = useState(false)

	useEffect(() => {
		if (open) {
			setFormData(defaultValues ? {
				name: defaultValues.name,
				id: defaultValues.id.replace('#id_media_', ''),
				url: defaultValues.url || "https://www.youtube.com/watch?v=zp7NtW_hKJI&list=RDzp7NtW_hKJI&start_radio=1"
			} : {
				name: "Media",
				id: "",
				url: "https://www.youtube.com/watch?v=zp7NtW_hKJI&list=RDzp7NtW_hKJI&start_radio=1"
			})
			setIsInvalid(false)
		}
	}, [defaultValues, open])

	const validateYoutubeUrl = (url: string) => {
		const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
		return regex.test(url);
	};

	const handleSubmit = () => {
		if (!validateYoutubeUrl(formData.url)) {
			setIsInvalid(true);
			return;
		}

		let videoId = null;
		const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		const match = formData.url.match(regExp);
		
		if (match && match[2].length === 11) {
			videoId = match[2];
		}

		if (!videoId) {
			setIsInvalid(true);
			return;
		}

		const suffix = formData.id.trim() === ""
			? generateNumericId()
			: formData.id.replace('#id_media_', '');

		onConfirm({
			id: `#id_media_${suffix}`,
			name: formData.name.trim() === "" ? "Media" : formData.name,
			url: `https://www.youtube.com/embed/${videoId}`
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{defaultValues ? "Edit Media Panel" : "Create Media Panel"}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="media-name">Panel Name</Label>
							<Input
								id="media-name"
								value={formData.name}
								onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
								placeholder="Media"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="media-id">ID</Label>
							<Input
								id="media-id"
								value={formData.id}
								onChange={(e) => setFormData(p => ({ ...p, id: e.target.value }))}
								placeholder="12345"
							/>
						</div>
					</div>
					<Field data-invalid={isInvalid ? true : undefined}>
						<FieldLabel htmlFor="youtube-url">YouTube URL</FieldLabel>
						<Input
							id="youtube-url"
							value={formData.url}
							onChange={(e) => {
								setFormData(p => ({ ...p, url: e.target.value }));
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