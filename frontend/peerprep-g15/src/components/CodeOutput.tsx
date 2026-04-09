import { useState } from 'react';

const OutputPanel = ({ isExecuting, codeResult }: { isExecuting: boolean; codeResult: any }) => {
    const [activeTab, setActiveTab] = useState(0);

    if (isExecuting) {
        return (
            <div className="border-top p-3 text-muted d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                <div className="spinner-border spinner-border-sm" role="status" />
                Running...
            </div>
        );
    }

    if (!codeResult) return null;

    if (codeResult.error) {
        return (
            <div className="border-top p-3" style={{ fontSize: '0.85rem' }}>
                <span className="fw-semibold text-danger">Error:</span>{' '}
                <code className="text-danger">{codeResult.error}</code>
            </div>
        );
    }

    const results = codeResult.results ?? [];

    return (
        <div className="border-top d-flex flex-column" style={{ maxHeight: '220px', fontSize: '0.85rem' }}>
            {/* Tab headers */}
            <div className="d-flex border-bottom bg-light overflow-auto" style={{ flexShrink: 0 }}>
                {results.map((r: any, i: number) => (
                    <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className="btn btn-sm rounded-0 border-0 border-end px-3 py-2 d-flex align-items-center gap-1"
                        style={{
                            fontWeight: activeTab === i ? 600 : 400,
                            borderBottom: activeTab === i ? '2px solid #0d6efd' : '2px solid transparent',
                            background: activeTab === i ? '#fff' : 'transparent',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span
                            className={`badge ${r.passed ? 'bg-success' : 'bg-danger'}`}
                            style={{ fontSize: '0.65rem' }}
                        >
                            {r.passed ? '✓' : '✗'}
                        </span>
                        Case {i + 1}
                    </button>
                ))}
                {/* Overall result pill */}
                <div className="ms-auto d-flex align-items-center px-3">
                    <span className={`badge ${codeResult.passed ? 'bg-success' : 'bg-danger'}`}>
                        {results.filter((r: any) => r.passed).length}/{results.length} passed
                    </span>
                </div>
            </div>

            {/* Tab content */}
            {results[activeTab] && (
                <div className="p-3 overflow-auto flex-grow-1">
                    <div className="row g-2">
                        <div className="col-6">
                            <div className="p-2 rounded bg-light border h-100">
                                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>INPUT</div>
                                <code>
                                    {typeof results[activeTab].input === 'object' && results[activeTab].input !== null
                                        ? Object.values(results[activeTab].input).map((v: any) => JSON.stringify(v)).join(', ')
                                        : JSON.stringify(results[activeTab].input)}
                                </code>
                            </div>
                        </div>
                        <div className="col-3">
                            <div className="p-2 rounded border h-100" style={{ background: '#f0fff4', borderColor: '#86efac' }}>
                                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>EXPECTED</div>
                                <code className="text-success">{JSON.stringify(results[activeTab].expected)}</code>
                            </div>
                        </div>
                        <div className="col-3">
                            <div
                                className="p-2 rounded border h-100"
                                style={{
                                    background: results[activeTab].passed ? '#f0fff4' : '#fff5f5',
                                    borderColor: results[activeTab].passed ? '#86efac' : '#fca5a5',
                                }}
                            >
                                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>YOUR OUTPUT</div>
                                <code className={results[activeTab].passed ? 'text-success' : 'text-danger'}>
                                    {results[activeTab].actual || <span className="text-muted fst-italic">no output</span>}
                                </code>
                            </div>
                        </div>
                    </div>
                    {results[activeTab].stderr && (
                        <div className="mt-2 p-2 rounded bg-danger bg-opacity-10 border border-danger">
                            <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>STDERR</div>
                            <code className="text-danger">{results[activeTab].stderr}</code>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OutputPanel;