'use client';

import { useState, useEffect, useCallback } from 'react';

const NAVY   = '#1B365D';
const BLUE   = '#2E75B6';
const GREEN  = '#27AE60';
const ORANGE = '#D4740E';
const RED    = '#C0392B';
const BORDER = '#DDE3EC';
const BG     = '#F0F3F8';

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function FeasibilityBadge({ feasibility }) {
  if (!feasibility) return null;
  const lower = feasibility.toLowerCase();
  const color  = lower.includes('reachable') ? GREEN
               : lower.includes('tight')     ? ORANGE
               : lower.includes('unlikely')  ? RED
               : '#888';
  return (
    <span style={{
      display: 'inline-block',
      backgroundColor: color + '18',
      border: `1px solid ${color}`,
      color,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {feasibility}
    </span>
  );
}

function PdfButton({ href, label, color }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download
      style={{
        display: 'inline-block',
        padding: '5px 12px',
        backgroundColor: color,
        color: 'white',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </a>
  );
}

function GameplanCard({ gp }) {
  const gain = gp.target_gain ?? (
    gp.baseline_score != null && gp.target_score != null
      ? gp.target_score - gp.baseline_score
      : null
  );

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 8,
      border: `1px solid ${BORDER}`,
      padding: '16px 20px',
      marginBottom: 12,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, marginBottom: 2 }}>
            {gp.student_name}
            {gp.guarantee_mode && (
              <span style={{
                marginLeft: 8,
                display: 'inline-block',
                backgroundColor: GREEN + '18',
                border: `1px solid ${GREEN}`,
                color: GREEN,
                borderRadius: 4,
                padding: '1px 7px',
                fontSize: 10,
                fontWeight: 700,
                verticalAlign: 'middle',
              }}>GUARANTEE</span>
            )}
          </div>
          {gp.tutor_name && (
            <div style={{ fontSize: 12, color: '#666' }}>Tutor: {gp.tutor_name}</div>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#999', textAlign: 'right' }}>
          {formatDate(gp.created_at)}
        </div>
      </div>

      {/* Score + meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 10, fontSize: 13 }}>
        {gp.baseline_score != null && gp.target_score != null && (
          <div>
            <span style={{ color: '#888', fontSize: 11 }}>Score </span>
            <strong style={{ color: NAVY }}>{gp.baseline_score}</strong>
            <span style={{ color: '#888' }}> → </span>
            <strong style={{ color: NAVY }}>{gp.target_score}</strong>
            {gain != null && (
              <span style={{ color: BLUE, marginLeft: 4 }}>(+{gain} pts)</span>
            )}
          </div>
        )}
        {gp.target_test_date && (
          <div style={{ color: '#666', fontSize: 12 }}>
            Test: {gp.target_test_date}
          </div>
        )}
        {gp.session_frequency && (
          <div style={{ color: '#666', fontSize: 12 }}>
            {gp.session_frequency}/week
            {gp.total_sessions != null && ` · ${gp.total_sessions} sessions`}
            {gp.weeks_needed != null && ` · ${gp.weeks_needed} weeks`}
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <FeasibilityBadge feasibility={gp.feasibility} />
        {gp.topics_to_teach != null && (
          <span style={{ fontSize: 12, color: '#555' }}>{gp.topics_to_teach} topics</span>
        )}
      </div>

      {/* PDF buttons + tracker */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <PdfButton href={gp.gameplan_pdf_url}  label="Gameplan PDF"   color={NAVY} />
        <PdfButton href={gp.internal_pdf_url}  label="Internal Brief" color="#6B4C9A" />
        <PdfButton href={gp.student_pdf_url}   label="Student Plan"   color={ORANGE} />
        {gp.tracker_url && (
          <a
            href={gp.tracker_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '5px 12px',
              backgroundColor: GREEN,
              color: 'white',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Mastery Tracker →
          </a>
        )}
      </div>
    </div>
  );
}

export default function GameplansPage() {
  const [query, setQuery]       = useState('');
  const [gameplans, setGameplans] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchGameplans = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/gameplans${q ? `?q=${encodeURIComponent(q)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setGameplans(data.gameplans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGameplans('');
  }, [fetchGameplans]);

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGameplans(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchGameplans]);

  const resultLabel = query.trim()
    ? `${gameplans.length} result${gameplans.length !== 1 ? 's' : ''} for "${query.trim()}"`
    : `${gameplans.length} gameplan${gameplans.length !== 1 ? 's' : ''}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>

      {/* Header */}
      <div style={{
        backgroundColor: NAVY,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            backgroundColor: BLUE,
            color: 'white',
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: 1,
            padding: '4px 10px',
            borderRadius: 3,
          }}>
            SC
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Gameplan History</span>
        </div>
        <a href="/" style={{ color: '#8EA8C3', fontSize: 12, textDecoration: 'none', borderBottom: '1px solid #8EA8C3', paddingBottom: 1 }}>
          ← Back to Generator
        </a>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: NAVY, fontSize: 24, fontWeight: 800, margin: '0 0 4px 0' }}>Gameplan History</h1>
          <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Search all generated gameplans</p>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by student or tutor name…"
            style={{
              width: '100%',
              padding: '11px 14px',
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          />
        </div>

        {/* Results count */}
        {!loading && !error && (
          <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            {resultLabel}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: BLUE, fontSize: 14 }}>
            Loading…
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FDEDEC', border: `1px solid ${RED}`, borderRadius: 6, color: RED, fontSize: 13, marginBottom: 16 }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && gameplans.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            No gameplans found.
          </div>
        )}

        {/* Results */}
        {!loading && !error && gameplans.map(gp => (
          <GameplanCard key={gp.id} gp={gp} />
        ))}

        <div style={{ textAlign: 'center', color: '#aaa', fontSize: 11, marginTop: 8 }}>
          StudyCore Gameplan Generator · Diagnostic-Driven
        </div>
      </div>
    </div>
  );
}
