
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, QrCode, Power } from "lucide-react"
import QRCode from "qrcode"

interface Table {
    id: string
    number: string
    status: string
    currentSessionId?: string
}

export function TableManager() {
    const [tables, setTables] = useState<Table[]>([])
    const [newTableNo, setNewTableNo] = useState("")
    const [qrUrl, setQrUrl] = useState<string | null>(null)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)

    const fetchTables = async () => {
        const res = await fetch('/api/tables')
        if (res.ok) setTables(await res.json())
    }

    useEffect(() => {
        fetchTables()
    }, [])

    const addTable = async () => {
        if (!newTableNo) return
        await fetch('/api/tables', {
            method: 'POST',
            body: JSON.stringify({ number: newTableNo })
        })
        setNewTableNo("")
        fetchTables()
    }

    const deleteTable = async (id: string) => {
        if (!confirm("Are you sure? This will delete the table.")) return
        await fetch(`/api/tables?id=${id}`, { method: 'DELETE' })
        fetchTables()
    }

    const toggleStatus = async (table: Table) => {
        const newStatus = table.status === 'OPEN' ? 'CLOSED' : 'OPEN'
        await fetch('/api/tables', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: table.id, status: newStatus })
        })
        fetchTables()
    }

    const generateQR = async (table: Table) => {
        // Generate a STATIC URL. The security (session) is handled by the server on scan.
        // URL just points to the table entry point.
        const url = `${window.location.origin}/?tableId=${table.id}`;

        try {
            const dataUrl = await QRCode.toDataURL(url);
            setQrUrl(dataUrl);
            setSelectedTable(table);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 items-end">
                <div className="grid gap-2">
                    <Label>New Table Number</Label>
                    <Input
                        value={newTableNo}
                        onChange={(e) => setNewTableNo(e.target.value)}
                        placeholder="e.g. 10"
                    />
                </div>
                <Button onClick={addTable}><Plus className="mr-2 h-4 w-4" /> Add Table</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => (
                    <Card key={table.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl text-center">Table {table.number}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center pb-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${table.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {table.status}
                            </span>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => generateQR(table)} title="Show QR">
                                        <QrCode className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Table {selectedTable?.number} QR Code</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
                                        {qrUrl && (
                                            <img src={qrUrl} alt="Table QR Code" className="w-64 h-64" />
                                        )}
                                        <p className="mt-4 text-center text-sm text-muted-foreground break-all px-8">
                                            Scan to order
                                        </p>
                                    </div>
                                    <Button onClick={() => window.print()} className="w-full">Print QR</Button>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={table.status === 'OPEN' ? "text-green-600" : "text-gray-400"}
                                onClick={() => toggleStatus(table)}
                                title={table.status === 'OPEN' ? "Close Table" : "Open Table"}
                            >
                                <Power className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTable(table.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
