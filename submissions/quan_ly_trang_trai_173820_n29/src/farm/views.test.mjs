import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createFarm,today} from './model.mjs';

// Compile the app's JSX for server-render checks without a browser dependency.
registerHooks({
 resolve(specifier,context,next){
  if(specifier.startsWith('.')&&context.parentURL?.includes('/farm/')){
   const url=new URL(specifier+'.jsx',context.parentURL);
   if(existsSync(url))return next(url.href,context);
  }
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.endsWith('.jsx'))return{format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};
  return next(url,context);
 }
});
const {Editor}=await import('./Editor.jsx');
const {LogsPage,SettingsPage,PlanningPage,InventoryPage}=await import('./Pages.jsx');
const {default:FinancePage}=await import('./FinancePage.jsx');
const {MapPage,StaffPage}=await import('./Enhanced.jsx');
const {RecordDetails}=await import('./RecordDetails.jsx');
const data=createFarm({sample:true}),owner={role:'FARM_OWNER',name:'Chủ trại'},noop=()=>{};
const props={data,owner:true,actor:owner,open:noop,remove:noop,run:noop,query:'',setQuery:noop,month:today().slice(0,7),setMonth:noop,exportReport:noop};
const render=(Component,p)=>renderToStaticMarkup(React.createElement(Component,p));

test('daily feeding form uses integer bags/litres and no course fields',()=>{
 const html=render(Editor,{...props,type:'feeding',row:{waterMode:'MEDICATED'},onSubmit:noop,onClose:noop});
 assert.match(html,/<input(?=[^>]*name="bags")(?=[^>]*min="1")(?=[^>]*step="1")[^>]*>/);
 assert.match(html,/<input(?=[^>]*name="water")(?=[^>]*min="1")(?=[^>]*step="1")[^>]*>/);
 assert.match(html,/name="dateEnd"/);assert.match(html,/Tổng 0 bao/);
 assert.doesNotMatch(html,/name="water(Course|Start|End)"/);
});

test('attendance form accepts a date range and displays the synchronized daily wage read-only',()=>{
 const attendanceData=structuredClone(data);attendanceData.workers[0].dailyWage=275000;
 attendanceData.attendance.push({id:'full-day',workerId:'w1',date:today(),shift:'FULL',dailyWage:275000,status:'APPROVED',note:''});
 const html=render(Editor,{...props,data:attendanceData,type:'attendance',row:{workerId:'w1'},onSubmit:noop,onClose:noop});
 assert.match(html,/Thông tin &amp; Khoảng ngày chấm công/);assert.match(html,/name="date"/);assert.match(html,/name="dateEnd"/);assert.doesNotMatch(html,/name="dailyWage"/);assert.match(html,/Tiền công mỗi ngày được đồng bộ theo tháng/);assert.match(html,/275\.000/);
 assert.match(html,/Lịch chấm công nhanh/);assert.match(html,/attendance-month-grid/);assert.match(html,/attendance-mark full">X/);assert.match(html,/Chọn hôm nay cho Từ ngày/);assert.match(html,/Chọn hôm nay cho Đến ngày/);
});

test('staff views show the monthly rate, approved days and monthly total',()=>{
 const staffData=structuredClone(data),worker=staffData.workers[0],month=today().slice(0,7);
 worker.dailyWage=275000;worker.monthlyWages={[month]:275000};
 staffData.attendance.push({id:'approved-work',workerId:worker.id,date:today(),shift:'FULL',dailyWage:275000,status:'APPROVED',note:''});
 const workerHtml=render(StaffPage,{...props,data:staffData,owner:false,actor:{role:'WORKER',workerId:worker.id},mode:'local'});
 assert.match(workerHtml,/Tiền công\/ngày tháng/);assert.match(workerHtml,/Ngày công đã duyệt tháng này/);assert.match(workerHtml,/Tổng tiền công tháng này/);assert.match(workerHtml,/275\.000/);
 const ownerHtml=render(StaffPage,{...props,data:staffData,owner:true,actor:owner,mode:'local'});
 assert.match(ownerHtml,/Tổng tiền công tháng/);assert.match(ownerHtml,/Tiền công mỗi ngày tháng/);
});

test('employee assignment cards show only flocks that are currently raising',()=>{
 const staffData=structuredClone(data),worker=staffData.workers[0],raising=staffData.flocks.find(f=>f.status==='RAISING');
 const exported={...raising,id:'old-exported-flock',code:'OLD_EXPORT',status:'EXPORTED',exportDate:today()};
 staffData.flocks.push(exported);worker.flockIds=[raising.id,exported.id];
 const ownerHtml=render(StaffPage,{...props,data:staffData,owner:true,actor:owner,mode:'local'});
 assert.match(ownerHtml,new RegExp(raising.code));assert.doesNotMatch(ownerHtml,/OLD_EXPORT/);
});

test('employee detail wage input uses the Field value callback and opens as an overlay',()=>{
 const source=readFileSync(new URL('./Enhanced.jsx',import.meta.url),'utf8'),css=readFileSync(new URL('./layout.css',import.meta.url),'utf8');
 assert.match(source,/onChange=\{\(_name,value\)=>setWageDrafts/);
 assert.match(css,/\.employee-detail\{position:fixed/);
 assert.match(source,/worker\.wage\.save/);
});

test('single-flock report renders whole-cycle totals without month/year controls',()=>{
 const html=render(FinancePage,{...props,flockId:'f1'});
 assert.match(html,/Toàn bộ thời gian của đàn/);
 assert.doesNotMatch(html,new RegExp('Tháng / năm báo cáo|type="month"|Tháng này'));
 assert.match(html,/Vật tư đã dùng/);
 assert.doesNotMatch(html,new RegExp('Dòng/trang'));
});

test('logs show owner treatment action and keep weighing out of the water column',()=>{
 const feed=render(LogsPage,{...props,kind:'feeding'});
 assert.match(feed,/Nước uống trong ngày/);assert.doesNotMatch(feed,/Cân mẫu/);
 const health=render(LogsPage,{...props,kind:'health'});
 assert.match(health,/Chưa ghi xử lý/);assert.match(health,/Xử lý ngay/);
 const worker=render(LogsPage,{...props,kind:'health',owner:false,actor:{role:'WORKER',workerId:'w1'}});
 assert.doesNotMatch(worker,/Xử lý ngay/);
});

test('settings, planning, map and treatment editor render with updated catalogue',()=>{
 const settings=render(SettingsPage,{...props,backup:noop,clear:noop,restore:noop});
 assert.match(settings,/Cám gà trống \/ 1.000 con/);assert.match(settings,/Cám gà mái \/ 1.000 con/);assert.match(settings,/Ngày nuôi dự kiến chung/);
 assert.doesNotMatch(settings,/Dùng thử toàn bộ dữ liệu mẫu/);
 const planning=render(PlanningPage,{data});assert.match(planning,/Cám dự kiến cả lứa/);assert.doesNotMatch(planning,new RegExp('kg/ngày'));
 assert.match(render(MapPage,props),/Ghim thêm chuồng/);
 assert.match(render(Editor,{...props,type:'treatment',row:data.health[0],onSubmit:noop,onClose:noop}),/name="treatment"/);
});

test('edit and delete actions live inside record details',()=>{
 const logs=render(LogsPage,{...props,kind:'feeding'});
 assert.match(logs,/>Chi tiết</);assert.doesNotMatch(logs,/>Sửa</);assert.doesNotMatch(logs,/>Xóa</);
 const detail=render(RecordDetails,{detail:{kind:'inventory',record:data.inventory[0]},data,owner:true,actor:owner,open:noop,remove:noop,close:noop});
 assert.match(detail,/>Sửa</);assert.match(detail,/>Xóa</);
});

test('login offers protected sample-data editing',()=>{
 const source=readFileSync(new URL('./FarmApp.jsx',import.meta.url),'utf8');
 assert.match(source,/Chỉnh sửa dữ liệu mẫu/);
 assert.match(source,/farm29/);
 assert.match(source,/sample-login/);
});

test('map, inventory and flock cost summaries show the requested totals',()=>{
 const mapped=structuredClone(data);mapped.barns[0].mapX=40;mapped.barns[0].mapY=45;mapped.barns[0].mapOrientation='VERTICAL';mapped.barns[5].mapX=60;mapped.barns[5].mapY=65;
 const map=render(MapPage,{...props,data:mapped});
 assert.match(map,/map-workspace-direct/);assert.match(map,/barn-pin-wrap/);assert.match(map,/barn-pin occupied sex-male pin-vertical/);assert.match(map,/barn-pin empty sex-empty pin-horizontal/);assert.match(map,/Gà trống/);assert.match(map,/Gà mái/);assert.doesNotMatch(map,/Ghim vị trí chuồng/);assert.doesNotMatch(map,/Đổi vị trí/);assert.doesNotMatch(map,/Đàn gà Ri tháng 9/);assert.doesNotMatch(map,/<span class="barn-pin-copy"><strong>Chuồng trống/);assert.doesNotMatch(map,/>Chuồng A1<\/strong>/);assert.match(map,/>A1<\/strong>/);assert.match(map,/>2\.480<\/small>/);assert.doesNotMatch(map,/2\.480 con/);assert.match(map,/Xoay ngang/);assert.match(map,/Xoay dọc/);assert.match(map,/Bỏ ghim Chuồng A1/);
 const inventory=render(InventoryPage,props);
 assert.match(inventory,/Tổng giá trị cám/);assert.match(inventory,/Tổng giá trị thuốc &amp; vắc xin/);assert.match(inventory,/Tổng giá trị dụng cụ &amp; thiết bị/);
 const detail=render(RecordDetails,{detail:{kind:'inventory',record:data.inventory[0]},data,owner:true,actor:owner,open:noop,remove:noop,close:noop});
 assert.match(detail,/Tổng giá trị mặt hàng/);
 const flock=render(Editor,{...props,type:'flock',row:{},onSubmit:noop,onClose:noop});
 assert.match(flock,/Chi phí con giống tự động/);assert.match(flock,/name="sex"/);assert.match(flock,/Gà trống/);assert.match(flock,/Gà mái/);assert.match(flock,/ĐANG CÓ GÀ/);
 const worker=render(Editor,{...props,type:'worker',row:{},onSubmit:noop,onClose:noop});assert.match(worker,/Tiền công mặc định mỗi ngày/);assert.match(worker,/Phân công đàn gà \/ chuồng nuôi/);
});
