import {env} from 'cloudflare:workers';
import {logoutWorker,cookie} from '../../../server/worker-auth.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{await readBody(request);await logoutWorker(env.DB,request);return Response.json({message:'Đã đăng xuất.'},{headers:{...noStore,'Set-Cookie':cookie('',!import.meta.env.DEV)}})}catch(e){return responseError(e)}}
