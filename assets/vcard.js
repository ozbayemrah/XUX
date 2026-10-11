/* Shared contact card (vCard) for index.html and work-system.html.
   Edit CONTACT here — every QR code ([data-vcard-qr]) and every
   "Save contact" link ([data-vcard-download]) on both pages
   regenerates from it. Needs qrcode-generator loaded first. */
var CONTACT = {
  first: "Emrah",
  last: "Özbay",
  org: "XUX Studio (working name)",
  title: "Founder · Product & Interaction Designer",
  workEmail: "emrah.oezbay@edu.fh-joanneum.at",   // listed first / preferred
  personalEmail: "ozbayemrah.design@gmail.com",
  workPhone: "+3866767717175",
  website: "https://ozbayemrah.github.io/XUX/",   // main URL
  linkedin: "https://www.linkedin.com/in/ozbayemrah",
  city: "Graz",
  region: "Styria",
  country: "Austria"
};

(function () {
  var c = CONTACT;
  var lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:" + c.last + ";" + c.first + ";;;",
    "FN:" + c.first + " " + c.last,
    "ORG:" + c.org,
    "TITLE:" + c.title
  ];
  if (c.workPhone) lines.push("TEL;TYPE=WORK,VOICE,PREF:" + c.workPhone);
  if (c.workEmail) lines.push("EMAIL;TYPE=INTERNET,WORK,PREF:" + c.workEmail);
  if (c.personalEmail) lines.push("EMAIL;TYPE=INTERNET,HOME:" + c.personalEmail);
  if (c.website) lines.push("URL;TYPE=WORK:" + c.website);
  if (c.linkedin) lines.push("URL;TYPE=LinkedIn:" + c.linkedin);
  lines.push(
    "ADR;TYPE=WORK:;;;" + c.city + ";" + c.region + ";;" + c.country,
    "END:VCARD"
  );
  var vcf = lines.join("\r\n");

  document.querySelectorAll("[data-vcard-download]").forEach(function (a) {
    a.href = "data:text/vcard;charset=utf-8," + encodeURIComponent(vcf);
  });

  if (typeof qrcode !== "function") return;
  // UTF-8 so the "Ö" survives the scan
  qrcode.stringToBytes = function (s) { return Array.from(new TextEncoder().encode(s)); };
  var qr = qrcode(0, "M");
  qr.addData(vcf, "Byte");
  qr.make();
  var svg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  document.querySelectorAll("[data-vcard-qr]").forEach(function (box) { box.innerHTML = svg; });
})();
