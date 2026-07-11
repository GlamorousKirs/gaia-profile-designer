import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { ChangeEvent } from 'react'
import {
    Database,
    Fingerprint,
    Download,
    Upload,
    AlertTriangle,
    Trash2,
    CheckCircle2,
    Loader2,
    FileText,
    SlidersHorizontal
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useProfileStore } from '../store/useProfileStore'
import { migrationService } from '../store/migrationService'
import { entries, createStore, clear } from 'idb-keyval'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface StatusState {
    type: 'loading' | 'success' | 'error'
    message: string
}

interface NavItem {
    id: string
    label: string
    icon: LucideIcon
}

interface DataItem {
    id: string
    source: 'indexeddb' | 'localstorage'
    label: string
    displayKey: string
    icon: LucideIcon
}

const dataPayloadSchema = z.object({
    timestamp: z.string(),
    gstudioLocalStorage: z.record(z.string(), z.string()),
    snippetsState: z.record(z.string(), z.any())
}).strict()

const DB_STORE = createStore('gaia-profile-designer', 'snippets')
const PREFIX = 'gstudio-'

const Settings: React.FC = () => {
    const username = useProfileStore((state) => state.username)
    const userId = useProfileStore((state) => state.userId)
    const avatarUrl = useProfileStore((state) => state.avatarUrl)

    const [activeTab, setActiveTab] = useState<string>('account')
    const [status, setStatus] = useState<StatusState | null>(null)
    const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false)
    const [hasLocalData, setHasLocalData] = useState<boolean>(true)
    const [allItems, setAllItems] = useState<DataItem[]>([])

    const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const verifyStoragePayload = useCallback(async () => {
        try {
            const discoveredItems: DataItem[] = []

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith(PREFIX)) {
                    const cleaningLabel = key.replace(PREFIX, '')
                    const cleanValue = (localStorage.getItem(key) || '').replace(/[<>]/g, '')

                    discoveredItems.push({
                        id: `ls-${key}`,
                        source: 'localstorage',
                        label: `Studio Config (${cleaningLabel.toUpperCase()})`,
                        displayKey: `${key}: "${cleanValue.substring(0, 60)}${cleanValue.length > 60 ? '...' : ''}"`,
                        icon: SlidersHorizontal
                    })
                }
            }

            const dbRecords = await entries(DB_STORE)
            if (dbRecords.length > 0) {
                discoveredItems.push({
                    id: 'idb-all-snippets',
                    source: 'indexeddb',
                    label: 'Layout Snippets Database',
                    displayKey: `${dbRecords.length} item${dbRecords.length === 1 ? '' : 's'} stored locally`,
                    icon: FileText
                })
            }

            setAllItems(discoveredItems)
            setHasLocalData(discoveredItems.length > 0)
        } catch (e) {
            setHasLocalData(false)
        }
    }, [])

    useEffect(() => {
        verifyStoragePayload()
        return () => {
            if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current)
        }
    }, [verifyStoragePayload, username, userId, avatarUrl])

    const triggerStatus = (type: StatusState['type'], message: string): void => {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current)
        setStatus({ type, message })
        if (type !== 'loading') {
            statusTimeoutRef.current = setTimeout(() => setStatus(null), 3000)
        }
    }

    const handleDeleteItem = async (targetItem: DataItem) => {
        try {
            triggerStatus('loading', 'Deleting selected record...')

            if (targetItem.source === 'indexeddb') {
                await clear(DB_STORE)
            } else {
                const targetKey = targetItem.id.replace('ls-', '')
                localStorage.removeItem(targetKey)

                if (targetKey === `${PREFIX}user`) {
                    useProfileStore.setState({ username: '', userId: '', avatarUrl: '' })
                }
            }

            triggerStatus('success', 'Selected resource dropped')
            await verifyStoragePayload()
        } catch (err) {
            triggerStatus('error', 'Failed to clear resource parameter')
        }
    }

    const handleExport = async (): Promise<void> => {
        try {
            triggerStatus('loading', 'Preparing your data file...')
            const exportData = await migrationService.exportSystemData()

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            const cleanUser = (username || 'USER').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
            link.download = `GAIA_STUDIO_data_${cleanUser}.json`

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            triggerStatus('success', 'Data file downloaded successfully')
        } catch (err) {
            triggerStatus('error', 'Failed to generate data')
        }
    }

    const handleImport = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0]
        if (!file) return

        triggerStatus('loading', 'Restoring your settings...')

        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const resultText = event.target?.result as string
                const rawData = JSON.parse(resultText)

                const validatedData = dataPayloadSchema.parse(rawData)

                await migrationService.importSystemData(validatedData)
                triggerStatus('success', 'Workspace successfully restored')
                await verifyStoragePayload()
            } catch (err) {
                triggerStatus('error', 'Invalid or corrupted data file structure')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const executePurge = async (): Promise<void> => {
        setShowConfirmReset(false)
        triggerStatus('loading', 'Clearing application data...')
        try {
            await migrationService.purgeSystemData()
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        } catch (err) {
            triggerStatus('error', 'Failed to clear local data')
        }
    }

    const navItems: NavItem[] = [
        { id: 'account', label: 'Account Profile', icon: Fingerprint },
        { id: 'export', label: 'Backup Data', icon: Database },
    ]

    return (
        <div className="min-h-screen w-full bg-background text-foreground font-sans relative block">
            {status && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-border p-8 rounded-lg shadow-lg flex flex-col items-center gap-4 max-w-sm text-center">
                        {status.type === 'loading' && <Loader2 className="text-primary animate-spin" size={32} />}
                        {status.type === 'success' && <CheckCircle2 className="text-primary" size={32} />}
                        {status.type === 'error' && <AlertTriangle className="text-destructive" size={32} />}
                        <p className="text-sm font-medium text-muted-foreground">{status.message}</p>
                    </div>
                </div>
            )}

            <Dialog open={showConfirmReset} onOpenChange={setShowConfirmReset}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <AlertTriangle size={24} className="text-destructive" />
                            Delete All Local Data?
                        </DialogTitle>
                        <DialogDescription>
                            This action will permanently delete your saved profile preferences and drop the internal browser database. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowConfirmReset(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={executePurge} className="w-full sm:w-auto">
                            Delete Everything
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">
                <aside className="w-full md:w-56 shrink-0 flex flex-col justify-between md:min-h-[calc(100vh-5rem)]">
                    <div>
                        <div className="mb-8 px-4">
                            <h1 className="text-2xl font-sans font-bold text-primary tracking-wide">Settings</h1>
                            <p className="text-xs text-muted-foreground mt-1">Manage your account</p>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {navItems.map((item) => {
                                const IconComponent = item.icon
                                const isActive = activeTab === item.id
                                return (
                                    <Button
                                        key={item.id}
                                        variant={isActive ? "default" : "ghost"}
                                        onClick={() => setActiveTab(item.id)}
                                        className="w-full justify-start gap-3 px-4 py-3 h-auto font-normal text-sm"
                                    >
                                        <IconComponent size={14} className="shrink-0" />
                                        {item.label}
                                    </Button>
                                )
                            })}
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 max-w-2xl">
                    <div className="bg-card border border-border rounded-lg p-8 min-h-125 shadow-sm">
                        {activeTab === 'account' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <header>
                                    <h2 className="text-xl font-semibold tracking-wide">User Profile</h2>
                                    <p className="text-sm text-muted-foreground">Your details for the current session.</p>
                                </header>

                                <div className="flex items-center gap-8 p-6 bg-muted/30 border border-border rounded-lg">
                                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary overflow-hidden shrink-0">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Fingerprint size={32} />
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-xs uppercase font-bold text-primary">Logged In As</p>
                                        <h3 className="text-lg font-bold text-foreground truncate">{username || 'Guest User'}</h3>
                                        <p className="text-xs text-muted-foreground font-mono truncate">ID: {userId || 'Not Available'}</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold tracking-wide">Stored Data</h3>
                                        <p className="text-xs text-muted-foreground">All local data stored in your current browser.</p>
                                    </div>

                                    {allItems.length > 0 ? (
                                        <div className="border border-border rounded-md divide-y divide-border bg-muted/10 max-h-80 overflow-y-auto">
                                            {allItems.map((item) => {
                                                const ItemIcon = item.icon
                                                return (
                                                    <div key={item.id} className="flex items-center justify-between p-3 text-sm gap-4">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <ItemIcon size={16} className="text-muted-foreground shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-semibold text-foreground leading-none">{item.label}</p>
                                                                <p className="font-mono text-[10px] text-muted-foreground truncate mt-1">{item.displayKey}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteItem(item)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-6 border border-dashed border-border rounded-md text-center bg-muted/5">
                                            <p className="text-xs text-muted-foreground">No "gstudio-" data found in this browser.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <div className="p-6 border border-destructive/20 bg-destructive/10 rounded-md flex flex-col gap-4">
                                        <div className="flex gap-4 items-start">
                                            <AlertTriangle size={18} className="text-destructive shrink-0 mt-1" />
                                            <div>
                                                <p className="text-sm font-bold text-destructive">Delete Everything</p>
                                                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                                    This will permanently wipe out all browser-stored data generated by the Gaia Profile Designer.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            disabled={!hasLocalData}
                                            onClick={() => setShowConfirmReset(true)}
                                            className="w-full"
                                        >
                                            <Trash2 size={14} className="mr-2" />
                                            {hasLocalData ? 'Clear Local Data' : 'No Local Data Found'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'export' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <header>
                                    <h2 className="text-xl font-semibold tracking-wide">Backup Data</h2>
                                    <p className="text-sm text-muted-foreground">Backup your all your data into a JSON file.</p>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 border border-border bg-muted/20 rounded-lg space-y-4 flex flex-col justify-between">
                                        <div className="flex items-center gap-4">
                                            <Download className="text-primary shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm font-bold">Export Data</p>
                                                <p className="text-xs text-muted-foreground">Download your settings</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="default"
                                            onClick={handleExport}
                                            className="w-full"
                                        >
                                            Download JSON File
                                        </Button>
                                    </div>

                                <div className="p-6 border border-border bg-muted/20 rounded-lg space-y-4 flex flex-col justify-between">
	<div className="flex items-center gap-4">
		<Upload className="text-card-foreground shrink-0" size={18} />
		<div>
			<p className="text-sm font-bold">Import Data</p>
			<p className="text-xs text-muted-foreground">Restore saved settings</p>
		</div>
	</div>
	<div className="w-full">
		<input 
			type="file" 
			id="data-file-upload" 
			accept=".json" 
			onChange={handleImport} 
			className="hidden" 
		/>
		<Button variant="outline" className="w-full cursor-pointer">
			<label htmlFor="data-file-upload">
				Choose JSON File
			</label>
		</Button>
	</div>
</div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Settings