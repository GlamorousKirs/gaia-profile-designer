import { useState } from "react"
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
	onConfirm: (data: { id?: string; name: string; content: string }) => void
}

export function CreatePanelDialog({ open, onOpenChange, onConfirm }: CreatePanelDialogProps) {
	const [name, setName] = useState("")
	const [id, setId] = useState("")
	const [content, setContent] = useState("")

	const handleSubmit = () => {
		onConfirm({ id: id || undefined, name, content })
		setName("")
		setId("")
		setContent("")
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create Custom Panel</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Panel Name</Label>
						<Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Cool Panel" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="id">ID (Optional)</Label>
						<Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="custom_id" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="content">Content</Label>
						<Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter panel HTML/Content..." />
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSubmit}>Create Panel</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}