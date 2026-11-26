import {env} from 'cloudflare:workers';
import {identity} from '../state/route';
import {changeWorkerPassword,cookie} from '../../../server/worker-auth.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{const body=await readBody(request),actor=await identity(request);const token=await changeWorkerPassword(env.DB,actor,body);return Response.json({message:'Đã đổi mật khẩu và kết thúc các phiên cũ.'},{headers:{...noStore,'Set-Cookie':cookie(token,!import.meta.env.DEV)}})}catch(e){return responseError(e)}}
