// ════════════════════════════════════════════════════════════════
//  MI TURNO · components/skeletons.js
//  Skeleton loaders para mejorar UX en carga inicial
// ════════════════════════════════════════════════════════════════
/* global h */
/* exported SkeletonDashboard, SkeletonHistory */

function SkeletonHero() {
  return h(
    'div',
    { className: 'skeleton-hero' },
    h('div', { className: 'skeleton-hero-label skeleton' }),
    h('div', { className: 'skeleton-hero-amount skeleton' }),
    h('div', { className: 'skeleton-hero-sub skeleton' })
  );
}

function SkeletonCard() {
  return h(
    'div',
    { className: 'skeleton-card' },
    h('div', { className: 'skeleton-card-label skeleton' }),
    h('div', { className: 'skeleton-card-val skeleton' }),
    h('div', { className: 'skeleton-card-sub skeleton' })
  );
}

function SkeletonKPIGrid() {
  return h(
    'div',
    { className: 'skeleton-kpi-grid' },
    h(SkeletonCard, null),
    h(SkeletonCard, null),
    h(SkeletonCard, null),
    h(SkeletonCard, null)
  );
}

function SkeletonChartWrap() {
  return h('div', { className: 'skeleton-chart-wrap skeleton' });
}

function SkeletonHistoryRow() {
  return h(
    'div',
    { className: 'skeleton-hist-row' },
    h(
      'div',
      { className: 'skeleton-hist-head' },
      h('div', { className: 'skeleton-hist-date skeleton' }),
      h('div', { className: 'skeleton-hist-dur skeleton' })
    ),
    h('div', { className: 'skeleton-hist-detail skeleton' })
  );
}

/* eslint-disable-next-line no-unused-vars */
function SkeletonDashboard() {
  return h(
    'div',
    { className: 'fadeUp' },
    h(SkeletonHero, null),
    h(SkeletonKPIGrid, null),
    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }),
      h(SkeletonChartWrap, null)
    ),
    h(SkeletonChartWrap, null)
  );
}

/* eslint-disable-next-line no-unused-vars */
function SkeletonHistory() {
  return h(
    'div',
    { className: 'fadeUp' },
    h(SkeletonHero, null),
    h(
      'div',
      { className: 'skeleton-hist-stats' },
      h(
        'div',
        { className: 'skeleton-hist-stat' },
        h('div', { className: 'skeleton-hist-stat-num skeleton' }),
        h('div', { className: 'skeleton-hist-stat-lbl skeleton' })
      ),
      h(
        'div',
        { className: 'skeleton-hist-stat' },
        h('div', { className: 'skeleton-hist-stat-num skeleton' }),
        h('div', { className: 'skeleton-hist-stat-lbl skeleton' })
      ),
      h(
        'div',
        { className: 'skeleton-hist-stat' },
        h('div', { className: 'skeleton-hist-stat-num skeleton' }),
        h('div', { className: 'skeleton-hist-stat-lbl skeleton' })
      )
    ),
    h(SkeletonHistoryRow, null),
    h(SkeletonHistoryRow, null),
    h(SkeletonHistoryRow, null),
    h(SkeletonHistoryRow, null),
    h(SkeletonHistoryRow, null)
  );
}
