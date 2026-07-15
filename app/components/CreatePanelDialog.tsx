import { useState, useEffect, useRef } from "react"
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
import { Bold, Italic, Film, MessageSquareQuote, Code, EyeOff, Image } from "lucide-react"

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
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (defaultValues) {
			setName(defaultValues.name)
			setId(defaultValues.id.replace('custom_', ''))
			setContent(defaultValues.content)
		} else {
			setName("")
			setId("")
			setContent("")
		}
	}, [defaultValues, open])

	const insertTag = (tag: string) => {
		const textarea = textareaRef.current
		if (!textarea) return

		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		const selectedText = content.substring(start, end)
		
		const openTag = `[${tag}]`
		const closeTag = `[/${tag}]`
		const textToInsert = `${openTag}${selectedText}${closeTag}`

		const newContent = 
			content.substring(0, start) + 
			textToInsert + 
			content.substring(end)

		setContent(newContent)

		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(
				start + openTag.length,
				start + openTag.length + selectedText.length
			)
		}, 0)
	}

	const handleSubmit = () => {
		const numericId = id.trim() === "" ? Math.floor(10000 + Math.random() * 90000).toString() : id
		const finalId = `custom_${numericId}`
		const finalName = name.trim() === "" ? "Custom" : name

		onConfirm({ id: finalId, name: finalName, content })
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent data-lenis-prevent>
				<DialogHeader>
					<DialogTitle>
						{defaultValues ? `Edit ${defaultValues.id}` : "Create Custom Panel"}
					</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Panel Name</Label>
							<Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Custom" />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="id">ID</Label>
							<Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="12345" disabled={!!defaultValues} />
						</div>
					</div>

					<div className="grid gap-2">
						<div className="flex gap-1 flex-wrap">
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('b')}><Bold className="w-4 h-4" /></Button>
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('i')}><Italic className="w-4 h-4" /></Button>
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('img')}><Image className="w-4 h-4" /></Button>
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('spoiler')}><EyeOff className="w-4 h-4" /></Button>
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('youtube')}><Film className="w-4 h-4" /></Button>
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('quote')}><MessageSquareQuote className="w-4 h-4" /></Button>
							<Button type="button" variant="outline" size="sm" onClick={() => insertTag('code')}><Code className="w-4 h-4" /></Button>
						</div>
					</div>

					<div className="grid gap-2">
						<Textarea
							ref={textareaRef}
							id="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Enter text.."
							className="h-50 overflow-y-auto"
							data-lenis-prevent
						/>
					</div>
				</div>

				<DialogFooter>
					<Button className="w-full" onClick={handleSubmit}>{defaultValues ? "Save Changes" : "Create Panel"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}