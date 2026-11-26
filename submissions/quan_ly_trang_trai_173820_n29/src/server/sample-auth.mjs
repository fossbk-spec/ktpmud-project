import {digest} from './worker-auth.mjs';

export const SAMPLE_FARM_ID='system:sample-template';
export const sampleCookie=(token,secure=true)=>`sample_editor_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?86400:0}${secure?'; Secure':''}`;
export const sampleToken=async code=>digest('haha-sample-editor|'+code);
export function requestSampleToken(request){
 return(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('sample_editor_session='))?.slice(22)||'';
}
export async function canEditSample(request,code='farm29'){
 return requestSampleToken(request)===await sampleToken(code);
}
