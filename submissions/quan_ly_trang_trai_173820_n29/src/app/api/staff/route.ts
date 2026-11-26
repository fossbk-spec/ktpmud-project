import {env} from 'cloudflare:workers';
import {identity} from '../state/route';
import {FarmError} from '../../../farm/model.mjs';
import {saveStaff} from '../../../farm/staff-service.mjs';
import {hashPassword} from '../../../server/worker-auth.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{const body=await readBody(request),actor=await identity(request);if(!actor)throw new FarmError('Vui lòng đăng nhập.',401);return Response.json(await saveStaff(env.DB,actor.farmId,body,actor,hashPassword),{headers:noStore})}catch(e){return responseError(e)}}
