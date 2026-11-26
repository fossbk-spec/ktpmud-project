import {env} from 'cloudflare:workers';
import {identity} from '../state/route';
import {loadFarm} from '../../../farm/service.mjs';
import {FarmError} from '../../../farm/model.mjs';
import {saveStaff} from '../../../farm/staff-service.mjs';
import {hashPassword} from '../../../server/worker-auth.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{const body=await readBody(request),actor=await identity(request);if(actor?.role!=='FARM_OWNER')throw new FarmError('Chỉ chủ trang trại cấp tài khoản.',403);const state=await loadFarm(env.DB,actor.farmId),worker=state.data.workers.find((w:any)=>w.id===body.workerId);if(!worker)throw new FarmError('Không tìm thấy nhân viên.',404);return Response.json(await saveStaff(env.DB,actor.farmId,{revision:state.revision,worker:{...worker,password:body.password}},actor,hashPassword),{headers:noStore})}catch(e){return responseError(e)}}
