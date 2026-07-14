import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import {
	Database,
	Download,
	AlertTriangle,
	FileText,
	SlidersHorizontal
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useProfileStore } from '../store/useProfileStore'
import { migrationService } from '../store/migrationService'
import { db } from "../lib/db";
import { toast } from "sonner"

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

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

const STORES = ['snippets', 'colorLibraries', 'logos', 'panels']

const Settings: React.FC = () => {
	const username = useProfileStore((state) => state.username)
	const userId = useProfileStore((state) => state.userId)
	const avatarUrl = useProfileStore((state) => state.avatarUrl)

	const [activeTab, setActiveTab] = useState<string>('export')
	const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false)
	const [allItems, setAllItems] = useState<DataItem[]>([])
	const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set())
	const fileInputRef = useRef<HTMLInputElement>(null);

	const groupedItems = useMemo(() => ({
		indexeddb: allItems.filter(i => i.source === 'indexeddb'),
		localstorage: allItems.filter(i => i.source === 'localstorage')
	}), [allItems]);

	const selectAll = useCallback((source: 'indexeddb' | 'localstorage') => {
		setSelectedExportIds(prev => {
			const next = new Set(prev);
			groupedItems[source].forEach(item => next.add(item.id));
			return next;
		});
	}, [groupedItems]);

	const unselectAll = useCallback((source: 'indexeddb' | 'localstorage') => {
		setSelectedExportIds(prev => {
			const next = new Set(prev);
			groupedItems[source].forEach(item => next.delete(item.id));
			return next;
		});
	}, [groupedItems]);

	const verifyStoragePayload = useCallback(async () => {
		try {
			const discoveredItems: DataItem[] = []

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i)
				if (key) {
					const cleanValue = (localStorage.getItem(key) || '').replace(/[<>]/g, '')
					discoveredItems.push({
						id: `ls-${key}`,
						source: 'localstorage',
						label: `${key}`,
						displayKey: `${cleanValue.substring(0, 60)}${cleanValue.length > 60 ? '...' : ''}`,
						icon: SlidersHorizontal
					})
				}
			}

			for (const storeName of STORES) {
				const table = (db as any)[storeName]
				if (table) {
					const count = await table.count()
					if (count > 0) {
						discoveredItems.push({
							id: `idb-${storeName}`,
							source: 'indexeddb',
							label: `${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`,
							displayKey: `${count} item${count === 1 ? '' : 's'}`,
							icon: FileText
						})
					}
				}
			}

			setAllItems(discoveredItems)
		} catch (e) {
			console.error("Failed to verify storage", e)
		}
	}, [])

	useEffect(() => {
		verifyStoragePayload()
	}, [verifyStoragePayload, username, userId, avatarUrl])

	const triggerImport = () => {
		fileInputRef.current?.click();
	};

	const toggleSelection = useCallback((id: string) => {
		setSelectedExportIds(prev => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	}, []);

	const handleExport = async (): Promise<void> => {
		if (selectedExportIds.size === 0) {
			toast.error("Selection Required", {
				description: "Please select at least one item to export.",
			})
			return
		}

		try {
			toast.loading("Preparing your data...", { id: "export-toast" })

			for (const storeName of STORES) {
				if (selectedExportIds.has(`idb-${storeName}`)) {
					const table = (db as any)[storeName]
					const dataArray = await table.toArray()

					const exportPayload = {
						indexedDB: {
							[storeName]: dataArray
						}
					}

					const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
					const url = URL.createObjectURL(blob)
					const link = document.createElement('a')
					link.href = url
					link.download = `gstudio_${storeName}_${new Date().toISOString().slice(0, 10)}.json`
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
					URL.revokeObjectURL(url)
				}
			}

			const lsSelected = Array.from(selectedExportIds).filter(id => id.startsWith('ls-'))
			if (lsSelected.length > 0) {
				const lsExport: Record<string, string> = {}
				lsSelected.forEach(id => {
					const key = id.replace('ls-', '')
					lsExport[key] = localStorage.getItem(key) || ''
				})

				const blob = new Blob([JSON.stringify({ gstudioLocalStorage: lsExport }, null, 2)], { type: 'application/json' })
				const url = URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.href = url
				link.download = `gstudio_local-storage_${new Date().toISOString().slice(0, 10)}.json`
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				URL.revokeObjectURL(url)
			}

			toast.success("Export Successful", {
				id: "export-toast",
				description: "Your selected data has been downloaded.",
			})
		} catch (err) {
			toast.error("Export Failed", {
				id: "export-toast",
				description: (err as Error).message,
			})
		}
	}

	const handleImport = (e: ChangeEvent<HTMLInputElement>): void => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		toast.loading(`Restoring ${files.length} file(s)...`, { id: "import-toast" })

		const readFile = (file: File): Promise<any> => {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (event) => resolve(JSON.parse(event.target?.result as string));
				reader.onerror = (err) => reject(err);
				reader.readAsText(file);
			});
		};

		const processFiles = async () => {
			try {
				const fileDataArray = await Promise.all(Array.from(files).map(readFile));

				for (const data of fileDataArray) {
					const isRawLocalStorage = !data.gstudioLocalStorage && !data.indexedDB;

					if (isRawLocalStorage) {
						Object.entries(data).forEach(([key, value]) => {
							localStorage.setItem(key, value as string);
						});
					} else {
						await migrationService.importSystemData(data);
					}
				}

				toast.success("Import Successful", {
					id: "import-toast",
					description: "Workspaces have been successfully restored.",
				})
				await verifyStoragePayload();
				setTimeout(() => window.location.reload(), 1000);
			} catch (err) {
				toast.error("Import Failed", {
					id: "import-toast",
					description: (err as Error).message,
				})
			}
		};

		processFiles();
		e.target.value = '';
	};

	const executePurge = async (): Promise<void> => {
		setShowConfirmReset(false)
		try {
			await migrationService.purgeSystemData()
			toast.success("Data Reset", {
				description: "All local data has been purged. Refreshing...",
			})
			setTimeout(() => {
				window.location.reload()
			}, 1000)
		} catch (err) {
			toast.error("Purge Failed", {
				description: "Could not clear local data.",
			})
		}
	}

	const navItems: NavItem[] = [
		{ id: 'export', label: 'Backup Data', icon: Database },
	]

	return (
		<div className="min-h-screen w-full bg-background text-foreground font-sans relative block">
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
						{activeTab === 'export' && (
							<div className="space-y-8 animate-in fade-in duration-500">
								<header>
									<h2 className="text-xl font-semibold tracking-wide">Backup Data</h2>
									<p className="text-sm text-muted-foreground">Select data to include in your backup.</p>
								</header>

								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<h3 className="text-sm font-bold text-primary">IndexedDB</h3>
										<div className="flex gap-2">
											<Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => selectAll('indexeddb')}>Select All</Button>
											<Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => unselectAll('indexeddb')}>Unselect All</Button>
										</div>
									</div>
									<div className="border border-border rounded-md p-4 space-y-4">
										{groupedItems.indexeddb.map((item) => (
											<div key={item.id} className="flex items-center gap-3">
												<Checkbox
													checked={selectedExportIds.has(item.id)}
													onCheckedChange={() => toggleSelection(item.id)}
												/>
												<div className="flex-1 text-sm">
													<p className="font-medium">{item.label}</p>
													<p className="text-xs text-muted-foreground font-mono">{item.displayKey}</p>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<h3 className="text-sm font-bold text-primary">LocalStorage</h3>
										<div className="flex gap-2">
											<Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => selectAll('localstorage')}>Select All</Button>
											<Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => unselectAll('localstorage')}>Unselect All</Button>
										</div>
									</div>
									<div className="border border-border rounded-md p-4 space-y-4">
										{groupedItems.localstorage.map((item) => (
											<div key={item.id} className="flex items-center gap-3">
												<Checkbox
													checked={selectedExportIds.has(item.id)}
													onCheckedChange={() => toggleSelection(item.id)}
												/>
												<div className="flex-1 text-sm">
													<p className="font-medium">{item.label}</p>
													<p className="text-xs text-muted-foreground font-mono">{item.displayKey}</p>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="flex gap-4">
									<Button onClick={handleExport} className="flex-1">
										<Download size={16} className="mr-2" />
										Export Selected
									</Button>

									<div className="w-full">
										<input
											type="file"
											ref={fileInputRef}
											id="data-file-upload"
											accept=".json"
											multiple
											onChange={handleImport}
											className="hidden"
										/>
										<Button
											variant="outline"
											className="w-full cursor-pointer"
											onClick={triggerImport}
										>
											Import Backup
										</Button>
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