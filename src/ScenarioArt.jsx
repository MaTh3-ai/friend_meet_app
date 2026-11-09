import React, { useId } from "react";

function Orange({ x, y, size = 72, rotate = 0 }) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate} ${size / 2} ${size / 2}) scale(${size / 100})`}
    >
      <ellipse cx="50" cy="91" rx="37" ry="6" fill="#625075" opacity=".12" />
      <path
        d="M49 20Q20 10 14 39Q5 73 33 84Q57 94 79 78Q96 64 85 39Q77 19 55 20Z"
        fill="#e99c5a"
      />
      <path
        d="M47 18Q20 12 14 39Q8 62 29 76Q51 88 72 73Q87 62 80 37Q74 19 53 20Z"
        fill="#ffc17b"
      />
      <ellipse
        cx="32"
        cy="36"
        rx="9"
        ry="5"
        fill="#ffe3b9"
        opacity=".75"
        transform="rotate(-35 32 36)"
      />
      <path
        d="M50 22Q45 9 52 7"
        stroke="#80634d"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M49 17Q31 4 27 18Q34 26 49 17M51 15Q61 1 71 11Q67 23 51 15"
        fill="#83cda4"
      />
      <circle cx="37" cy="51" r="3" fill="#52436a" />
      <circle cx="65" cy="51" r="3" fill="#52436a" />
      <path
        d="M45 61Q51 67 57 61"
        fill="none"
        stroke="#73546a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="29" cy="59" rx="6" ry="3" fill="#f6a2a0" />
      <ellipse cx="73" cy="59" rx="6" ry="3" fill="#f6a2a0" />
    </g>
  );
}

function Octopus({ x, y, size = 78, rotate = 0 }) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate} ${size / 2} ${size / 2}) scale(${size / 100})`}
    >
      <ellipse cx="50" cy="91" rx="38" ry="6" fill="#625075" opacity=".12" />
      <path
        d="M24 67Q5 70 11 80Q17 88 31 80Q35 92 46 83Q53 93 60 82Q75 90 77 79Q92 86 90 75Q88 68 76 66Z"
        fill="#c16da9"
      />
      <path
        d="M22 53Q20 19 48 15Q78 12 79 49Q81 76 51 79Q23 79 22 53Z"
        fill="#efb2d1"
      />
      <path
        d="M27 45Q26 24 45 22"
        fill="none"
        stroke="#fff3f8"
        strokeWidth="6"
        strokeLinecap="round"
        opacity=".7"
      />
      <circle cx="38" cy="52" r="3.2" fill="#514463" />
      <circle cx="64" cy="52" r="3.2" fill="#514463" />
      <path
        d="M45 61Q51 68 58 61"
        stroke="#806078"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="31" cy="60" rx="5" ry="3" fill="#eb90b3" />
      <ellipse cx="71" cy="60" rx="5" ry="3" fill="#eb90b3" />
    </g>
  );
}

function Plant({ x, y, size = 70, rotate = 0 }) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate} ${size / 2} ${size / 2}) scale(${size / 100})`}
    >
      <ellipse cx="50" cy="93" rx="31" ry="5" fill="#625075" opacity=".12" />
      <path
        d="M50 49Q48 25 54 13M49 45Q36 30 24 26M52 42Q66 24 77 23"
        fill="none"
        stroke="#67a988"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M48 33Q24 36 27 16Q45 13 48 33M55 33Q57 11 76 13Q78 29 55 33M49 20Q43 4 53 3Q63 6 54 20"
        fill="#8cdbb3"
      />
      <path d="M21 45H79L73 83Q71 91 63 91H37Q29 91 27 83Z" fill="#cb8d9c" />
      <path d="M21 45H74L69 78Q67 84 60 84H34Q29 84 28 78Z" fill="#ffd5ca" />
      <rect x="17" y="42" width="66" height="11" rx="5" fill="#ffe7dd" />
      <circle cx="39" cy="67" r="2.5" fill="#66505f" />
      <circle cx="62" cy="67" r="2.5" fill="#66505f" />
      <path
        d="M44 74Q50 79 56 74"
        fill="none"
        stroke="#9d6b70"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
  );
}

const Seal = ({ x, y, size = 100 }) => (
  <image href="/avatars/4.svg" x={x} y={y} width={size} height={size} />
);
const Mushroom = ({ x, y, size = 100 }) => (
  <image href="/avatars/5.svg" x={x} y={y} width={size} height={size} />
);

export function ScenarioArt({ scene }) {
  const uid = useId().replace(/:/g, "");
  const bg = {
    party: ["#f8d7e9", "#e2d3f7"],
    interests: ["#ffebdc", "#f5dfea"],
    activities: ["#d7f4e6", "#e6edff"],
    humour: ["#fbe2e7", "#f7e9cc"],
    references: ["#dcdffb", "#eadbf5"],
  }[scene];
  return (
    <svg
      className="scenario-art"
      viewBox="0 0 400 200"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
        <linearGradient id={`${uid}-window`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#d4eff7" />
          <stop offset="1" stopColor="#fff0ed" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect x="2" y="2" width="396" height="196" rx="28" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        <rect width="400" height="200" fill={`url(#${uid}-bg)`} />
        {scene === "party" && (
          <g>
            <path d="M0 142Q195 124 400 142V200H0Z" fill="#e2c6e9" />
            <rect x="30" y="27" width="68" height="73" rx="8" fill="#fff5f9" />
            <rect
              x="36"
              y="33"
              width="56"
              height="61"
              rx="5"
              fill={`url(#${uid}-window)`}
            />
            <path d="M64 34v60M36 65h56" stroke="#fff7fb" strokeWidth="4" />
            <circle cx="75" cy="44" r="7" fill="#f7da9f" />
            <path
              d="M0 15Q95 56 196 16Q298 55 400 13"
              fill="none"
              stroke="#ac91bd"
              strokeWidth="2"
            />
            <path d="m37 26 14 4-10 11z" fill="#f18fb9" />
            <path d="m85 37 14 1-7 12z" fill="#8cd9bf" />
            <path d="m135 37 14-4-4 14z" fill="#c1a2e7" />
            <path d="m241 33 14 4-9 11z" fill="#f096be" />
            <path d="m297 38 14-2-6 13z" fill="#8cd9bf" />
            <path d="m350 28 13-5-3 14z" fill="#f4c98c" />
            <path d="M305 108h58v52h-58z" fill="#c5a6d0" />
            <path d="M300 104h68v10h-68z" rx="5" fill="#fff4f8" />
            <path d="M315 87h16l-2 17h-12zM341 88h15l-2 16h-11z" fill="#fff" />
            <Plant x={24} y={92} size={76} />
            <Orange x={81} y={92} size={75} />
            <Mushroom x={139} y={76} size={104} />
            <Seal x={223} y={76} size={104} />
            <Octopus x={290} y={106} size={71} />
            <circle cx="26" cy="70" r="3" fill="#fff" />
            <circle cx="265" cy="50" r="4" fill="#fff" />
          </g>
        )}
        {scene === "interests" && (
          <g>
            <path d="M0 145Q200 131 400 145V200H0Z" fill="#f1cfd9" />
            <rect x="31" y="33" width="77" height="69" rx="9" fill="#fff8f5" />
            <rect
              x="38"
              y="40"
              width="63"
              height="55"
              rx="5"
              fill={`url(#${uid}-window)`}
            />
            <path d="M69 40v55M38 68h63" stroke="#fff" strokeWidth="4" />
            <rect x="277" y="38" width="73" height="53" rx="7" fill="#fdf9f4" />
            <circle cx="299" cy="57" r="8" fill="#f2b2b9" />
            <path d="m283 83 17-19 13 13 10-10 19 16z" fill="#9dd6c8" />
            <path
              d="M91 131q-16-22 2-29h209q18 7 2 29l-10 29H101Z"
              fill="#cf9eae"
            />
            <rect
              x="83"
              y="105"
              width="234"
              height="31"
              rx="15"
              fill="#ffc9c2"
            />
            <rect x="95" y="96" width="70" height="30" rx="14" fill="#fff0e6" />
            <rect
              x="235"
              y="96"
              width="70"
              height="30"
              rx="14"
              fill="#fff0e6"
            />
            <Mushroom x={92} y={83} size={98} />
            <Seal x={208} y={78} size={108} />
            <path
              d="M145 25h91q15 0 15 15v24q0 15-15 15h-29l-13 12 2-12h-51q-15 0-15-15V40q0-15 15-15z"
              fill="#fff9fc"
            />
            <path
              d="M154 45v15q0 5-5 5t-5-4q0-4 6-4V43l13-3v16q0 5-5 5t-5-4q0-4 6-4V43z"
              fill="#b496d5"
            />
            <path d="M180 43h20v22h-20z" fill="#ffd0ca" />
            <path d="m186 47 10 7-10 7z" fill="#c978a8" />
            <path
              d="M220 41q-9-5-15 0v19q7-4 15 1 8-5 15-1V41q-6-5-15 0v20"
              fill="#d1eee1"
              stroke="#8abdad"
              strokeWidth="2"
            />
            <Octopus x={317} y={111} size={53} rotate={-8} />
          </g>
        )}
        {scene === "activities" && (
          <g>
            <circle cx="318" cy="39" r="19" fill="#ffdfab" />
            <path
              d="M0 111 59 64l45 41 54-58 75 68 62-42 105 49v78H0Z"
              fill="#bdcbe3"
            />
            <path
              d="m41 80 18-16 17 16-17-5zM141 65l17-18 20 18-19-6z"
              fill="#f8fbff"
            />
            <path
              d="M0 145Q78 100 165 141Q246 165 400 112V200H0Z"
              fill="#a6dccb"
            />
            <path
              d="M0 165Q100 138 201 159Q303 176 400 142V200H0Z"
              fill="#d9efcf"
            />
            <path
              d="M27 141q4-31 29-35-6 29-29 35M357 129q2-30 24-35-3 26-24 35"
              fill="#80cbaa"
            />
            <Mushroom x={112} y={92} size={96} />
            <Seal x={199} y={91} size={99} />
            <Orange x={287} y={123} size={57} />
            <g transform="translate(23 41) rotate(-9)">
              <rect width="58" height="55" rx="14" fill="#fffaf7" />
              <circle cx="29" cy="27" r="16" fill="#f4abc8" />
              <path
                d="M14 27h30M29 11q-11 16 0 32M29 11q11 16 0 32"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
            <g transform="translate(310 69) rotate(10)">
              <rect width="58" height="52" rx="14" fill="#fffaf7" />
              <path
                d="M13 24q4-7 10-7h12q6 0 10 7l4 12q1 7-6 5l-7-5H23l-7 5q-7 2-6-5z"
                fill="#a1dfce"
              />
              <path d="M19 27h9m-4-4v9" stroke="#678f8a" strokeWidth="2" />
              <circle cx="38" cy="26" r="2" fill="#678f8a" />
            </g>
            <path
              d="M175 38q25-10 50 0"
              fill="none"
              stroke="#eab1c9"
              strokeWidth="3"
              strokeDasharray="3 6"
            />
          </g>
        )}
        {scene === "humour" && (
          <g>
            <rect x="31" y="27" width="69" height="55" rx="8" fill="#fff6ec" />
            <path d="M39 74 57 48l12 15 11-12 12 23z" fill="#bddcc6" />
            <circle cx="79" cy="43" r="7" fill="#f8c893" />
            <path d="M0 145Q180 133 400 146v54H0Z" fill="#efd1cd" />
            <ellipse cx="202" cy="154" rx="96" ry="14" fill="#e2c6c9" />
            <rect
              x="164"
              y="127"
              width="72"
              height="24"
              rx="9"
              fill="#d5a59c"
            />
            <ellipse cx="200" cy="126" rx="47" ry="10" fill="#fff1e8" />
            <path
              d="M186 118q8-8 16 0t16 0"
              fill="none"
              stroke="#dd91b3"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <Mushroom x={74} y={71} size={111} />
            <Seal x={217} y={68} size={112} />
            <Octopus x={303} y={109} size={61} rotate={8} />
            <path
              d="M88 62q-10-9-5-18M101 52q-2-12 7-16M312 60q10-8 5-17M299 51q2-12-7-16"
              fill="none"
              stroke="#d77da9"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M171 26q15-13 30 0 13-13 27 0l-3 9-24 9-27-9z"
              fill="#fff8f9"
            />
            <path
              d="m187 32 4 4 4-4m13 0 4 4 4-4"
              stroke="#b88eaf"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        {scene === "references" && (
          <g>
            <path d="M0 142Q210 132 400 142v58H0Z" fill="#c9c5e7" />
            <path
              d="M18 37q42-25 84 0M298 37q42-25 84 0"
              fill="none"
              stroke="#b3a4d6"
              strokeWidth="3"
            />
            <path
              d="M89 153q-3-23 21-24h180q24 1 21 24v18H89Z"
              fill="#c38dad"
            />
            <path
              d="M102 127h196q13 0 13 14v12H89v-12q0-14 13-14z"
              fill="#f2b5cc"
            />
            <rect
              x="135"
              y="21"
              width="130"
              height="97"
              rx="15"
              fill="#fffaff"
            />
            <rect
              x="143"
              y="29"
              width="114"
              height="79"
              rx="9"
              fill="#a8e3d3"
            />
            <circle cx="174" cy="53" r="11" fill="#f8c6d6" />
            <path d="m153 99 26-26 18 16 13-13 37 23z" fill="#9dbddd" />
            <path
              d="M189 124h22m-11-6v6"
              stroke="#a78aba"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Mushroom x={66} y={101} size={83} />
            <Seal x={145} y={102} size={85} />
            <Octopus x={221} y={112} size={74} />
            <Orange x={292} y={116} size={65} />
            <path
              d="m95 44 3 6 7 2-7 2-3 6-2-6-7-2 7-2zM299 47l3 6 7 2-7 2-3 6-2-6-7-2 7-2z"
              fill="#fff7fd"
            />
          </g>
        )}
      </g>
    </svg>
  );
}
