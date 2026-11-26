'use client';
import React from 'react';
import {Badge,Button,dateLabel,fmt,money,statusLabels} from './components';
import {feedPer1000} from './catalog.mjs';
import {packKg,stockCount,stockUnit,supplyLabels} from './supplies.mjs';
import {workerDailyWage} from './finance.mjs';
import {flockSexLabel} from './flocks.mjs';

const definitions={
 inventory:{title:'Chi tiết vật tư',edit:'inventory',delete:'inventory.delete',label:r=>r.name,facts:r=>[
  ['Tên mặt hàng',r.name],['Nhóm kho',supplyLabels[r.type]||r.type],
  ['Tồn kho',r.type==='FEED'?`${fmt(stockCount(r),3)} bao · ${fmt(r.quantity,3)} kg`:`${fmt(stockCount(r),3)} ${stockUnit(r)}`],
  ['Ngưỡng cảnh báo',`${fmt(stockMinValue(r),3)} ${stockUnit(r)}`],
  ['Đơn giá tham khảo',r.type==='FEED'?`${money(r.unitPrice*packKg(r))} / bao`:`${money(r.unitPrice)} / ${r.unit}`],
  ['Tổng giá trị mặt hàng',money(r.quantity*r.unitPrice)],['Quy cách bao',r.type==='FEED'?`${fmt(packKg(r))} kg/bao`:'Không áp dụng']
 ]},
 finance:{title:'Chi tiết thu chi',edit:'finance',delete:'finance.delete',label:r=>r.category,facts:(r,data)=>[
  [r.source==='LABOR_MONTHLY'?'Tháng':'Ngày',r.source==='LABOR_MONTHLY'?`${r.month.slice(5)}/${r.month.slice(0,4)}`:dateLabel(r.date)],['Khoản mục',r.category],['Loại',r.type==='INCOME'?'Khoản thu':'Khoản chi'],['Số tiền',money(r.amount)],
  ['Đàn gà',r.source==='LABOR_MONTHLY'?'Các đàn được phân công':(()=>{const f=data.flocks.find(f=>f.id===r.flockId);return f?`${f.code} · ${flockSexLabel(f)}`:'Chi phí chung'})()],['Tổng lượng',Number(r.quantity)>0&&r.unit?`${fmt(r.quantity,3)} ${r.unit}`:'Không áp dụng'],['Nội dung',r.note||'Chưa ghi'],['Nguồn dữ liệu',r.source==='USAGE'?'Tổng hợp từ nhật ký':r.source==='RESTOCK'?'Tạo khi nhập kho':r.source==='LABOR_AUTO'?'Tự tính từ chấm công đã duyệt':r.source==='LABOR_MONTHLY'?'Cộng dồn từ chấm công đã duyệt theo tháng':r.source==='FLOCK_PURCHASE_AUTO'?'Tự tính từ số gà và giá giống':r.source==='FLOCK_PURCHASE_OVERRIDE'?'Số tiền con giống đã điều chỉnh':'Nhập thủ công']
 ]},
 attendance:{title:'Chi tiết chấm công',edit:'attendance',delete:'attendance.delete',label:r=>'chấm công '+dateLabel(r.date),facts:(r,data)=>[
  ['Ngày',dateLabel(r.date)],['Nhân viên',data.workers.find(w=>w.id===r.workerId)?.name||'Chưa xác định'],['Ngày công',statusLabels[r.shift]||r.shift],['Tiền công/ngày',money(r.dailyWage??workerDailyWage(data.workers.find(w=>w.id===r.workerId),r.date))],['Tiền công ngày này',money((r.shift==='FULL'?1:r.shift==='HALF'?.5:0)*(r.dailyWage??workerDailyWage(data.workers.find(w=>w.id===r.workerId),r.date)))],
  ['Trạng thái',statusLabels[r.status]||r.status],['Ghi chú',r.note||'Chưa ghi'],['Phản hồi',r.reviewNote||'Chưa có']
 ]},
 breed:{title:'Chi tiết giống gà',edit:'breed',delete:'breed.delete',label:r=>r.name,facts:r=>[
  ['Tên giống',r.name],['Cám gà trống / 1.000 con',`${fmt(feedPer1000(r,'MALE'),3)} kg`],['Cám gà mái / 1.000 con',`${fmt(feedPer1000(r,'FEMALE'),3)} kg`],['Ngày xuất dự kiến chung',`${fmt(r.harvestDays)} ngày`],['Mật độ',`${fmt(r.density,2)} con/m²`]
 ]},
 vaccineTemplate:{title:'Chi tiết mẫu lịch thú y',edit:'vaccineTemplate',delete:'vaccineTemplate.delete',label:r=>r.name,facts:r=>[
  ['Tên lịch',r.name],['Ngày tuổi',fmt(r.day)],['Ghi chú',r.note||'Chưa ghi']
 ]}
};

export const recordDetailTitle=detail=>definitions[detail?.kind]?.title||'Chi tiết bản ghi';

export function RecordDetails({detail,data,open,remove,owner,actor,close}){
 const config=definitions[detail.kind],r=detail.record;
 if(!config||!r)return <div className="modal-body">Không tìm thấy bản ghi.</div>;
 const editable=detail.kind==='attendance'?(owner||(r.workerId===actor?.workerId&&r.status==='PENDING')):owner;
 const purchaseFinance=detail.kind==='finance'&&['FLOCK_PURCHASE_AUTO','FLOCK_PURCHASE_OVERRIDE'].includes(r.source);
 const locked=detail.kind==='finance'&&Boolean(r.source)&&!purchaseFinance;
 const canDelete=!locked&&!(detail.kind==='finance'&&r.source==='FLOCK_PURCHASE_AUTO');
 const facts=config.facts(r,data);
 return <><div className="modal-body log-details"><div className="log-details-status">{r.status&&<Badge status={r.status}/>}</div><dl>{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value??'Chưa ghi'}</dd></div>)}</dl></div><div className="modal-footer record-detail-actions">{detail.kind==='inventory'&&<><Button icon="plus" variant="primary" onClick={()=>open('restock',r)}>Nhập kho</Button>{r.type!=='FEED'&&<Button icon="external" onClick={()=>open('issue',r)}>Xuất sử dụng</Button>}</>}{editable&&!locked&&<><Button icon="edit" onClick={()=>open(config.edit,r)}>Sửa</Button>{canDelete&&<Button icon="delete" variant="danger-outline" onClick={()=>remove(config.delete,r.id,config.label(r))}>{r.source==='FLOCK_PURCHASE_OVERRIDE'?'Dùng lại số tự tính':'Xóa'}</Button>}</>}<Button onClick={close}>Đóng</Button></div></>;
}

function stockMinValue(r){return r.type==='FEED'?Number(r.minQuantity||0)/packKg(r):Number(r.minQuantity||0)}
