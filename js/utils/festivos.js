// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/festivos.js
//  Cálculo de festivos colombianos
// ════════════════════════════════════════════════════════════════

function getColombianHolidays(year){
  var hol=new Set();
  hol.add(year+"-01-01"); hol.add(year+"-05-01"); hol.add(year+"-07-20");
  hol.add(year+"-08-07"); hol.add(year+"-12-08"); hol.add(year+"-12-25");
  function formatDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function nextMon(date){var d=new Date(date.getTime());d.setDate(d.getDate()+(8-d.getDay())%7);return formatDate(d);}
  hol.add(nextMon(new Date(year,0,6)));
  hol.add(nextMon(new Date(year,2,19)));
  hol.add(nextMon(new Date(year,5,29)));
  hol.add(nextMon(new Date(year,7,15)));
  hol.add(nextMon(new Date(year,9,12)));
  hol.add(nextMon(new Date(year,10,1)));
  hol.add(nextMon(new Date(year,10,11)));
  var pascua=getEaster(year);
  function offsetPascua(days){var d=new Date(pascua.getTime());d.setDate(d.getDate()+days);return d;}
  hol.add(formatDate(offsetPascua(-3)));
  hol.add(formatDate(offsetPascua(-2)));
  hol.add(nextMon(offsetPascua(39)));
  hol.add(nextMon(offsetPascua(60)));
  hol.add(nextMon(offsetPascua(68)));
  return hol;
}

function esFest(d){
  var y=d.getFullYear();
  if(!FEST_CACHE[y]) FEST_CACHE[y]=getColombianHolidays(y);
  var key=y+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  return FEST_CACHE[y].has(key)||d.getDay()===0;
}
