import { useState, useEffect, useRef, useCallback } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, Film, MessageSquareQuote, Code, EyeOff, Link as LinkIcon, Image as ImageIcon } from "lucide-react"
import { generateNumericId } from "@/lib/generate-panel-id";
export function CreatePanelDialog({ open, onOpenChange, onConfirm, defaultValues }: any) {
	const [formData, setFormData] = useState({ name: "", id: "", content: "" })
	const [mediaInputs, setMediaInputs] = useState({ url: "", label: "", youtube: "", image: "" })

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (open) {
			setFormData(defaultValues ? {
				name: defaultValues.name,
				id: defaultValues.id.replace('#id_custom_', ''),
				content: defaultValues.content
			} : { name: "", id: "", content: "" })
		}
	}, [defaultValues, open])

	const getSelection = useCallback(() => {
		const textarea = textareaRef.current
		if (!textarea) return { start: 0, end: 0, selectedText: "" }
		return {
			start: textarea.selectionStart,
			end: textarea.selectionEnd,
			selectedText: formData.content.substring(textarea.selectionStart, textarea.selectionEnd)
		}
	}, [formData.content])

	const handleInsert = (start: number, end: number, newText: string) => {
		setFormData(prev => ({
			...prev,
			content: prev.content.substring(0, start) + newText + prev.content.substring(end)
		}))
		setTimeout(() => textareaRef.current?.focus(), 0)
	}

	const insertTag = (tag: string) => {
		const { start, end, selectedText } = getSelection()
		handleInsert(start, end, `[${tag}]${selectedText}[/${tag}]`)
	}

	const insertMedia = (type: 'url' | 'youtube' | 'image') => {
		const { start, end, selectedText } = getSelection()
		let newText = ""

		if (type === 'url') newText = `[url=${mediaInputs.url}]${mediaInputs.label || selectedText || mediaInputs.url}[/url]`
		if (type === 'youtube') newText = `[youtube]${mediaInputs.youtube || selectedText}[/youtube]`
		if (type === 'image') newText = `[img]${mediaInputs.image || selectedText}[/img]`

		handleInsert(start, end, newText)
		setMediaInputs({ url: "", label: "", youtube: "", image: "" })
	}

	const handleSubmit = () => {
		let finalId = formData.id.trim() === ""
			? generateNumericId()
			: formData.id.replace('#id_custom_', '');

		if (defaultValues?.id === "about") {
			finalId = "about";
		}

		onConfirm({
			id: finalId === "about" ? "about" : `#id_custom_${finalId}`,
			name: formData.name.trim() === "" ? "Custom" : formData.name,
			content: formData.content
		});
		onOpenChange(false);
	};

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
							<Input id="name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Custom" />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="id">ID</Label>
							<Input
								id="id"
								value={formData.id}
								onChange={(e) => setFormData(p => ({ ...p, id: e.target.value }))}
								placeholder="12345"
								disabled={defaultValues?.id === "about"}
							/>
						</div>
					</div>

					<div className="flex gap-1 flex-wrap">
						<Button type="button" variant="outline" size="sm" onClick={() => insertTag('b')}><Bold className="w-4 h-4" /></Button>
						<Button type="button" variant="outline" size="sm" onClick={() => insertTag('i')}><Italic className="w-4 h-4" /></Button>
						<Button type="button" variant="outline" size="sm" onClick={() => insertTag('spoiler')}><EyeOff className="w-4 h-4" /></Button>

						<AlertDialog>
							<AlertDialogTrigger><Button type="button" variant="outline" size="sm" onClick={() => setMediaInputs(p => ({ ...p, label: getSelection().selectedText }))}><LinkIcon className="w-4 h-4" /></Button></AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader><AlertDialogTitle>Insert URL Link</AlertDialogTitle></AlertDialogHeader>
								<div className="grid gap-4">
									<Input value={mediaInputs.url} onChange={(e) => setMediaInputs(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com" />
									<Input value={mediaInputs.label} onChange={(e) => setMediaInputs(p => ({ ...p, label: e.target.value }))} placeholder="Link Label" />
								</div>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction onClick={() => insertMedia('url')}>Insert</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<AlertDialog>
							<AlertDialogTrigger><Button type="button" variant="outline" size="sm" onClick={() => setMediaInputs(p => ({ ...p, youtube: getSelection().selectedText }))}><Film className="w-4 h-4" /></Button></AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader><AlertDialogTitle>Insert YouTube Video</AlertDialogTitle></AlertDialogHeader>
								<Input value={mediaInputs.youtube} onChange={(e) => setMediaInputs(p => ({ ...p, youtube: e.target.value }))} placeholder="YouTube URL" />
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction onClick={() => insertMedia('youtube')}>Insert</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<AlertDialog>
							<AlertDialogTrigger><Button type="button" variant="outline" size="sm" onClick={() => setMediaInputs(p => ({ ...p, image: getSelection().selectedText }))}><ImageIcon className="w-4 h-4" /></Button></AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader><AlertDialogTitle>Insert Image</AlertDialogTitle></AlertDialogHeader>
								<Input value={mediaInputs.image} onChange={(e) => setMediaInputs(p => ({ ...p, image: e.target.value }))} placeholder="Image URL" />
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction onClick={() => insertMedia('image')}>Insert</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<Button type="button" variant="outline" size="sm" onClick={() => insertTag('quote')}><MessageSquareQuote className="w-4 h-4" /></Button>
						<Button type="button" variant="outline" size="sm" onClick={() => insertTag('code')}><Code className="w-4 h-4" /></Button>
					</div>

					<Textarea
						ref={textareaRef}
						value={formData.content}
						onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
						className="h-50"
						data-lenis-prevent
					/>
				</div>

				<DialogFooter>
					<Button className="w-full" onClick={handleSubmit}>{defaultValues ? "Save Changes" : "Create"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}