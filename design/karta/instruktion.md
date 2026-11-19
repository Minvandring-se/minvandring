# MinVandring – topografiska bakgrunder

Jag bifogar fyra separata PNG-bilder (1200 × 160 px) till startsidans fyra mellanrum. De är den godkända, nedtonade kartvarianten. Implementera dem enligt ordningen:

1. `minvandring-karta-1-skog.png` – skog/topografi, efter första stora funktionssektionen.
2. `minvandring-karta-2-sjo.png` – fjällsjö, mellan ”Vem tar tältet?” och ”Tanken bakom MinVandring”.
3. `minvandring-karta-3-hostbjorkar.png` – höstfärgad terräng, efter ”Tanken bakom MinVandring”.
4. `minvandring-karta-4-fjall.png` – kalfjäll, efter ”Vanliga frågor” före grön CTA.

## Viktigt

- Behåll befintliga kort, texter, CTA-knappar, header och hero-slideshow helt oförändrade.
- Behåll den befintliga streckade vandringsleden med tält, brasa, ledkors och vägvisare. Den ska vara separat och renderas ovanpå topografibakgrunderna.
- Lägg varje bild i sitt mellanrum som dekorativ bakgrund. Ingen extra bakgrund längs sidomarginalerna.
- Bilderna har en ljus, benvit bakgrund, **inte genomskinlig alfa**. De ska därför smälta in mot sidans `#f6f3ec`. Om en skarv syns: använd en mjuk CSS-mask/gradient vid bildens ytterkanter, inte kraftig global opacity som också tar bort höjdkurvorna.
- Bibehåll bildens proportioner, men anpassa `background-size`/`object-fit` och beskärning på mobil. Testa konkret att inget klipps av på ett fult sätt.
- Undvik att lägga ytterligare illustrationer, höjdkurvor eller animationer ovanpå utöver den befintliga leden.
- Använd `pointer-events: none`, lämpligt `aria-hidden` och inga nya layoutförskjutningar.
- Implementera först en sektion, verifiera visuellt på dator och mobil och återanvänd sedan samma komponent för övriga tre.

Syftet är en lugn, modern fjällkartebakgrund som fyller mellanrummen utan att konkurrera med den streckade leden.
