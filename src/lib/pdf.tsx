import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import React from 'react'

const S = StyleSheet.create({
    page: { padding: 40, fontSize: 12, fontFamily: 'Helvetica' },
    header: { marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #eee' },
    gymName: { fontSize: 20, fontWeight: 'bold', marginBottom: 3 },
    sub: { fontSize: 12, color: '#666' },
    title: { fontSize: 15, fontWeight: 'bold', marginBottom: 4, marginTop: 16 },
    recNo: { fontSize: 10, color: '#999', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
    label: { color: '#777', width: '45%' },
    value: { fontWeight: 'bold', width: '55%', textAlign: 'right' },
    divider: { borderBottom: '1px solid #eee', marginVertical: 12 },
    total: { fontSize: 16, fontWeight: 'bold' },
    badge: { backgroundColor: '#f0fdf4', padding: '4 10', borderRadius: 4, color: '#166534', fontSize: 11, marginTop: 8, alignSelf: 'flex-start' },
    footer: { marginTop: 40, fontSize: 10, color: '#bbb', textAlign: 'center' },
})

export interface ReceiptData {
    receiptNo: string; gymName: string; gymPhone?: string; gymAddress?: string
    memberName: string; memberPhone: string; planName: string
    amount: number; mode: string; referenceNo?: string
    note?: string; paidAt: Date; expiryDate: Date; recordedBy: string
}

function ReceiptDoc({ d }: { d: ReceiptData }) {
    const fmt = (date: Date) =>
        date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <Document>
            <Page size="A5" style={S.page}>
                <View style={S.header}>
                    <Text style={S.gymName}>{d.gymName}</Text>
                    {d.gymPhone && <Text style={S.sub}>{d.gymPhone}</Text>}
                    {d.gymAddress && <Text style={S.sub}>{d.gymAddress}</Text>}
                </View>

                <Text style={S.title}>Payment Receipt</Text>
                <Text style={S.recNo}>#{d.receiptNo}</Text>

                <View style={S.row}>
                    <Text style={S.label}>Member</Text>
                    <Text style={S.value}>{d.memberName}</Text>
                </View>
                <View style={S.row}>
                    <Text style={S.label}>Phone</Text>
                    <Text style={S.value}>{d.memberPhone}</Text>
                </View>
                <View style={S.row}>
                    <Text style={S.label}>Plan</Text>
                    <Text style={S.value}>{d.planName}</Text>
                </View>
                <View style={S.row}>
                    <Text style={S.label}>Valid till</Text>
                    <Text style={S.value}>{fmt(d.expiryDate)}</Text>
                </View>

                <View style={S.divider} />

                <View style={S.row}>
                    <Text style={S.label}>Payment mode</Text>
                    <Text style={S.value}>{d.mode}</Text>
                </View>
                {d.referenceNo && (
                    <View style={S.row}>
                        <Text style={S.label}>Reference no</Text>
                        <Text style={S.value}>{d.referenceNo}</Text>
                    </View>
                )}
                <View style={S.row}>
                    <Text style={S.label}>Date</Text>
                    <Text style={S.value}>{fmt(d.paidAt)}</Text>
                </View>
                {d.note && (
                    <View style={S.row}>
                        <Text style={S.label}>Note</Text>
                        <Text style={S.value}>{d.note}</Text>
                    </View>
                )}

                <View style={S.divider} />

                <View style={S.row}>
                    <Text style={S.total}>Total paid</Text>
                    <Text style={S.total}>₹{d.amount}</Text>
                </View>
                <Text style={S.badge}>✓ Payment received</Text>

                <Text style={S.footer}>
                    Recorded by {d.recordedBy} · {d.gymName} {'\n'}
                    Computer-generated receipt
                </Text>
            </Page>
        </Document>
    )
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
    const blob = await pdf(<ReceiptDoc d={ data } />).toBlob()
    const arrayBuffer = await blob.arrayBuffer()
    return Buffer.from(arrayBuffer)
}