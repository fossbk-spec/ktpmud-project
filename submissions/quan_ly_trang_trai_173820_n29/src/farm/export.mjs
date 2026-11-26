import {excelStyles,excelStyleIds} from './excel-style.mjs';
// Small, dependency-free OOXML writer. Text uses inline strings (never formulas).
const xml=v=>String(v??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
const enc=new TextEncoder();
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xEDB88320^(n>>>1):n>>>1;return n>>>0});
const crc=bytes=>{let n=0xFFFFFFFF;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return(n^0xFFFFFFFF)>>>0};
const col=n=>{let s='';do{s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)-1}while(n>=0);return s};
function zip(files){const chunks=[],directory=[];let offset=0;const u16=(v,o,n)=>v.setUint16(o,n,true),u32=(v,o,n)=>v.setUint32(o,n,true);for(const [name,text] of Object.entries(files)){const path=enc.encode(name),data=enc.encode(text),sum=crc(data),head=new Uint8Array(30+path.length),v=new DataView(head.buffer);u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u16(v,12,0x21);u32(v,14,sum);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,path.length);head.set(path,30);const cent=new Uint8Array(46+path.length),c=new DataView(cent.buffer);u32(c,0,0x02014b50);u16(c,4,20);u16(c,6,20);u16(c,8,0x800);u16(c,14,0x21);u32(c,16,sum);u32(c,20,data.length);u32(c,24,data.length);u16(c,28,path.length);u32(c,42,offset);cent.set(path,46);chunks.push(head,data);directory.push(cent);offset+=head.length+data.length}const size=directory.reduce((s,x)=>s+x.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);u32(v,0,0x06054b50);u16(v,8,directory.length);u16(v,10,directory.length);u32(v,12,size);u32(v,16,offset);const all=[...chunks,...directory,end],out=new Uint8Array(offset+size+22);let cursor=0;for(const c of all){out.set(c,cursor);cursor+=c.length}return out}
export function workbook(inputSheets){
 const sheets=inputSheets.map((s,i)=>({...s,name:(s.name||'Bảng '+(i+1)).replace(/[\\/?*\[\]:]/g,' ').slice(0,31)}));
 const names=sheets.map(s=>s.name),roles=excelStyleIds;
 const cell=(value,address,style)=>value&&typeof value==='object'&&'formula' in value?`<c r="${address}" s="${style}"><f>${xml(value.formula)}</f><v>${value.value}</v></c>`:value instanceof Date?`<c r="${address}" s="${style}"><v>${Math.floor(value.getTime()/86400000)+25569}</v></c>`:typeof value==='number'&&Number.isFinite(value)?`<c r="${address}" s="${style}"><v>${value}</v></c>`:value==null?`<c r="${address}" s="${style}"/>`:`<c r="${address}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
 const files={
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>',
 '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/styles.xml':excelStyles,
 'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>'+sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets><definedNames>'+sheets.map((s,i)=>`<definedName name="_xlnm.Print_Titles" localSheetId="${i}">'${xml(s.name.replace(/'/g,"''"))}'!$5:$5</definedName>`).join('')+'</definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>',
 'xl/_rels/workbook.xml.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`};
 sheets.forEach((s,i)=>{
  const n=s.headers.length,last=col(n-1),end=Math.max(6,5+s.rows.length),summary=s.summaries||Object.keys(s.totals||{}).map(c=>({label:'Tổng cộng',column:Number(c),formula:'SUM'})),footerRows=[],merges=[`A2:${last}2`,`A3:${last}3`];
  const output=[`<row r="1" ht="10" customHeight="1"/>`,`<row r="2" ht="34" customHeight="1">${cell(s.title||s.name,'A2',roles.title)}</row>`,`<row r="3" ht="38" customHeight="1">${cell(s.subtitle||'Xuất ngày '+new Date().toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}),'A3',roles.subtitle)}</row>`,`<row r="4" ht="10" customHeight="1"/>`,`<row r="5" ht="44" customHeight="1">${s.headers.map((v,c)=>cell(v,col(c)+'5',roles.header)).join('')}</row>`];
  const rows=s.rows.length?s.rows:[['Chưa có bản ghi trong kỳ',...Array(n-1).fill(null)]];
  rows.forEach((r,j)=>{
   const row=6+j,alt=j%2?'Alt':'';
   const cells=s.headers.map((_,c)=>{
    const v=r[c],address=col(c)+row;
    const style=v instanceof Date?roles['date'+alt]:(s.moneyCells||[]).includes(address)||(typeof v==='number'&&(s.moneyColumns||[]).includes(c))?roles['money'+alt]:typeof v==='number'?roles[(Number.isInteger(v)?'number':'decimal')+alt]:roles['text'+alt];
    return cell(v,address,style);
   }).join('');
   const lines=Math.max(1,...r.map((v,c)=>Math.ceil((v instanceof Date?10:String(v??'').length)/Math.max(8,(s.widths?.[c]||24)-2))));
   output.push(`<row r="${row}" ht="${Math.max(32,Math.min(180,lines*17+12))}" customHeight="1">${cells}</row>`);
  });
  summary.forEach((sum,j)=>{
   const row=end+2+j,c=col(sum.column),numeric=s.rows.map(r=>Number(r[sum.column])||0);let formula,value;
   if(sum.formula==='SUMIF'){formula=`SUMIF(${col(sum.criteriaColumn)}6:${col(sum.criteriaColumn)}${end},"${sum.criteria}",${c}6:${c}${end})`;value=s.rows.reduce((total,r)=>total+(r[sum.criteriaColumn]===sum.criteria?(Number(r[sum.column])||0):0),0)}
   else if(sum.formula==='DIFFERENCE'){formula=`${c}${row-2}-${c}${row-1}`;value=footerRows[j-2].value-footerRows[j-1].value}
   else{formula=`SUM(${c}6:${c}${end})`;value=numeric.reduce((a,b)=>a+b,0)}
   footerRows.push({value});if(sum.column>1)merges.push(`A${row}:${col(sum.column-1)}${row}`);
   output.push(`<row r="${row}" ht="38" customHeight="1">${s.headers.map((_,k)=>cell(k===0?sum.label:k===sum.column?{formula,value}:null,col(k)+row,k===sum.column?((s.moneyColumns||[]).includes(k)?roles.totalMoney:roles.totalNumber):roles.totalText)).join('')}</row>`);
  });
  const maxRow=end+summary.length+2,frozen=s.freeze===false||s.name==='Tổng hợp'?'':`<pane ${n>5?'xSplit="2" ':''}ySplit="5" topLeftCell="${n>5?'C':'A'}6" activePane="${n>5?'bottomRight':'bottomLeft'}" state="frozen"/>`;
  const conditional=(s.statusColumns||[]).map((c,j)=>`<conditionalFormatting sqref="${col(c)}6:${col(c)}${end}">${[['Đã duyệt',0],['Đang nuôi',1],['Chờ duyệt',2],['Từ chối',3]].map(([label,dxf],k)=>`<cfRule type="containsText" dxfId="${dxf}" priority="${j*4+k+1}" operator="containsText" text="${label}"><formula>NOT(ISERROR(SEARCH("${label}",${col(c)}6)))</formula></cfRule>`).join('')}</conditionalFormatting>`).join('');
  files[`xl/worksheets/sheet${i+1}.xml`]='<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><tabColor rgb="FF14583B"/><pageSetUpPr fitToPage="1"/></sheetPr>'+`<dimension ref="A1:${last}${maxRow}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="100">${frozen}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="24"/><cols>`+s.headers.map((h,c)=>`<col min="${c+1}" max="${c+1}" width="${s.widths?.[c]||(/Ghi chú|Nội dung|Biện pháp|Tên/.test(h)?40:24)}" customWidth="1"/>`).join('')+'</cols><sheetData>'+output.join('')+`</sheetData><autoFilter ref="A5:${last}${end}"/><mergeCells count="${merges.length}">${merges.map(r=>`<mergeCell ref="${r}"/>`).join('')}</mergeCells>${conditional}<printOptions horizontalCentered="1"/><pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup paperSize="${n>9?8:9}" orientation="landscape" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>${xml('&L'+s.name+'&RTrang &P / &N')}</oddFooter></headerFooter></worksheet>`;
 });return zip(files);
}
export function downloadFile(bytes,filename,type){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
export {reportSheets} from './reports.mjs';
