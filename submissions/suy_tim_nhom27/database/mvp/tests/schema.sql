\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE u bigint; p bigint; t bigint; v bigint; s bigint; f bigint; e bigint; o bigint; rejected boolean;
BEGIN
 INSERT INTO app_user(login_name,password_hash) VALUES('bacsi_test','test-hash') RETURNING id INTO u;
 INSERT INTO patient(patient_code,full_name,created_by) VALUES('BN-00001','Nguoi benh gia lap',u) RETURNING id INTO p;
 INSERT INTO form_template(code,name) VALUES('ST','Suy tim') RETURNING id INTO t;
 INSERT INTO form_version(template_id,version_no,status) VALUES(t,1,'draft') RETURNING id INTO v;
 INSERT INTO form_section(version_id,code,label,sort_order) VALUES(v,'chung','Thong tin chung',1) RETURNING id INTO s;
 INSERT INTO form_field(section_id,code,label,value_kind,sort_order) VALUES(s,'ef','EF','number',1) RETURNING id INTO f;
 UPDATE form_version SET status='published' WHERE id=v;
 INSERT INTO encounter(patient_id,form_version_id,encounter_code,status,created_by) VALUES(p,v,'LK-TEST','draft',u) RETURNING id INTO e;
 INSERT INTO observation(encounter_id,field_id) VALUES(e,f) RETURNING id INTO o;
 INSERT INTO observation_version(observation_id,version_no,value_status,recorded_by) VALUES(o,1,'unknown',u);
 INSERT INTO observation_version(observation_id,version_no,value_status,value_number,recorded_by) VALUES(o,2,'known',0,u);
 rejected:=false; BEGIN INSERT INTO patient(patient_code,full_name,created_by) VALUES('BN-00001','Trung',u); EXCEPTION WHEN unique_violation THEN rejected:=true; END; IF NOT rejected THEN RAISE EXCEPTION 'duplicate patient code accepted'; END IF;
 rejected:=false; BEGIN INSERT INTO form_version(template_id,version_no,status) VALUES(t,0,'draft'); EXCEPTION WHEN check_violation THEN rejected:=true; END; IF NOT rejected THEN RAISE EXCEPTION 'invalid version accepted'; END IF;
 rejected:=false; BEGIN INSERT INTO encounter(patient_id,form_version_id,encounter_code,status,created_by) VALUES(999999999,v,'INVALID','draft',u); EXCEPTION WHEN foreign_key_violation THEN rejected:=true; END; IF NOT rejected THEN RAISE EXCEPTION 'invalid patient FK accepted'; END IF;
 rejected:=false; BEGIN INSERT INTO observation_version(observation_id,version_no,value_status,value_text,value_number,recorded_by) VALUES(o,3,'known','x',5,u); EXCEPTION WHEN check_violation THEN rejected:=true; END; IF NOT rejected THEN RAISE EXCEPTION 'two values accepted'; END IF;
 RAISE NOTICE 'All checks passed';
END $$;
ROLLBACK;
