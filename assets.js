'use strict';

function svgUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function baseSvg(defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><defs>${defs}</defs><rect width="1024" height="1024" fill="white"/>${body}</svg>`;
}

const ART = {
  a1: () => baseSvg(
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff2f8"/><stop offset=".6" stop-color="#a5d6e8"/><stop offset="1" stop-color="#eddbbb"/></linearGradient>
     <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fa8bd"/><stop offset="1" stop-color="#2f7189"/></linearGradient>`,
    `<rect width="1024" height="640" fill="url(#sky)"/><circle cx="250" cy="235" r="78" fill="#fff5c8"/><path d="M100 455c70-40 120-10 190-35s150-25 210 5 180 10 240-20v235H100z" fill="#ffffff" opacity=".85"/><rect y="620" width="1024" height="404" fill="url(#sea)"/><path d="M0 730h1024M0 830h1024M0 920h1024" stroke="#ffffff" opacity=".28" stroke-width="14"/><path d="M690 620h52l-9-205h-34z" fill="#6e7f8d"/><rect x="723" y="378" width="68" height="40" fill="#e46c4a"/><circle cx="758" cy="398" r="18" fill="#fff2a8"/><path d="M718 622c22-115 58-115 80 0z" fill="#f5f9fb"/><path d="M190 940c35-22 80-22 115 0z" fill="#204f60"/><path d="M520 985c30-18 62-18 92 0z" fill="#204f60"/>`
  ),
  a2: () => baseSvg(
    `<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd382"/><stop offset=".55" stop-color="#ffab68"/><stop offset="1" stop-color="#e36f54"/></linearGradient>
     <linearGradient id="hill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb970"/><stop offset="1" stop-color="#4e7d55"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#sun)"/><circle cx="790" cy="265" r="112" fill="#fff6cf"/><path d="M0 725c160-70 285-35 435-75s300-25 589 35v339H0z" fill="url(#hill)"/><path d="M315 690h180l-36-390h-108z" fill="#f7f0e6"/><path d="M357 300h96v62h-96z" fill="#b7563f"/><path d="M338 690l18-200h98l18 200z" fill="#e9e2d5"/><rect x="345" y="430" width="120" height="24" fill="#7b4a33"/><rect x="385" y="480" width="42" height="56" fill="#7b4a33"/><path d="M135 960c48-30 105-30 153 0z" fill="#395f46"/><path d="M680 975c38-22 82-22 120 0z" fill="#395f46"/><path d="M435 860c35-25 80-25 115 0z" fill="#395f46"/>`
  ),
  a3: () => baseSvg(
    `<linearGradient id="val" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8ecd9"/><stop offset=".5" stop-color="#a9cdac"/><stop offset="1" stop-color="#6a9c78"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#val)"/><path d="M0 485l250-250 210 225 215-205 349 320v449H0z" fill="#7f9f76"/><path d="M0 625c170-65 300-30 445-70s290-20 579 40v429H0z" fill="#5f8764"/><rect x="120" y="640" width="210" height="170" fill="#f0d3ac"/><path d="M100 640l125-100 125 100z" fill="#c45b48"/><rect x="175" y="715" width="65" height="95" fill="#7a553c"/><rect x="410" y="720" width="180" height="150" fill="#f4dfc2"/><path d="M390 720l110-90 110 90z" fill="#a35a43"/><rect x="455" y="785" width="58" height="85" fill="#7a553c"/><rect x="710" y="660" width="195" height="150" fill="#efd5b2"/><path d="M690 660l118-88 117 88z" fill="#e28c58"/><rect x="755" y="718" width="60" height="92" fill="#6f4c39"/><path d="M0 1024c140-120 360-130 510-20 155 112 365 105 514-8v28z" fill="#d8e2b4"/><path d="M80 920c40-35 90-35 130 0z" fill="#4f7157"/><path d="M820 935c38-28 80-28 118 0z" fill="#4f7157"/>`
  ),
  a4: () => baseSvg(
    `<linearGradient id="flower" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffdf7a"/><stop offset=".45" stop-color="#ff9e93"/><stop offset="1" stop-color="#a35fbd"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#flower)"/><path d="M0 1024c170-210 420-170 570-30 140 130 300 125 454-25v55z" fill="#5e8f61"/><path d="M320 1024c5-190 70-315 155-365 85 50 150 175 155 365z" fill="#4f7a57"/><path d="M415 690l60-90 60 90z" fill="#ffd36b"/><circle cx="475" cy="635" r="82" fill="#ff6f81"/><circle cx="475" cy="635" r="44" fill="#fff0a8"/><path d="M155 850c45-40 95-40 140 0z" fill="#e85570"/><path d="M195 825c40-38 85-38 125 0z" fill="#f68c98"/><circle cx="740" cy="780" r="76" fill="#ffd36b"/><circle cx="740" cy="780" r="38" fill="#ff7e94"/><circle cx="175" cy="365" r="58" fill="#ffd36b"/><circle cx="175" cy="365" r="30" fill="#fff2b8"/><circle cx="835" cy="240" r="58" fill="#ff8ea0"/><circle cx="835" cy="240" r="30" fill="#fff0a8"/><circle cx="470" cy="220" r="48" fill="#ffb37a"/><circle cx="470" cy="220" r="24" fill="#fff4c2"/><path d="M245 975c38-30 82-30 120 0z" fill="#355d45"/><path d="M635 1000c35-28 78-28 115 0z" fill="#355d45"/>`
  ),
  a5: () => baseSvg(
    `<linearGradient id="city" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3d68"/><stop offset=".55" stop-color="#5f7fb7"/><stop offset="1" stop-color="#ffd194"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#city)"/><circle cx="278" cy="210" r="62" fill="#fff3c4"/><circle cx="490" cy="160" r="35" fill="#fff3c4"/><circle cx="720" cy="215" r="48" fill="#fff3c4"/><rect x="70" y="430" width="170" height="594" fill="#38496b"/><rect x="270" y="320" width="205" height="704" fill="#22334f"/><rect x="505" y="490" width="160" height="534" fill="#3d5079"/><rect x="685" y="390" width="225" height="634" fill="#1d2c47"/><path d="M300 390h145M300 470h145M300 550h145M300 630h145M300 710h145M300 790h145M300 870h145" stroke="#ffd98c" stroke-width="10"/><path d="M90 490h130M90 570h130M90 650h130M90 730h130M90 810h130M90 890h130" stroke="#ffd98c" stroke-width="10"/><path d="M520 545h130M520 625h130M520 705h130M520 785h130M520 865h130" stroke="#ffdb95" stroke-width="10"/><path d="M705 450h185M705 530h185M705 610h185M705 690h185M705 770h185M705 850h185" stroke="#ffe0a0" stroke-width="10"/><rect y="930" width="1024" height="94" fill="#4b5a70"/><path d="M0 930h1024" stroke="#ffd98c" stroke-width="10"/><circle cx="180" cy="985" r="12" fill="#fff2a8"/><circle cx="395" cy="985" r="12" fill="#fff2a8"/><circle cx="630" cy="985" r="12" fill="#fff2a8"/><circle cx="845" cy="985" r="12" fill="#fff2a8"/>`
  ),
  a6: () => baseSvg(
    `<linearGradient id="maple" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0cf"/><stop offset=".45" stop-color="#ffc780"/><stop offset="1" stop-color="#d96439"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#maple)"/><path d="M0 1024c160-165 380-150 520-25 145 130 330 120 504-15v40z" fill="#8f5430"/><path d="M412 1024c-20-200 15-335 90-405 78 70 112 205 90 405z" fill="#a5662f"/><path d="M450 660c-55-45-80-110-60-165 45 15 75 55 90 110 15-65 45-105 100-120 20 60-10 125-75 175z" fill="#d1482f"/><path d="M130 880c50-35 105-35 155 0z" fill="#c03d28"/><path d="M690 900c45-30 95-30 140 0z" fill="#c03d28"/><path d="M240 210c45-45 105-55 155-25-25 50-85 75-155 25z" fill="#e26b3a"/><path d="M620 185c50-40 110-45 155-10-30 48-90 68-155 10z" fill="#e26b3a"/><path d="M830 385c50-30 105-25 145 15-35 42-95 52-145-15z" fill="#e78a4b"/><path d="M60 385c50-30 105-25 145 15-35 42-95 52-145-15z" fill="#e78a4b"/><path d="M390 420c42-40 100-50 148-25-25 50-88 72-148 25z" fill="#f0955b"/>`
  ),
  b1: () => baseSvg(
    `<linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcecf5"/><stop offset="1" stop-color="#a4c7dd"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="#f0d7b8"/><rect x="75" y="70" width="875" height="700" rx="35" fill="#b3855a"/><rect x="105" y="100" width="815" height="640" rx="20" fill="url(#win)"/><circle cx="290" cy="245" r="85" fill="#fff7cd"/><path d="M105 525c190-55 340-25 470 25s250 30 445-35v225H105z" fill="#7ea3bb"/><rect x="470" y="70" width="35" height="700" fill="#b3855a"/><rect x="105" y="390" width="815" height="35" fill="#b3855a"/><ellipse cx="515" cy="830" rx="330" ry="120" fill="#e0a06b"/><path d="M330 860c-35-180 55-310 185-310s220 130 185 310z" fill="#f2954d"/><path d="M415 555c45-35 95-35 140 0z" fill="#f2954d"/><path d="M365 635c35-30 75-30 110 0z" fill="#ffb274"/><path d="M550 635c35-30 75-30 110 0z" fill="#ffb274"/><path d="M430 720c20-18 45-18 65 0z" fill="#6d422c"/><circle cx="445" cy="640" r="15" fill="#3d2a20"/><circle cx="590" cy="640" r="15" fill="#3d2a20"/><path d="M490 680c25-10 50 5 65 20-25 20-50 20-75 5z" fill="#e57452"/><path d="M440 835c45-22 90-22 135 0z" fill="#d6713c"/>`
  ),
  b2: () => baseSvg(
    `<linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff0c2"/><stop offset=".55" stop-color="#a8d084"/><stop offset="1" stop-color="#5d9358"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#grass)"/><circle cx="240" cy="210" r="85" fill="#fff8cd"/><circle cx="470" cy="160" r="42" fill="#fff"/><circle cx="700" cy="210" r="52" fill="#fff"/><path d="M0 720c180-70 340-35 500 20s300 30 524-30v314H0z" fill="#63955f"/><ellipse cx="510" cy="720" rx="340" ry="160" fill="#f5f0e4"/><path d="M235 695c-30-175 80-300 275-300s305 125 275 300z" fill="#f7f1e4"/><path d="M330 425c35-40 80-40 115 0z" fill="#f7f1e4"/><path d="M565 425c35-40 80-40 115 0z" fill="#f7f1e4"/><circle cx="390" cy="555" r="25" fill="#33302c"/><circle cx="630" cy="555" r="25" fill="#33302c"/><path d="M450 640c45-18 85 5 110 25-30 35-80 35-120 5z" fill="#373030"/><path d="M420 620c30-20 65-20 95 0z" fill="#d9b391"/><path d="M310 760c45-25 90-25 135 0z" fill="#d9b391"/><path d="M565 760c45-25 90-25 135 0z" fill="#d9b391"/><path d="M150 950c40-28 85-28 125 0z" fill="#4a744f"/><path d="M725 955c35-25 78-25 115 0z" fill="#4a744f"/>`
  ),
  b3: () => baseSvg(
    `<linearGradient id="garden" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf3d5"/><stop offset=".55" stop-color="#c9dfac"/><stop offset="1" stop-color="#83b287"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#garden)"/><circle cx="800" cy="215" r="80" fill="#fff8cd"/><path d="M0 735c190-75 355-40 520 20s310 25 504-35v304H0z" fill="#76a76f"/><path d="M120 905c38-30 82-30 120 0z" fill="#4c7255"/><path d="M760 915c35-28 75-28 110 0z" fill="#4c7255"/><ellipse cx="500" cy="750" rx="270" ry="155" fill="#f7f1e2"/><path d="M300 725c-35-155 60-275 200-275s235 120 200 275z" fill="#f8f2e6"/><circle cx="420" cy="600" r="18" fill="#403532"/><circle cx="590" cy="600" r="18" fill="#403532"/><path d="M490 640c35-8 70 12 85 35-25 28-70 25-100 0z" fill="#e38694"/><path d="M365 490c-25-40-15-80 15-95 25 25 25 65-15 95z" fill="#f8f2e6"/><path d="M640 490c25-40 15-80-15-95-25 25-25 65 15 95z" fill="#f8f2e6"/><path d="M370 760c45-25 90-25 135 0z" fill="#ded3bb"/><path d="M510 760c45-25 90-25 135 0z" fill="#ded3bb"/><circle cx="185" cy="370" r="52" fill="#ff8fa3"/><circle cx="185" cy="370" r="26" fill="#fff0a8"/><circle cx="855" cy="405" r="45" fill="#ffd166"/><circle cx="855" cy="405" r="22" fill="#ff8fa3"/><circle cx="490" cy="180" r="40" fill="#ffd166"/><circle cx="490" cy="180" r="20" fill="#fff5c7"/>`
  ),
  b4: () => baseSvg(
    `<linearGradient id="ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff1fb"/><stop offset=".55" stop-color="#a7d4ea"/><stop offset="1" stop-color="#6897bd"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#ice)"/><circle cx="235" cy="205" r="70" fill="#fff8cd"/><path d="M0 760c180-70 350-35 520 20s310 25 504-35v279H0z" fill="#5b89b4"/><ellipse cx="515" cy="765" rx="325" ry="145" fill="#f4f7f9"/><path d="M300 735c-45-210 65-360 215-360s260 150 215 360z" fill="#2e3744"/><ellipse cx="515" cy="430" rx="125" ry="108" fill="#fbfbfb"/><path d="M405 355c-15-35 5-65 40-70 25 28 20 68-40 70z" fill="#2e3744"/><path d="M625 355c15-35-5-65-40-70-25 28-20 68 40 70z" fill="#2e3744"/><circle cx="470" cy="565" r="15" fill="#20242b"/><circle cx="565" cy="565" r="15" fill="#20242b"/><path d="M487 625c35-10 70 10 85 35-30 28-75 25-105 0z" fill="#f49359"/><path d="M335 745c50-25 100-25 150 0z" fill="#e8eef2"/><path d="M540 745c50-25 100-25 150 0z" fill="#e8eef2"/><path d="M170 945c38-28 80-28 118 0z" fill="#487297"/><path d="M710 950c35-25 75-25 110 0z" fill="#487297"/><circle cx="115" cy="410" r="35" fill="#ff8fa3"/><circle cx="895" cy="470" r="30" fill="#ffd166"/>`
  ),
  b5: () => baseSvg(
    `<linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e5c8"/><stop offset=".55" stop-color="#dcae84"/><stop offset="1" stop-color="#a77650"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#room)"/><rect x="60" y="80" width="900" height="650" rx="25" fill="#8a6347"/><rect x="90" y="110" width="840" height="590" rx="15" fill="#a57d5b"/><path d="M120 190h780M120 305h780M120 420h780M120 535h780M120 650h780" stroke="#6f5240" stroke-width="15"/><rect x="180" y="205" width="90" height="90" rx="8" fill="#e26d5c"/><rect x="300" y="205" width="85" height="90" rx="8" fill="#6fa173"/><rect x="420" y="205" width="90" height="90" rx="8" fill="#e5b45f"/><rect x="545" y="205" width="80" height="90" rx="8" fill="#6d84a8"/><rect x="660" y="205" width="88" height="90" rx="8" fill="#d47899"/><rect x="215" y="320" width="85" height="90" rx="8" fill="#c98b5a"/><rect x="335" y="320" width="90" height="90" rx="8" fill="#9d6f8e"/><rect x="465" y="320" width="80" height="90" rx="8" fill="#74a295"/><rect x="580" y="320" width="88" height="90" rx="8" fill="#dd8466"/><rect y="730" width="1024" height="294" fill="#c08d64"/><ellipse cx="525" cy="870" rx="300" ry="105" fill="#d59c6c"/><path d="M365 885c-25-135 45-235 160-235s185 100 160 235z" fill="#caa374"/><circle cx="445" cy="750" r="15" fill="#403532"/><circle cx="600" cy="750" r="15" fill="#403532"/><path d="M500 785c30-8 60 12 72 30-25 25-65 22-90 0z" fill="#8c5a46"/><path d="M410 705c-20-35-5-70 30-78 18 32 5 68-30 78z" fill="#caa374"/><path d="M635 705c20-35 5-70-30-78-18 32-5 68 30 78z" fill="#caa374"/><rect x="720" y="770" width="145" height="105" rx="12" fill="#e9ddc2"/><path d="M725 775l68 55 67-55" fill="none" stroke="#9d8165" stroke-width="10"/><rect x="170" y="790" width="105" height="80" rx="8" fill="#5d9a7a"/>`
  ),
  b6: () => baseSvg(
    `<linearGradient id="yard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4cf"/><stop offset=".5" stop-color="#cfe3a8"/><stop offset="1" stop-color="#7fa96f"/></linearGradient>`,
    `<rect width="1024" height="1024" fill="url(#yard)"/><circle cx="245" cy="205" r="75" fill="#fff8cd"/><path d="M0 745c180-70 350-40 520 20s310 25 504-35v294H0z" fill="#6f9d68"/><path d="M150 900c40-30 88-30 128 0z" fill="#547a55"/><path d="M745 905c35-28 78-28 113 0z" fill="#547a55"/><ellipse cx="515" cy="740" rx="315" ry="145" fill="#f5efe1"/><path d="M300 715c-40-175 65-300 215-300s255 125 215 300z" fill="#eb9f57"/><circle cx="425" cy="585" r="18" fill="#3f342d"/><circle cx="595" cy="585" r="18" fill="#3f342d"/><path d="M480 625c35-10 68 10 82 32-28 28-70 24-100 0z" fill="#d4703f"/><path d="M330 455c40-42 90-42 128 0z" fill="#eb9f57"/><path d="M565 455c40-42 90-42 128 0z" fill="#eb9f57"/><ellipse cx="255" cy="735" rx="125" ry="100" fill="#f5efe1"/><path d="M170 710c-25-105 35-180 90-180s115 75 90 180z" fill="#f5efe1"/><circle cx="235" cy="640" r="14" fill="#3f342d"/><circle cx="300" cy="640" r="14" fill="#3f342d"/><path d="M258 672c25-8 48 8 58 24-20 22-50 18-70 0z" fill="#dd8894"/><path d="M185 620c-20-30-10-60 22-68 14 25 5 55-22 68z" fill="#f5efe1"/><path d="M325 620c20-30 10-60-22-68-14 25-5 55 22 68z" fill="#f5efe1"/><ellipse cx="775" cy="735" rx="115" ry="95" fill="#3e4657"/><circle cx="755" cy="645" r="14" fill="#2c3240"/><circle cx="815" cy="645" r="14" fill="#2c3240"/><path d="M765 680c25-8 48 8 58 24-20 22-50 18-70 0z" fill="#f49359"/><path d="M710 615c-20-30-10-60 22-68 14 25 5 55-22 68z" fill="#3e4657"/><path d="M840 615c20-30 10-60-22-68-14 25-5 55 22 68z" fill="#3e4657"/><circle cx="510" cy="180" r="38" fill="#ff8fa3"/><circle cx="510" cy="180" r="20" fill="#fff5c7"/>`
  )
};

const IMAGE_PACKS = [
  {
    id: 'A',
    title: '治愈风景',
    unlockAt: 0,
    primary: '#89c4d6',
    images: [
      { id: 'a1', title: '晨雾海湾', primary: '#89c4d6', art: ART.a1() },
      { id: 'a2', title: '暖阳灯塔', primary: '#f7b477', art: ART.a2() },
      { id: 'a3', title: '山谷村庄', primary: '#83a876', art: ART.a3() },
      { id: 'a4', title: '花田拱径', primary: '#e08fa9', art: ART.a4() },
      { id: 'a5', title: '城市星夜', primary: '#45618f', art: ART.a5() },
      { id: 'a6', title: '枫林小径', primary: '#cf7546', art: ART.a6() }
    ]
  },
  {
    id: 'B',
    title: '萌宠日常',
    unlockAt: 15,
    primary: '#f5b57a',
    images: [
      { id: 'b1', title: '橘猫窗台', primary: '#e9a76a', art: ART.b1() },
      { id: 'b2', title: '柴犬草地', primary: '#b3d183', art: ART.b2() },
      { id: 'b3', title: '兔子花园', primary: '#c8dda7', art: ART.b3() },
      { id: 'b4', title: '企鹅茶会', primary: '#a5c8e2', art: ART.b4() },
      { id: 'b5', title: '仓鼠书房', primary: '#d4a478', art: ART.b5() },
      { id: 'b6', title: '三猫庭院', primary: '#a8c482', art: ART.b6() }
    ]
  }
].map(pack => ({
  ...pack,
  images: pack.images.map(img => ({ ...img, src: svgUri(img.art) }))
}));
