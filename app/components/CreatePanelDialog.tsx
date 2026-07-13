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
import { Bold, Italic, Film, MessageSquareQuote, Code, EyeOff } from "lucide-react"

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
            setId(defaultValues.id.replace('#id_custom_', ''))
            setContent(defaultValues.content)
        } else {
            setName("")
            setId("")
            setContent("")
        }
    }, [defaultValues, open])

    const handleSubmit = () => {
        const numericId = id.trim() === "" ? Math.floor(10000 + Math.random() * 90000).toString() : id;
        const finalId = `#id_custom_${numericId}`;
        const finalName = name.trim() === "" ? "Custom" : name;

        onConfirm({ id: finalId, name: finalName, content });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[70vh] max-h-[70vh] flex-col sm:max-w-106.25" data-lenis-prevent>
                <DialogHeader className="flex-none">
                    <DialogTitle>
                        {defaultValues ? `Edit ${defaultValues.id}` : "Create Custom Panel"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col flex-1 overflow-hidden py-4 pr-2">
                    <div className="grid gap-4 mb-4">
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
                            <Label htmlFor="content">Content</Label>
                            <div className="flex -space-x-px" role="group">
                                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-l-md rounded-r-none" onClick={() => insertTag('b')}><Bold className="w-4 h-4" /></Button>
                                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-none" onClick={() => insertTag('i')}><Italic className="w-4 h-4" /></Button>
                                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-none" onClick={() => insertTag('spoiler')}><EyeOff className="w-4 h-4" /></Button>
                                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-none" onClick={() => insertTag('youtube')}><Film className="w-4 h-4" /></Button>
                                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-none" onClick={() => insertTag('quote')}><MessageSquareQuote className="w-4 h-4" /></Button>
                                <Button type="button" variant="outline" size="sm" className="flex-1 rounded-r-md rounded-l-none" onClick={() => insertTag('code')}><Code className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter text.."
                            className="flex-1 resize-none"
                            data-lenis-prevent
                        />
                    </div>
                </div>

                <DialogFooter className="flex-none">
                    <Button onClick={handleSubmit}>{defaultValues ? "Save Changes" : "Create Panel"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}