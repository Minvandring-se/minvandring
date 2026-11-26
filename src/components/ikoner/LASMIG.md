# MinVandrings ikoner i linosnitt

Stil: linosnitt. En fylld form i skogsgrönt med skurna urtag. 24 × 24 px rutnät.
Urtagen är genomskinliga (SVG-mask), så ikonen fungerar på alla ytor. Färgen kommer från currentColor.
Storlekar: 24 px i menyn, 28 px i listor, 32–36 px i genvägar.
Ersätter den varma tvåtonen (Claude outputs/ikoner/). Samma motiv som de godkända tvåtonsikonerna.

Omgångar:
1. Meny (godkänd 26 nov): hem, mina-turer, matplanering, packlistor, mitt-forrad, utrustningskatalog, skafferi, dagbok, statistik, vandringskompisar
2. Tur och vandring (godkänd 26 nov): etapp, dag, overnattning, vindskydd, kompass, hojdmeter, distans, vader, ledkryss, ros
3. Mat (godkänd 26 nov): middag, grot, matpase, gaspatron, kok, vatten, kaffe, mellanmal, inkopslista, allergi
4. Utrustning (godkänd 26 nov): skor, kniv, termos, pannlampa, stavar, jacka, forsta-hjalpen, laddare. byxor och vattenrening (omritade, godkända).
5. Natur och folk (godkänd 26 nov): fjall, fjallbjork, back, norrsken, sno, ren, hund, lagereld, deltagare, inbjudan

Extra, inte godkända än: extra/sovsack.svg (kategorin Sova) och extra/hygien.svg (kategorin Hygien).

Urtagen görs med <mask>. Varje SVG har ett eget mask-id (m1, m2 ...). När flera ikoner visas på samma sida måste id:t vara unikt per ikon, till exempel med React useId.
