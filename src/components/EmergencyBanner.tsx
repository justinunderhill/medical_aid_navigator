import { Siren } from 'lucide-react';

interface Props {
  headline: string;
  body: string[];
  afterCare?: string[];
}

export function EmergencyBanner({ headline, body, afterCare }: Props) {
  return (
    <div className="callout callout-emergency" role="alert">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <Siren size={20} color="var(--coral)" aria-hidden />
        <strong style={{ color: 'var(--coral)' }}>{headline}</strong>
      </div>
      {body.map((line, i) => (
        <p key={i} style={{ marginBottom: '8px' }}>{line}</p>
      ))}
      {afterCare && afterCare.length > 0 && (
        <>
          <p style={{ fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>
            Once the person is stable:
          </p>
          <ul style={{ paddingLeft: '18px' }}>
            {afterCare.map((line, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{line}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
