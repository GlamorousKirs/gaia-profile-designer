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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreatePanelDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: (data: { id: string; name: string; content: string }) => void
	defaultValues?: { id: string; name: string; content: string }
}

export function CreatePanelDialog({ open, onOpenChange, onConfirm, defaultValues }: CreatePanelDialogProps) {
	const [name, setName] = useState("")
	const [id, setId] = useState("")
	const [content, setContent] = useState("")

	useEffect(() => {
		if (defaultValues) {
			setName(defaultValues.name)
			setId(defaultValues.id)
			setContent(defaultValues.content)
		} else {
			setName("")
			setId("")
			setContent("")
		}
	}, [defaultValues, open])

	const insertTag = (tag: string) => {
		setContent((prev) => `${prev}[${tag}][/${tag}]`);
	};

	const handleSubmit = () => {
		const randomId = Math.floor(10000 + Math.random() * 90000).toString();
		const finalId = defaultValues ? id : `custom_${randomId}`;

		onConfirm({ id: finalId, name, content });
		onOpenChange(false);
	};
	
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>{defaultValues ? "Edit Panel" : "Create Custom Panel"}</DialogTitle>
				</DialogHeader>
				
				<div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
					<div className="grid gap-2">
						<Label htmlFor="id">ID</Label>
						<Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="custom_12345" disabled={!!defaultValues} />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="name">Panel Name</Label>
						<Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Custom" />
					</div>
					<div className="grid gap-2">
						<Label>Quick Tags</Label>
						<div className="flex gap-2">
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('spoiler')}>Spoiler</Button>
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('youtube')}>YouTube</Button>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="content">Content</Label>
						<Textarea 
							id="content" 
							value={content} 
							onChange={(e) => setContent(e.target.value)} 
							placeholder="Enter text.." 
							className="min-h-[300px] resize-none"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button onClick={handleSubmit}>{defaultValues ? "Save Changes" : "Create Panel"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}