import {env} from 'cloudflare:workers';
import {loadFarm} from '../../../farm/service.mjs';
import {visibleData,FarmError} from '../../../farm/model.mjs';
import {accountState} from '../../../farm/staff-service.mjs';
import {accessCode} from '../../../server/worker-auth.mjs';
import {resolveFarmIdentity} from '../../../server/farm-auth.mjs';
export const dynamic='force-dynamic';
export async function identity(request:Request){
 return resolveFarmIdentity(env.DB,request);
}
export async function GET(request:Request){
 try{
  const db=env.DB;if(!db)throw new FarmError('Chưa cấu hình cơ sở dữ liệu trang trại.',503);
  const actor=await identity(request);if(!actor)throw new FarmError('Vui lòng đăng nhập bằng tài khoản trang trại.',401);
  let state=await loadFarm(db,actor.farmId,{create:actor.role==='FARM_OWNER'?{sample:false}:undefined});
  if(actor.role==='FARM_OWNER'){
   const code=await accessCode(db,actor.farmId);
   if(state.data.settings.farmCode!==code){const payload=JSON.stringify({...state.data,settings:{...state.data.settings,farmCode:code}});await db.prepare('UPDATE farm_documents SET payload=?,revision=revision+1,updated_at=? WHERE farm_id=? AND revision=?').bind(payload,new Date().toISOString(),actor.farmId,state.revision).run();state=await loadFarm(db,actor.farmId)}
  }
  return Response.json(await accountState(env.DB,actor.farmId,{...state,data:visibleData(state.data,actor),actor,mode:'hosted'},actor),{headers:{'Cache-Control':'no-store'}});
 }catch(e:any){const status=e.status||500;return Response.json({message:status<500?e.message:'Chưa tải được dữ liệu. Hãy thử lại.',mode:'hosted'},{status,headers:{'Cache-Control':'no-store'}})}
}
