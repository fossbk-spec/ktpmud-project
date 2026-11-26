import {sampleCookie} from '../../../server/sample-auth.mjs';
import {noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(){return Response.json({message:'Đã thoát chỉnh sửa dữ liệu mẫu.'},{headers:{...noStore,'Set-Cookie':sampleCookie('',!import.meta.env.DEV)}})}
