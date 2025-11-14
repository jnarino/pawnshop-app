import { useState, useEffect } from 'react';
import { http } from '@/app/core/api/http';

interface Props {
    customerId: string;
    onBack: () => void;
    onPawnSelected: (pawn: any) => void;
    onViewPawn: (pawn: any) => void;
}

export default function LocatePawnsTab({ customerId, onBack, onPawnSelected, onViewPawn }: Props) {
    const [pawnTickets, setPawnTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTicket, setSearchTicket] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    useEffect(() => {
        loadPawnTickets();
    }, [customerId]);

    const loadPawnTickets = async () => {
        try {
            setLoading(true);
            setError(null);

            const tickets = await http(`/api/pawnTicket?customerId=${customerId}&includeItems=true&limit=50`);
            setPawnTickets(tickets || []);
        } catch (err) {
            console.error('[LocatePawnsTab] Load error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load pawn tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTicket.trim()) {
            loadPawnTickets();
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const results = await http(`/api/pawnTicket/search?controlNumber=${searchTicket.trim()}&customerId=${customerId}&includeItems=true`);
            setPawnTickets(results || []);
        } catch (err) {
            console.error('[LocatePawnsTab] Search error:', err);
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatMoney = (amount?: number | string) => {
        if (!amount) return '0.00';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
    };

    const selectedTicket = selectedTicketId ? pawnTickets.find(t => t.id === selectedTicketId) : null;

    const handleClear = () => {
        setSearchTicket('');
        setSelectedTicketId(null);
        loadPawnTickets();
    };

    const handleSelect = () => {
        if (selectedTicket) {
            onPawnSelected(selectedTicket);
        }
    };

    if (loading) {
        return (
            <div className="payment-panel">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading pawn tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-panel" style={{ padding: '10px', fontSize: '12px' }}>
            {/* Search Section - matching the image layout */}
            <div style={{
                border: '2px inset #c0c0c0',
                padding: '8px',
                marginBottom: '8px',
                backgroundColor: '#f0f0f0'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Locate Transactions By:</div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 200px', gap: '8px', alignItems: 'center' }}>
                    <label style={{ textAlign: 'right' }}>Ticket #:</label>
                    <input
                        type="text"
                        value={searchTicket}
                        onChange={(e) => setSearchTicket(e.target.value)}
                        style={{
                            padding: '2px 4px',
                            border: '1px inset #c0c0c0',
                            fontSize: '12px'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
            </div>

            {error && (
                <div style={{
                    color: 'red',
                    padding: '4px',
                    marginBottom: '8px',
                    fontSize: '11px'
                }}>
                    {error}
                </div>
            )}

            {/* Data Grid - matching the image style */}
            <div style={{
                border: '2px inset #c0c0c0',
                height: '200px',
                overflow: 'auto',
                marginBottom: '8px',
                backgroundColor: 'white'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11px'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#c0c0c0' }}>
                            <th style={{
                                padding: '2px 4px',
                                border: '1px solid #808080',
                                textAlign: 'left',
                                fontWeight: 'bold'
                            }}>Customer #</th>
                            <th style={{
                                padding: '2px 4px',
                                border: '1px solid #808080',
                                textAlign: 'left',
                                fontWeight: 'bold'
                            }}>Ticket #</th>
                            <th style={{
                                padding: '2px 4px',
                                border: '1px solid #808080',
                                textAlign: 'left',
                                fontWeight: 'bold'
                            }}>Date In</th>
                            <th style={{
                                padding: '2px 4px',
                                border: '1px solid #808080',
                                textAlign: 'right',
                                fontWeight: 'bold'
                            }}>Amount</th>
                            <th style={{
                                padding: '2px 4px',
                                border: '1px solid #808080',
                                textAlign: 'left',
                                fontWeight: 'bold'
                            }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pawnTickets.map((ticket) => (
                            <tr
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                style={{
                                    backgroundColor: selectedTicketId === ticket.id ? '#0078d4' :
                                        ticket.pawnStatus === 'active' ? '#e8f5e8' : 'white',
                                    color: selectedTicketId === ticket.id ? 'white' : 'black',
                                    cursor: 'pointer'
                                }}
                            >
                                <td style={{
                                    padding: '2px 4px',
                                    border: '1px solid #d0d0d0'
                                }}>
                                    {customerId?.slice(-5) || '19747'}
                                </td>
                                <td style={{
                                    padding: '2px 4px',
                                    border: '1px solid #d0d0d0',
                                    fontWeight: 'bold'
                                }}>
                                    {ticket.controlNumber || ticket.control_number || 'N/A'}
                                </td>
                                <td style={{
                                    padding: '2px 4px',
                                    border: '1px solid #d0d0d0'
                                }}>
                                    {formatDate(ticket.transactionDate || ticket.transaction_date)}
                                </td>
                                <td style={{
                                    padding: '2px 4px',
                                    border: '1px solid #d0d0d0',
                                    textAlign: 'right'
                                }}>
                                    {formatMoney(
                                        ticket.amountFinanced ||
                                        ticket.amount_financed ||
                                        ticket.purchaseTradeValue ||
                                        ticket.purchase_trade_value
                                    )}
                                </td>
                                <td style={{
                                    padding: '2px 4px',
                                    border: '1px solid #d0d0d0',
                                    textTransform: 'uppercase'
                                }}>
                                    {(ticket.pawnStatus || ticket.pawn_status || 'unknown').replace('_', ' ')}
                                </td>
                            </tr>
                        ))}
                        {pawnTickets.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    fontStyle: 'italic',
                                    color: '#666'
                                }}>
                                    No pawn tickets found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Item Description Section - matching the image */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Item Description</div>
                <div style={{
                    border: '2px inset #c0c0c0',
                    height: '80px',
                    padding: '4px',
                    backgroundColor: 'white',
                    fontSize: '11px',
                    overflow: 'auto'
                }}>
                    {selectedTicket && selectedTicket.items && selectedTicket.items.length > 0 ? (
                        <div>
                            {selectedTicket.items.map((item: any, idx: number) => (
                                <div key={idx} style={{ marginBottom: '1px' }}>
                                    {(item.itemDescription || item.item_description || 'No description')} - ${formatMoney(item.priceAmount || item.price_amount)} - {(item.status || 'IN PAWN').toUpperCase()}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: '#666', fontStyle: 'italic' }}>
                            {selectedTicket ? 'No items found for this ticket.' : 'Select a pawn ticket above to view item details.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons - matching the image layout */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{
                            padding: '4px 12px',
                            fontSize: '11px',
                            border: '2px outset #c0c0c0',
                            backgroundColor: '#f0f0f0',
                            cursor: 'pointer'
                        }}
                    >
                        Clear
                    </button>

                    <button
                        type="button"
                        onClick={handleSelect}
                        disabled={!selectedTicket || (selectedTicket.pawnStatus !== 'active' && selectedTicket.pawn_status !== 'active')}
                        style={{
                            padding: '4px 12px',
                            fontSize: '11px',
                            border: '2px outset #c0c0c0',
                            backgroundColor: '#f0f0f0',
                            cursor: selectedTicket ? 'pointer' : 'not-allowed',
                            opacity: selectedTicket ? 1 : 0.5
                        }}
                    >
                        Select
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        border: '2px outset #c0c0c0',
                        backgroundColor: '#f0f0f0',
                        cursor: 'pointer'
                    }}
                >
                    Exit
                </button>
            </div>
        </div>
    );
}
