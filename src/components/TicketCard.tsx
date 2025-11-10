import type { SharePointTicket } from '../types/sharepoint';
import { sharePointApi } from '../services/sharePointApi';

interface TicketCardProps {
  ticket: SharePointTicket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <div className="ticket-card">
      <div className="ticket-header">
        <h3>Ticket #{ticket.Id}</h3>
        <div className="ticket-meta">
          <span className="created-date">
            Skapad: {sharePointApi.formatDate(ticket.CreatedDateTime)}
          </span>
          <span className="modified-date">
            Ändrad: {sharePointApi.formatDate(ticket.LastModifiedDateTime)}
          </span>
        </div>
      </div>
      
      <div className="ticket-details">
        {ticket.Fields?.Title && (
          <div className="detail-row">
            <strong>Titel:</strong> {ticket.Fields.Title}
          </div>
        )}
        {ticket.Fields?.Description && (
          <div className="detail-row">
            <strong>Beskrivning:</strong> {ticket.Fields.Description}
          </div>
        )}
        {ticket.Fields?.Status && (
          <div className="detail-row">
            <strong>Status:</strong> <span className={`status-badge status-${ticket.Fields.Status.toLowerCase()}`}>{ticket.Fields.Status}</span>
          </div>
        )}
        {ticket.Fields?.Priority && (
          <div className="detail-row">
            <strong>Prioritet:</strong> <span className={`priority-badge priority-${ticket.Fields.Priority.toLowerCase()}`}>{ticket.Fields.Priority}</span>
          </div>
        )}
        <div className="detail-row">
          <strong>Skapad av:</strong> {sharePointApi.getDisplayName(ticket.CreatedBy)}
        </div>
        <div className="detail-row">
          <strong>Email:</strong> {sharePointApi.getEmail(ticket.CreatedBy)}
        </div>
        <div className="detail-row">
          <strong>Senast ändrad av:</strong> {sharePointApi.getDisplayName(ticket.LastModifiedBy)}
        </div>
        <div className="detail-row">
          <strong>Content Type:</strong> {ticket.ContentType.Name}
        </div>
      </div>

      <div className="ticket-actions">
        <a 
          href={ticket.WebUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="view-link"
        >
          Visa i SharePoint ↗
        </a>
      </div>
    </div>
  );
}