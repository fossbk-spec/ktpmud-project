import {env} from 'cloudflare:workers';
import {identity} from '../state/route';
import {updateFarm} from '../../../farm/service.mjs';
import {FarmError} from '../../../farm/model.mjs';
import {accountState} from '../../../farm/staff-service.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const db=env.DB;if(!db)throw new FarmError('Chưa cấu hình cơ sở dữ liệu trang trại.',503);
 const body=await readBody(request),actor=await identity(request);if(!actor)throw new FarmError('Vui lòng đăng nhập.',401);
 const result=await updateFarm(db,actor.farmId,body,actor);
 if(actor.role==='FARM_OWNER'&&(body.action?.type==='worker.archive'||(body.action?.type==='worker.save'&&body.action?.payload?.active===false))){const user=await db.prepare('SELECT id FROM auth_users WHERE farm_id=? AND worker_id=?').bind(actor.farmId,body.action.payload.id).first();if(user)await db.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(user.id).run()}
 return Response.json(await accountState(env.DB,actor.farmId,result,actor),{headers:noStore});
}catch(e){return responseError(e)}}
