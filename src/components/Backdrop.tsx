import type { ReactElement, ReactNode } from 'react'

// Flat illustrated backdrops, drawn in code so they follow the light/dark theme through CSS tokens.
// Each scene keeps the left third calm: that is where the cartoon cast stands.

export type Place =
  | 'office'
  | 'shop'
  | 'warehouse'
  | 'bank'
  | 'library'
  | 'fair'
  | 'home'
  | 'wedding'
  | 'themepark'
  | 'school'
  | 'postoffice'
  | 'market'
  | 'kitchen'
  | 'station'
  | 'restaurant'
  | 'hotel'
  | 'clinic'

const C = {
  sky: 'var(--bd-sky)',
  wall: 'var(--bd-wall)',
  wall2: 'var(--bd-wall-2)',
  floor: 'var(--bd-floor)',
  wood: 'var(--bd-wood)',
  line: 'var(--bd-line)',
  warm: 'var(--bd-warm)',
  green: 'var(--bd-green)',
  blue: 'var(--bd-blue)',
  red: 'var(--bd-red)',
  gold: 'var(--bd-gold)',
  glass: 'var(--bd-glass)',
}

const Room = ({ children, floorY = 200 }: { children: ReactNode; floorY?: number }) => (
  <>
    <rect width="800" height={floorY} fill={C.wall} />
    <rect y={floorY} width="800" height={260 - floorY} fill={C.floor} />
    <line x1="0" y1={floorY} x2="800" y2={floorY} stroke={C.line} strokeWidth="2" />
    {children}
  </>
)

const Window = ({ x, y, w = 110, h = 80, city = false }: { x: number; y: number; w?: number; h?: number; city?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={C.sky} stroke={C.line} strokeWidth="3" rx="3" />
    {city && (
      <g fill={C.wall2} opacity="0.9">
        <rect x={x + 8} y={y + h - 34} width="18" height="34" />
        <rect x={x + 30} y={y + h - 50} width="22" height="50" />
        <rect x={x + 56} y={y + h - 26} width="16" height="26" />
        <rect x={x + 76} y={y + h - 42} width="24" height="42" />
      </g>
    )}
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={C.line} strokeWidth="3" />
    <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={C.line} strokeWidth="3" />
  </g>
)

const Plant = ({ x, y }: { x: number; y: number }) => (
  <g>
    <path d={`M${x - 14} ${y} h28 l-4 26 h-20 z`} fill={C.warm} stroke={C.line} strokeWidth="2" />
    <ellipse cx={x - 10} cy={y - 14} rx="9" ry="18" fill={C.green} transform={`rotate(-25 ${x - 10} ${y - 14})`} />
    <ellipse cx={x + 10} cy={y - 16} rx="9" ry="20" fill={C.green} transform={`rotate(25 ${x + 10} ${y - 16})`} />
    <ellipse cx={x} cy={y - 22} rx="8" ry="22" fill={C.green} />
  </g>
)

const Books = ({ x, y, w, colors = [C.red, C.blue, C.gold, C.green, C.warm] }: { x: number; y: number; w: number; colors?: string[] }) => {
  const out: ReactNode[] = []
  let cx = x
  let i = 0
  while (cx < x + w - 10) {
    const bw = 8 + ((i * 7) % 7)
    const bh = 26 + ((i * 11) % 12)
    out.push(<rect key={i} x={cx} y={y - bh} width={bw} height={bh} fill={colors[i % colors.length]} stroke={C.line} strokeWidth="1" />)
    cx += bw + 1
    i++
  }
  return <g>{out}</g>
}

const Shelf = ({ x, y, w }: { x: number; y: number; w: number }) => <rect x={x} y={y} width={w} height="6" fill={C.wood} stroke={C.line} strokeWidth="2" />

const Boxes = ({ x, y, n, size = 22 }: { x: number; y: number; n: number; size?: number }) => (
  <g>
    {Array.from({ length: n }, (_, i) => (
      <g key={i}>
        <rect x={x + i * (size + 4)} y={y - size} width={size} height={size} fill={i % 3 === 0 ? C.warm : i % 3 === 1 ? C.gold : C.wood} stroke={C.line} strokeWidth="1.5" />
        <line x1={x + i * (size + 4)} y1={y - size / 2} x2={x + i * (size + 4) + size} y2={y - size / 2} stroke={C.line} strokeWidth="1" opacity="0.6" />
      </g>
    ))}
  </g>
)

const Clock = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r="16" fill={C.glass} stroke={C.line} strokeWidth="3" />
    <path d={`M${x} ${y} V${y - 10} M${x} ${y} H${x + 8}`} stroke={C.line} strokeWidth="2.5" strokeLinecap="round" />
  </g>
)

function Office() {
  return (
    <Room>
      <Window x={330} y={30} city />
      <Window x={460} y={30} city />
      <Clock x={620} y={52} />
      <g>
        <rect x={660} y={32} width="110" height="80" fill={C.glass} stroke={C.line} strokeWidth="3" rx="3" />
        {[0, 1, 2].map((c) => (
          <g key={c}>
            <rect x={668 + c * 34} y={44} width="26" height="18" fill={c === 0 ? C.gold : c === 1 ? C.blue : C.green} />
            <rect x={668 + c * 34} y={68} width="26" height="18" fill={c === 2 ? C.gold : C.warm} opacity="0.8" />
          </g>
        ))}
      </g>
      <rect x={400} y={160} width="230" height="10" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <rect x={410} y={170} width="8" height="30" fill={C.line} />
      <rect x={612} y={170} width="8" height="30" fill={C.line} />
      <rect x={470} y={112} width="80" height="48" fill={C.blue} stroke={C.line} strokeWidth="3" rx="4" />
      <rect x={503} y={150} width="14" height="10" fill={C.line} />
      <rect x={570} y={146} width="16" height="14" fill={C.glass} stroke={C.line} strokeWidth="2" rx="2" />
      <Plant x={720} y={174} />
    </Room>
  )
}

function Shop() {
  return (
    <Room>
      {[50, 100, 150].map((y) => (
        <g key={y}>
          <Shelf x={320} y={y} w={300} />
          <Boxes x={326} y={y} n={11} size={21} />
        </g>
      ))}
      <path d="M640 0 v40" stroke={C.line} strokeWidth="2" />
      <path d="M620 40 h40 l-8 16 h-24 z" fill={C.gold} stroke={C.line} strokeWidth="2" />
      <rect x={640} y={140} width="150" height="60" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <rect x={690} y={112} width="50" height="28" fill={C.line} rx="3" />
      <rect x={696} y={118} width="38" height="10" fill={C.green} />
      <path d="M720 70 c-14 -18 -2 -34 14 -36 c2 16 -6 30 -14 36 z" fill={C.green} stroke={C.line} strokeWidth="2" />
    </Room>
  )
}

function Warehouse() {
  return (
    <Room floorY={205}>
      {[300, 460, 620].map((x) => (
        <g key={x}>
          <rect x={x} y={20} width="6" height="185" fill={C.blue} />
          <rect x={x + 140} y={20} width="6" height="185" fill={C.blue} />
          {[70, 130, 190].map((y) => (
            <g key={y}>
              <rect x={x} y={y} width="146" height="6" fill={C.gold} stroke={C.line} strokeWidth="1.5" />
              <Boxes x={x + 10} y={y} n={4} size={28} />
            </g>
          ))}
        </g>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={i * 50} y={232} width="25" height="6" fill={C.gold} opacity="0.8" />
      ))}
    </Room>
  )
}

function Bank() {
  return (
    <Room>
      {[310, 520].map((x) => (
        <g key={x}>
          <rect x={x} y={20} width="26" height="180" fill={C.wall2} stroke={C.line} strokeWidth="2" />
          <rect x={x - 6} y={14} width="38" height="10" fill={C.wall2} stroke={C.line} strokeWidth="2" />
        </g>
      ))}
      <rect x={350} y={120} width="160" height="80" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <rect x={360} y={70} width="140" height="50" fill={C.glass} stroke={C.line} strokeWidth="2" opacity="0.9" />
      <rect x={400} y={30} width="60" height="26" fill={C.line} rx="3" />
      <text x={430} y={49} textAnchor="middle" fontFamily="monospace" fontSize="16" fontWeight="700" fill={C.gold}>
        A-17
      </text>
      <circle cx={680} cy={110} r="62" fill={C.wall2} stroke={C.line} strokeWidth="4" />
      <circle cx={680} cy={110} r="44" fill="none" stroke={C.line} strokeWidth="3" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line key={a} x1={680} y1={110} x2={680 + 40 * Math.cos((a * Math.PI) / 180)} y2={110 + 40 * Math.sin((a * Math.PI) / 180)} stroke={C.line} strokeWidth="3" />
      ))}
      <circle cx={680} cy={110} r="10" fill={C.gold} stroke={C.line} strokeWidth="2" />
    </Room>
  )
}

function Library() {
  return (
    <Room>
      {[310, 470, 630].map((x) => (
        <g key={x}>
          <rect x={x} y={20} width="150" height="180" fill={C.wood} stroke={C.line} strokeWidth="2" />
          {[66, 112, 158, 196].map((y) => (
            <g key={y}>
              <Books x={x + 6} y={y} w={138} />
              <rect x={x} y={y} width="150" height="4" fill={C.line} opacity="0.6" />
            </g>
          ))}
        </g>
      ))}
      <path d="M600 200 L640 30 M624 200 L664 30" stroke={C.line} strokeWidth="4" />
      {[60, 100, 140, 180].map((y) => (
        <line key={y} x1={600 + (200 - y) * 0.235} y1={y} x2={624 + (200 - y) * 0.235} y2={y} stroke={C.line} strokeWidth="3" />
      ))}
    </Room>
  )
}

function Fair() {
  return (
    <>
      <rect width="800" height="190" fill={C.sky} />
      <circle cx={720} cy={50} r="26" fill={C.gold} />
      <path d="M260 40 Q420 90 580 40 T800 40" fill="none" stroke={C.line} strokeWidth="2" />
      {Array.from({ length: 14 }, (_, i) => {
        const x = 280 + i * 36
        return <path key={i} d={`M${x} ${52 + Math.sin(i / 1.6) * 6} l12 0 l-6 16 z`} fill={[C.red, C.gold, C.blue, C.green][i % 4]} />
      })}
      {[340, 520].map((x, k) => (
        <g key={x}>
          <path d={`M${x} 190 v-60 l70 -40 l70 40 v60 z`} fill={C.wall} stroke={C.line} strokeWidth="2" />
          {[0, 1, 2, 3].map((s) => (
            <path key={s} d={`M${x + s * 35} 130 l${s < 2 ? 70 - s * 35 : 0} ${s < 2 ? -40 + s * 20 : 0}`} stroke={k ? C.red : C.blue} strokeWidth="10" opacity="0.7" />
          ))}
        </g>
      ))}
      <rect y={190} width="800" height="70" fill={C.green} opacity="0.75" />
    </>
  )
}

function Home() {
  return (
    <Room>
      <Window x={320} y={30} w={120} h={90} />
      <path d="M470 50 L780 50" stroke={C.line} strokeWidth="2" />
      {[490, 540, 600, 660, 720].map((x, i) => (
        <path key={x} d={`M${x} 50 h${30 + (i % 2) * 6} v${40 + (i % 3) * 10} h-${30 + (i % 2) * 6} z`} fill={[C.red, C.blue, C.gold, C.green, C.warm][i]} stroke={C.line} strokeWidth="1.5" />
      ))}
      <rect x={560} y={120} width="80" height="80" fill={C.glass} stroke={C.line} strokeWidth="3" rx="6" />
      <circle cx={600} cy={164} r="24" fill={C.blue} stroke={C.line} strokeWidth="3" opacity="0.8" />
      <path d="M680 200 l10 -46 h60 l10 46 z" fill={C.wood} stroke={C.line} strokeWidth="2" />
    </Room>
  )
}

function Wedding() {
  return (
    <Room>
      <path d="M330 200 V60 M710 200 V60" stroke={C.wood} strokeWidth="12" />
      <path d="M310 64 Q520 0 730 64" fill="none" stroke={C.red} strokeWidth="14" />
      {Array.from({ length: 9 }, (_, g) => {
        const x = 350 + g * 42
        return (
          <g key={g}>
            {[0, 1, 2, 3, 4].map((k) => (
              <circle key={k} cx={x} cy={62 + k * 14 - Math.abs(4 - g) * 3} r="6" fill={k % 2 ? C.gold : C.warm} />
            ))}
          </g>
        )
      })}
      <rect x={380} y={168} width="280" height="32" fill={C.red} opacity="0.75" stroke={C.line} strokeWidth="2" />
      {[400, 640].map((x) => (
        <g key={x}>
          <circle cx={x} cy={150} r="14" fill={C.gold} />
          <rect x={x - 3} y={150} width="6" height="18" fill={C.green} />
        </g>
      ))}
    </Room>
  )
}

function ThemePark() {
  return (
    <>
      <rect width="800" height="200" fill={C.sky} />
      <path d="M260 200 C320 40 400 40 440 120 S560 220 620 70 S740 30 800 120" fill="none" stroke={C.red} strokeWidth="8" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={280 + i * 44} y1={200} x2={290 + i * 44} y2={110 + Math.sin(i) * 40} stroke={C.line} strokeWidth="2" opacity="0.6" />
      ))}
      <rect x={604} y={56} width="34" height="20" rx="5" fill={C.gold} stroke={C.line} strokeWidth="2" />
      <rect y={200} width="800" height="60" fill={C.floor} />
      <rect x={700} y={110} width="8" height="90" fill={C.line} />
      <rect x={680} y={96} width="48" height="22" fill={C.gold} stroke={C.line} strokeWidth="2" rx="3" />
      <text x={704} y={112} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="sans-serif" fill={C.line}>
        120cm
      </text>
    </>
  )
}

function School() {
  return (
    <Room>
      <rect x={320} y={30} width="300" height="120" fill={C.green} stroke={C.wood} strokeWidth="8" />
      <text x={350} y={80} fontFamily="'Comic Sans MS', cursive" fontSize="22" fill="#f4f4ea" opacity="0.9">
        75+  60+  Pass
      </text>
      <text x={350} y={118} fontFamily="'Comic Sans MS', cursive" fontSize="18" fill="#f4f4ea" opacity="0.8">
        avg = 64
      </text>
      <Clock x={680} y={60} />
      {[360, 520].map((x) => (
        <g key={x}>
          <rect x={x} y={170} width="110" height="8" fill={C.wood} stroke={C.line} strokeWidth="2" />
          <rect x={x + 8} y={178} width="6" height="22" fill={C.line} />
          <rect x={x + 96} y={178} width="6" height="22" fill={C.line} />
        </g>
      ))}
      <circle cx={720} cy={150} r="22" fill={C.blue} stroke={C.line} strokeWidth="2" />
      <path d="M700 150 q20 -10 40 0 M704 140 q16 6 32 0" stroke={C.green} strokeWidth="4" fill="none" />
      <rect x={717} y={172} width="6" height="28" fill={C.line} />
    </Room>
  )
}

function PostOffice() {
  return (
    <Room>
      <rect x={320} y={30} width="220" height="120" fill={C.wood} stroke={C.line} strokeWidth="2" />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => <rect key={`${r}-${c}`} x={328 + c * 35} y={38 + r * 28} width="30" height="22" fill={(r + c) % 3 ? C.glass : C.gold} stroke={C.line} strokeWidth="1.5" />),
      )}
      <rect x={300} y={160} width="260" height="40" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <g>
        <rect x={650} y={80} width="60" height="120" rx="28" fill={C.red} stroke={C.line} strokeWidth="3" />
        <rect x={662} y={110} width="36" height="6" rx="3" fill={C.line} />
        <rect x={644} y={74} width="72" height="14" rx="7" fill={C.red} stroke={C.line} strokeWidth="3" />
      </g>
    </Room>
  )
}

function Market() {
  return (
    <>
      <rect width="800" height="200" fill={C.sky} />
      {[300, 480, 660].map((x, k) => (
        <g key={x}>
          <path d={`M${x} 60 h150 l-10 30 h-130 z`} fill={k === 1 ? C.green : C.red} stroke={C.line} strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((s) => (
            <rect key={s} x={x + 6 + s * 28} y={60} width="14" height="30" fill="#ffffff" opacity="0.5" />
          ))}
          <rect x={x + 6} y={90} width="6" height="110" fill={C.line} />
          <rect x={x + 138} y={90} width="6" height="110" fill={C.line} />
          <rect x={x + 10} y={150} width="130" height="50" fill={C.wood} stroke={C.line} strokeWidth="2" />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={x + 24 + (i % 5) * 26} cy={142 + Math.floor(i / 5) * -12} r="10" fill={[C.red, C.green, C.gold, C.warm][(i + k) % 4]} stroke={C.line} strokeWidth="1" />
          ))}
        </g>
      ))}
      <rect y={200} width="800" height="60" fill={C.floor} />
    </>
  )
}

function Kitchen() {
  return (
    <Room>
      <rect x={300} y={140} width="480" height="60" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <Shelf x={330} y={70} w={260} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={342 + i * 42} y={40} width="26" height="30" rx="5" fill={C.glass} stroke={C.line} strokeWidth="2" />
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M${360 + i * 70} 140 q25 24 50 0 z`} fill={[C.warm, C.red, C.gold][i]} stroke={C.line} strokeWidth="2" />
        </g>
      ))}
      <rect x={620} y={110} width="120" height="30" fill={C.line} rx="4" />
      <ellipse cx={680} cy={104} rx="42" ry="10" fill={C.wall2} stroke={C.line} strokeWidth="3" />
      <rect x={640} y={80} width="80" height="26" fill={C.wall2} stroke={C.line} strokeWidth="3" />
    </Room>
  )
}

function Station() {
  return (
    <>
      <rect width="800" height="190" fill={C.wall} />
      <rect x={300} y={90} width="500" height="80" fill={C.blue} stroke={C.line} strokeWidth="3" rx="10" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={320 + i * 60} y={104} width="40" height="30" fill={C.glass} stroke={C.line} strokeWidth="2" rx="3" />
      ))}
      <rect x={300} y={146} width="500" height="8" fill={C.gold} />
      <rect x={330} y={22} width="250" height="52" fill={C.line} rx="4" />
      {[0, 1].map((r) => (
        <text key={r} x={342} y={44 + r * 20} fontFamily="monospace" fontSize="14" fontWeight="700" fill={C.gold}>
          {r ? '18:40  MUMBAI   PF 2' : '18:05  MUMBAI   PF 1'}
        </text>
      ))}
      <Clock x={640} y={48} />
      <rect y={190} width="800" height="70" fill={C.floor} />
      <rect y={186} width="800" height="6" fill={C.gold} opacity="0.8" />
    </>
  )
}

function Restaurant() {
  return (
    <Room>
      <rect x={330} y={24} width="200" height="96" fill={C.line} rx="6" />
      {['MASALA DOSA   120', 'MISAL PAV      90', 'VADA PAV       25', 'CUTTING CHAI   20'].map((t, i) => (
        <text key={t} x={346} y={50 + i * 20} fontFamily="monospace" fontSize="13" fontWeight="700" fill={i % 2 ? C.glass : C.gold}>
          {t}
        </text>
      ))}
      <line x1={560} y1={40} x2={780} y2={40} stroke={C.line} strokeWidth="3" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`rotate(${i % 2 ? 3 : -3} ${585 + i * 52} 42)`}>
          <rect x={565 + i * 52} y={42} width="40" height="54" fill={C.glass} stroke={C.line} strokeWidth="2" />
          <rect x={571 + i * 52} y={50} width="22" height="4" fill={C.line} />
          <rect x={571 + i * 52} y={60} width="28" height="3" fill={C.wall2} />
          <rect x={571 + i * 52} y={68} width="18" height="3" fill={C.wall2} />
        </g>
      ))}
      <rect x={300} y={140} width="500" height="60" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <rect x={300} y={134} width="500" height="8" fill={C.warm} stroke={C.line} strokeWidth="2" />
      <path d="M640 134 a14 14 0 0 1 28 0 z" fill={C.gold} stroke={C.line} strokeWidth="2" />
      <rect x={650} y={118} width="8" height="4" fill={C.line} />
      <g>
        <rect x={700} y={92} width="56" height="42" rx="6" fill={C.red} stroke={C.line} strokeWidth="2.5" />
        <rect x={712} y={84} width="32" height="10" rx="4" fill="none" stroke={C.line} strokeWidth="2.5" />
        <text x={728} y={118} textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill={C.glass}>
          GO
        </text>
      </g>
      {[380, 470].map((x) => (
        <path key={x} d={`M${x} 134 q22 -26 44 0 z`} fill={x === 380 ? C.gold : C.green} stroke={C.line} strokeWidth="2" />
      ))}
    </Room>
  )
}

function Hotel() {
  return (
    <Room>
      <rect x={320} y={30} width="250" height="100" fill={C.wood} stroke={C.line} strokeWidth="2" />
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => (
          <g key={`${r}-${c}`}>
            <rect x={330 + c * 34} y={40 + r * 30} width="28" height="24" fill={C.wall2} stroke={C.line} strokeWidth="1.5" />
            {(r * 7 + c) % 3 !== 1 && <rect x={340 + c * 34} y={46 + r * 30} width="8" height="12" rx="2" fill={(r + c) % 2 ? C.gold : C.blue} stroke={C.line} strokeWidth="1" />}
          </g>
        )),
      )}
      <rect x={300} y={150} width="300" height="50" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <rect x={295} y={144} width="310" height="8" fill={C.warm} stroke={C.line} strokeWidth="2" />
      <path d="M520 144 a12 12 0 0 1 24 0 z" fill={C.gold} stroke={C.line} strokeWidth="2" />
      <rect x={400} y={8} width="90" height="18" rx="3" fill={C.line} />
      <text x={445} y={21} textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill={C.gold}>
        RECEPTION
      </text>
      <g>
        <rect x={650} y={50} width="110" height="150" fill={C.wall2} stroke={C.line} strokeWidth="3" />
        <line x1={705} y1={50} x2={705} y2={200} stroke={C.line} strokeWidth="3" />
        <rect x={690} y={22} width="30" height="18" rx="3" fill={C.line} />
        <path d="M698 35 l7 -8 l7 8 z" fill={C.gold} />
        <circle cx={775} cy={120} r="5" fill={C.gold} stroke={C.line} strokeWidth="2" />
      </g>
      <Plant x={610} y={174} />
    </Room>
  )
}

function Clinic() {
  return (
    <Room>
      <rect x={330} y={26} width="150" height="34" rx="4" fill={C.green} stroke={C.line} strokeWidth="2" />
      <text x={405} y={49} textAnchor="middle" fontFamily="sans-serif" fontSize="14" fontWeight="800" fill={C.glass}>
        OPD
      </text>
      <g>
        <rect x={510} y={22} width="40" height="40" rx="6" fill={C.glass} stroke={C.line} strokeWidth="2" />
        <rect x={526} y={28} width="8" height="28" fill={C.red} />
        <rect x={516} y={38} width="28" height="8" fill={C.red} />
      </g>
      <rect x={330} y={80} width="170" height="70" rx="4" fill={C.line} />
      <rect x={338} y={88} width="154" height="54" fill={C.blue} opacity="0.85" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={346} y={96 + i * 15} width={i === 1 ? 100 : 130} height="7" rx="2" fill={C.glass} opacity="0.9" />
      ))}
      <rect x={300} y={160} width="260" height="40" fill={C.wood} stroke={C.line} strokeWidth="2" />
      <rect x={295} y={154} width="270" height="8" fill={C.glass} stroke={C.line} strokeWidth="2" />
      {[600, 650, 700, 750].map((x) => (
        <g key={x}>
          <rect x={x} y={150} width="38" height="10" rx="3" fill={C.blue} stroke={C.line} strokeWidth="2" />
          <rect x={x + 2} y={160} width="4" height="40" fill={C.line} />
          <rect x={x + 32} y={160} width="4" height="40" fill={C.line} />
          <rect x={x} y={124} width="38" height="28" rx="4" fill={C.blue} stroke={C.line} strokeWidth="2" />
        </g>
      ))}
      <Clock x={640} y={60} />
      <Plant x={575} y={174} />
    </Room>
  )
}

const SCENES: Record<Place, () => ReactElement> = {
  office: Office,
  shop: Shop,
  warehouse: Warehouse,
  bank: Bank,
  library: Library,
  fair: Fair,
  home: Home,
  wedding: Wedding,
  themepark: ThemePark,
  school: School,
  postoffice: PostOffice,
  market: Market,
  kitchen: Kitchen,
  station: Station,
  restaurant: Restaurant,
  hotel: Hotel,
  clinic: Clinic,
}

export function Backdrop({ place }: { place: Place }) {
  const Scene = SCENES[place]
  return (
    <svg className="backdrop" viewBox="0 0 800 260" preserveAspectRatio="xMaxYMax slice" aria-hidden focusable="false">
      <Scene />
    </svg>
  )
}
