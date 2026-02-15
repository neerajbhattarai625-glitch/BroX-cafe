"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, ShieldCheck, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";

type Device = {
    tableNo: string;
    deviceId: string;
    sessionStarted: string;
    isBlocked: boolean;
};

export function DeviceManager() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/devices');
            if (res.ok) {
                const data = await res.json();
                setDevices(data.devices);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load devices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const toggleBlock = async (deviceId: string, isBlocked: boolean) => {
        try {
            const action = isBlocked ? 'UNBLOCK' : 'BLOCK';
            const res = await fetch('/api/admin/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, action })
            });

            if (res.ok) {
                toast.success(`Device ${action === 'BLOCK' ? 'Blocked' : 'Unblocked'}`);
                fetchDevices();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating status");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            Active Devices
                        </CardTitle>
                        <CardDescription>Manage devices currently connected to tables</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchDevices} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Table</TableHead>
                            <TableHead>Device ID</TableHead>
                            <TableHead>Session Start</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {devices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                    No active devices found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            devices.map((device) => (
                                <TableRow key={device.deviceId}>
                                    <TableCell className="font-bold">Table {device.tableNo}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {device.deviceId.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {new Date(device.sessionStarted).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell>
                                        {device.isBlocked ? (
                                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                <ShieldAlert className="w-3 h-3" /> Blocked
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="flex w-fit items-center gap-1 text-green-600 border-green-200 bg-green-50">
                                                <ShieldCheck className="w-3 h-3" /> Allowed
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant={device.isBlocked ? "outline" : "destructive"}
                                            size="sm"
                                            onClick={() => toggleBlock(device.deviceId, device.isBlocked)}
                                        >
                                            {device.isBlocked ? "Unblock" : "Block Access"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
