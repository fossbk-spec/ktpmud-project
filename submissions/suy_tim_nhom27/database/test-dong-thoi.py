"""Chạy riêng trên CSDL thử đã tạo schema. Không dùng với CSDL thật."""
import os, subprocess, threading, time

psql=os.environ.get('PSQL','psql')
base=[psql,'-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p',os.environ.get('PGPORT','55439'),'-U','schema_test','-d',os.environ.get('PGDATABASE','schema_53_v4')]
def run(sql):
    return subprocess.run(base+['-c',sql],capture_output=True,text=True,encoding='utf-8',errors='replace')
setup=run("INSERT INTO app_user(login_name,password_hash) VALUES ('concurrent_test','test'); INSERT INTO patient(patient_code,full_name,created_by) SELECT 'BN-90001','Gia lap',id FROM app_user WHERE login_name='concurrent_test'; INSERT INTO clinic_slot(starts_at,ends_at,capacity) VALUES ('2090-01-01','2090-01-02',1); INSERT INTO form_template(code,name) VALUES ('CONCURRENT','Test');")
if setup.returncode: raise SystemExit(setup.stderr)
p1="BEGIN; INSERT INTO appointment(patient_id,slot_id,status) SELECT p.id,s.id,'booked' FROM patient p,clinic_slot s WHERE p.patient_code='BN-90001' AND s.starts_at='2090-01-01'; SELECT pg_sleep(2); COMMIT;"
p2="INSERT INTO appointment(patient_id,slot_id,status) SELECT p.id,s.id,'booked' FROM patient p,clinic_slot s WHERE p.patient_code='BN-90001' AND s.starts_at='2090-01-01';"
v1="BEGIN; INSERT INTO form_version(template_id,version_no,status) SELECT id,100,'draft' FROM form_template WHERE code='CONCURRENT'; SELECT pg_sleep(2); COMMIT;"
v2="INSERT INTO form_version(template_id,version_no,status) SELECT id,100,'draft' FROM form_template WHERE code='CONCURRENT';"
for name,a,b in [('appointment',p1,p2),('form_version',v1,v2)]:
    result={}
    thread=threading.Thread(target=lambda:result.update(first=run(a)))
    thread.start(); time.sleep(.5); second=run(b);thread.join()
    print(name,'first=',result['first'].returncode,'second=',second.returncode)
    if result['first'].returncode!=0 or second.returncode==0: raise SystemExit('Concurrent invariant failed: '+second.stderr)
    print('expected rejection:',second.stderr.splitlines()[0] if second.stderr else '(no message)')
print('Concurrent checks passed')
