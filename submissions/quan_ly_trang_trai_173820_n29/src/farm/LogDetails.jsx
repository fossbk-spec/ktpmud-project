'use client';
import React from 'react';
import {Badge,Button,dateLabel,fmt} from './components';

export function LogDetails({row:r,data,owner,actor,open,remove,close}){
 const feed=r.kind==='feeding',flock=data.flocks.find(f=>f.id===r.flockId),item=id=>data.inventory.find(i=>i.id===id)?.name||'Chưa ghi';
 const facts=[['Ngày ghi nhận',dateLabel(r.date)],['Người ghi',r.createdBy],['Đàn gà',flock?`${flock.code} · ${flock.name}`:'Chưa xác định']];
 if(feed){facts.push(['Loại cám',item(r.itemId)],['Cám đã sử dụng',r.bagKg?`${fmt(r.amount/r.bagKg,3)} bao × ${r.bagKg} kg/bao = ${fmt(r.amount,3)} kg`:`${fmt(r.amount,3)} kg (bản cũ)`],['Cân mẫu',r.weight?fmt(r.weight,3)+' kg/con':'Chưa cân mẫu'],['Nước uống',r.waterMode==='MEDICATED'?fmt(r.water,3)+' lít nước thuốc':r.waterMode==='CLEAN'||!r.water?'Nước sạch tự động, không ghi số lít':fmt(r.water,3)+' lít (bản cũ)']);if(r.waterMode==='MEDICATED')facts.push(['Ngày pha nước thuốc',dateLabel(r.date)],['Thuốc / Vắc xin pha nước',`${item(r.medicineId)} · ${fmt(r.medicineAmount,3)} ${r.medicineUnit}`]);}
 else{facts.push(['Tình trạng',r.condition],['Gà ốm',fmt(r.sick)+' con'],['Hao hụt',fmt(r.dead)+' con'],['Bệnh / Chẩn đoán',r.disease||'Chưa ghi'],['Biện pháp đã thực hiện',r.treatment||'Chưa ghi']);if(r.supplyId)facts.push(['Thuốc / Vắc xin đã dùng',`${item(r.supplyId)} · ${fmt(r.supplyAmount,3)} ${r.supplyUnit}`]);}
 const canChange=(owner||(r.workerId===actor?.workerId&&r.status==='PENDING'))&&flock?.status==='RAISING';
 return <><div className="modal-body log-details"><div className="log-details-status"><Badge status={r.status}/>{r.reviewedBy&&<span>Người duyệt: {r.reviewedBy}</span>}</div><dl>{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Chưa ghi'}</dd></div>)}</dl><section><h3>Ghi chú</h3><p>{r.note||'Không có ghi chú.'}</p>{r.reviewNote&&<><h3>Phản hồi phê duyệt</h3><p>{r.reviewNote}</p></>}</section></div><div className="modal-footer record-detail-actions">{canChange&&<><Button icon="edit" onClick={()=>open(r.kind,r)}>Sửa</Button><Button icon="delete" variant="danger-outline" onClick={()=>remove(r.kind+'.delete',r.id,'nhật ký '+dateLabel(r.date))}>Xóa</Button></>}<Button onClick={close}>Đóng</Button></div></>;
}
