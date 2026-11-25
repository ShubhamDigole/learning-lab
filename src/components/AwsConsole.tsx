import { motion } from 'framer-motion'
import { useState } from 'react'
import type { AwsSnapshot } from '../python/harness.ts'
import { L } from '../lib/i18n.tsx'

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

/** A folder tree built from flat S3 keys (S3 has no real folders; "/" in keys just looks like them). */
function tree(objects: AwsSnapshot['buckets'][string]['objects']) {
  type Node = { name: string; children: Map<string, Node>; obj?: (typeof objects)[number] }
  const root: Node = { name: '', children: new Map() }
  for (const o of objects) {
    const parts = o.key.split('/')
    let cur = root
    parts.forEach((p, i) => {
      const leaf = i === parts.length - 1
      const name = leaf ? p : p + '/'
      if (!cur.children.has(name)) cur.children.set(name, { name, children: new Map() })
      cur = cur.children.get(name)!
      if (leaf) cur.obj = o
    })
  }
  return root
}

function TreeView({ node, depth = 0 }: { node: ReturnType<typeof tree>; depth?: number }) {
  return (
    <>
      {[...node.children.values()].map((c) => (
        <div key={c.name + depth}>
          <div className={`s3-row ${c.obj?.deleted ? 'deleted' : ''}`} style={{ paddingLeft: 8 + depth * 16 }}>
            <span aria-hidden>{c.obj ? (c.obj.deleted ? '🗑️' : '📄') : '📁'}</span>
            <span className="mono s3-name">{c.name || '(empty name)'}</span>
            {c.obj && (
              <span className="s3-meta mono">
                {c.obj.deleted ? 'delete marker' : fmtSize(c.obj.size)}
                {c.obj.storageClass !== 'STANDARD' && !c.obj.deleted && <span className="s3-class">{c.obj.storageClass}</span>}
                {c.obj.versions > 1 && <span className="s3-class">{c.obj.versions} versions</span>}
              </span>
            )}
          </div>
          {!c.obj && <TreeView node={c} depth={depth + 1} />}
        </div>
      ))}
    </>
  )
}

/** The simulated AWS console under the Python output: S3 buckets, Lambda logs and the API call trail. */
export function AwsConsole({ aws }: { aws: AwsSnapshot }) {
  const hasLambda = aws.invocations.length > 0
  const [tab, setTab] = useState<'s3' | 'lambda' | 'calls'>(hasLambda ? 'lambda' : 's3')
  const names = Object.keys(aws.buckets)
  return (
    <div className="aws-console">
      <div className="aws-head">
        <span className="aws-logo" aria-hidden>
          ☁️
        </span>
        <strong>
          <L en="AWS console (practice account, ap-south-1 Mumbai)" mr="AWS console (सराव account, ap-south-1 मुंबई)" />
        </strong>
        <div className="aws-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 's3'} className={tab === 's3' ? 'on' : ''} onClick={() => setTab('s3')}>
            🪣 S3 ({names.length})
          </button>
          <button type="button" role="tab" aria-selected={tab === 'lambda'} className={tab === 'lambda' ? 'on' : ''} onClick={() => setTab('lambda')}>
            λ <L en="Lambda logs" mr="Lambda logs" /> ({aws.invocations.length})
          </button>
          <button type="button" role="tab" aria-selected={tab === 'calls'} className={tab === 'calls' ? 'on' : ''} onClick={() => setTab('calls')}>
            📜 <L en="API calls" mr="API calls" /> ({aws.calls.length})
          </button>
        </div>
      </div>
      {tab === 's3' && (
        <div className="aws-body">
          {names.length === 0 && (
            <p className="muted small">
              <L en="No buckets yet." mr="अजून एकही bucket नाही." />
            </p>
          )}
          {names.map((n) => {
            const b = aws.buckets[n]
            return (
              <div key={n} className="s3-bucket">
                <div className="s3-bucket-head">
                  <span aria-hidden>🪣</span> <strong className="mono">{n}</strong>
                  <span className="s3-tags">
                    <span className={`s3-tag ${b.versioning === 'Enabled' ? 'on' : ''}`}>versioning: {b.versioning}</span>
                    <span className="s3-tag on">encryption: {b.encryption === 'AES256' ? 'SSE-S3' : b.encryption === 'aws:kms' ? 'SSE-KMS' : b.encryption}</span>
                    <span className={`s3-tag ${b.publicBlocked ? 'on' : 'warn'}`}>{b.publicBlocked ? 'public access blocked' : 'public access allowed'}</span>
                    {b.lifecycleRules > 0 && <span className="s3-tag on">lifecycle: {b.lifecycleRules} rule{b.lifecycleRules > 1 ? 's' : ''}</span>}
                    {b.policy && <span className="s3-tag on">bucket policy</span>}
                    {b.triggers.map((t) => (
                      <span key={t} className="s3-tag trig">
                        ⚡ {t}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="s3-tree">{b.objects.length ? <TreeView node={tree(b.objects)} /> : <div className="s3-row muted">(empty)</div>}</div>
              </div>
            )
          })}
        </div>
      )}
      {tab === 'lambda' && (
        <div className="aws-body">
          {!hasLambda && (
            <p className="muted small">
              <L en="No Lambda invocations in this run." mr="या run मध्ये Lambda invoke झालं नाही." />
            </p>
          )}
          {aws.invocations.map((inv, i) => (
            <motion.div key={i} className={`lambda-inv ${inv.ok ? 'ok' : 'bad'}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="lambda-inv-head">
                <span>{inv.ok ? '✅' : '❌'}</span>
                <span className="mono">{inv.source === 's3' ? 'S3 event' : inv.source === 'test' ? 'test event' : inv.source}</span>
                {inv.attempt > 1 && <span className="s3-tag warn">retry {inv.attempt - 1}</span>}
                {inv.cold && <span className="s3-tag">cold start</span>}
                <span className="muted small mono">
                  {inv.durationMs} ms · billed {inv.billedMs} ms · {inv.memoryMb} MB
                </span>
              </div>
              <pre className="lambda-logs">{inv.logs.join('\n')}</pre>
              {inv.ok && inv.result !== undefined && inv.result !== null && <pre className="lambda-result">← {JSON.stringify(inv.result)}</pre>}
            </motion.div>
          ))}
          {aws.dlq > 0 && <p className="s3-tag warn">{aws.dlq} event(s) in the on-failure destination</p>}
        </div>
      )}
      {tab === 'calls' && (
        <div className="aws-body">
          <ol className="aws-calls mono">
            {aws.calls.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
            {aws.calls.length === 0 && <li className="muted">(no AWS calls)</li>}
          </ol>
        </div>
      )}
    </div>
  )
}
