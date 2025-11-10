import { useState, useEffect } from 'react';
import { TicketCard } from './TicketCard';
import { sharePointApi } from '../services/sharePointApi';
import type { SharePointTicket } from '../types/sharepoint';

export function TicketDashboard() {
  const [tickets, setTickets] = useState<SharePointTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sharePointApi.getSharePointTickets();
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett oväntat fel inträffade');
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTickets();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Laddar tickets från SharePoint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <h2>❌ Kunde inte ladda tickets</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>SharePoint Tickets Dashboard</h1>
        <div className="dashboard-stats">
          <span className="ticket-count">Totalt: {tickets.length} tickets</span>
          <button onClick={handleRefresh} className="refresh-button">
            🔄 Uppdatera
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <h2>Inga tickets hittades</h2>
            <p>Det finns inga tickets i SharePoint-listan för tillfället.</p>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.Id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}