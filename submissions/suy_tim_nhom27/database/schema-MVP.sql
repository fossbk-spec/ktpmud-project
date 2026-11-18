-- Thiết kế MVP đề xuất. Chạy trên cơ sở dữ liệu PostgreSQL trống.
-- Chưa phải migration cho cơ sở dữ liệu demo hiện có.
BEGIN;
CREATE TABLE app_user (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, login_name text NOT NULL UNIQUE, password_hash text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app_role (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL);
CREATE TABLE user_role (user_id bigint NOT NULL REFERENCES app_user(id), role_id bigint NOT NULL REFERENCES app_role(id), PRIMARY KEY(user_id,role_id));
CREATE TABLE permission (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code text NOT NULL UNIQUE, description text NOT NULL);
CREATE TABLE role_permission (role_id bigint NOT NULL REFERENCES app_role(id), permission_id bigint NOT NULL REFERENCES permission(id), PRIMARY KEY(role_id,permission_id));
CREATE TABLE patient (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, patient_code text NOT NULL UNIQUE CHECK(patient_code ~ '^BN-[0-9]{5}$'), full_name text NOT NULL, birth_date date, birth_year smallint CHECK (birth_year BETWEEN 1850 AND 2100), sex text, insurance_no text, created_at timestamptz NOT NULL DEFAULT now(), created_by bigint NOT NULL REFERENCES app_user(id), CHECK (birth_date IS NULL OR birth_year IS NULL));
CREATE TABLE patient_identifier (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, patient_id bigint NOT NULL REFERENCES patient(id), issuer_scope text NOT NULL, identifier_type text NOT NULL, raw_value text NOT NULL, verification_status text NOT NULL CHECK(verification_status IN ('pending','verified','rejected')), UNIQUE(issuer_scope,identifier_type,raw_value));
CREATE TABLE form_template (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL);
CREATE TABLE form_version (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, template_id bigint NOT NULL REFERENCES form_template(id), version_no integer NOT NULL CHECK (version_no > 0), status text NOT NULL CHECK (status IN ('draft','published','retired')), published_at timestamptz, UNIQUE(template_id,version_no));
CREATE TABLE form_section (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, version_id bigint NOT NULL REFERENCES form_version(id), code text NOT NULL, label text NOT NULL, sort_order integer NOT NULL CHECK(sort_order >= 0), UNIQUE(version_id,code));
CREATE TABLE form_field (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, section_id bigint NOT NULL REFERENCES form_section(id), code text NOT NULL, label text NOT NULL, value_kind text NOT NULL CHECK(value_kind IN ('text','number','date','boolean','choice')), unit text, required boolean NOT NULL DEFAULT false, source_reference text, validation_note text, sort_order integer NOT NULL CHECK(sort_order >= 0), UNIQUE(section_id,code));
CREATE TABLE field_option (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, field_id bigint NOT NULL REFERENCES form_field(id), code text NOT NULL, label text NOT NULL, UNIQUE(field_id,code));
CREATE TABLE encounter (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, patient_id bigint NOT NULL REFERENCES patient(id), form_version_id bigint NOT NULL REFERENCES form_version(id), encounter_code text NOT NULL UNIQUE, occurred_at timestamptz, status text NOT NULL CHECK(status IN ('draft','in_progress','completed')), created_by bigint NOT NULL REFERENCES app_user(id), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE encounter_identifier (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, encounter_id bigint NOT NULL REFERENCES encounter(id), issuer_scope text NOT NULL, identifier_type text NOT NULL, raw_value text NOT NULL, verification_status text NOT NULL CHECK(verification_status IN ('pending','verified','rejected')), UNIQUE(issuer_scope,identifier_type,raw_value));
CREATE TABLE medication_entry (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, encounter_id bigint NOT NULL REFERENCES encounter(id), medication_name text NOT NULL, dose_number numeric CHECK(dose_number >= 0), dose_unit text, dose_text text, ingredient text, strength text, route text, frequency text, started_on date, ended_on date, medication_status text CHECK(medication_status IN ('current','planned','stopped')), medication_category text CHECK(medication_category IN ('prescription','otc','supplement','traditional')), source_note text, observed_at timestamptz, recorded_by bigint NOT NULL REFERENCES app_user(id), recorded_at timestamptz NOT NULL DEFAULT now(), CHECK(started_on IS NULL OR ended_on IS NULL OR ended_on >= started_on), CHECK(dose_number IS NULL OR dose_unit IS NOT NULL));
CREATE TABLE observation (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, encounter_id bigint NOT NULL REFERENCES encounter(id), field_id bigint NOT NULL REFERENCES form_field(id), event_key text NOT NULL DEFAULT 'default', UNIQUE(encounter_id,field_id,event_key));
CREATE TABLE observation_version (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, observation_id bigint NOT NULL REFERENCES observation(id), version_no integer NOT NULL CHECK(version_no > 0), value_status text NOT NULL CHECK(value_status IN ('known','unknown','not_applicable')), value_text text, value_number numeric, value_date date, value_boolean boolean, value_code text, unit text, observed_at timestamptz, reported_name text, source_note text, recorded_by bigint NOT NULL REFERENCES app_user(id), recorded_at timestamptz NOT NULL DEFAULT now(), UNIQUE(observation_id,version_no), CHECK ((value_status = 'known' AND num_nonnulls(value_text,value_number,value_date,value_boolean,value_code) = 1) OR (value_status <> 'known' AND num_nonnulls(value_text,value_number,value_date,value_boolean,value_code) = 0)));
CREATE TABLE mapping_profile (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL, version_no integer NOT NULL CHECK(version_no > 0), form_version_id bigint NOT NULL REFERENCES form_version(id), UNIQUE(name,version_no));
CREATE TABLE mapping_rule (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id bigint NOT NULL REFERENCES mapping_profile(id), source_column text NOT NULL, field_id bigint NOT NULL REFERENCES form_field(id), UNIQUE(profile_id,source_column));
CREATE TABLE import_batch (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, source_name text NOT NULL, file_ref text, mapping_profile_id bigint REFERENCES mapping_profile(id), zero_requires_review boolean NOT NULL DEFAULT true, status text NOT NULL CHECK(status IN ('received','review','applied','failed')), uploaded_by bigint NOT NULL REFERENCES app_user(id), uploaded_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE import_item (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, batch_id bigint NOT NULL REFERENCES import_batch(id), source_location text NOT NULL, mapping_rule_id bigint REFERENCES mapping_rule(id), raw_value text, encounter_id bigint REFERENCES encounter(id), status text NOT NULL CHECK(status IN ('pending','valid','review','applied','error')), message text, UNIQUE(batch_id,source_location), CHECK(status NOT IN ('valid','applied') OR (mapping_rule_id IS NOT NULL AND encounter_id IS NOT NULL)));
CREATE TABLE import_application (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, import_item_id bigint NOT NULL REFERENCES import_item(id), observation_version_id bigint NOT NULL REFERENCES observation_version(id), applied_by bigint NOT NULL REFERENCES app_user(id), applied_at timestamptz NOT NULL DEFAULT now(), UNIQUE(import_item_id,observation_version_id));
CREATE TABLE clinic_slot (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, capacity integer NOT NULL CHECK(capacity > 0), CHECK(ends_at > starts_at));
CREATE TABLE appointment (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, patient_id bigint NOT NULL REFERENCES patient(id), slot_id bigint NOT NULL REFERENCES clinic_slot(id), status text NOT NULL CHECK(status IN ('booked','cancelled','completed')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_event (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id bigint REFERENCES app_user(id), action text NOT NULL, target_type text NOT NULL, target_id bigint, occurred_at timestamptz NOT NULL DEFAULT now(), result text NOT NULL);
CREATE INDEX ix_encounter_patient_time ON encounter(patient_id,occurred_at);
CREATE INDEX ix_observation_encounter ON observation(encounter_id);
CREATE INDEX ix_import_item_batch_status ON import_item(batch_id,status);
CREATE INDEX ix_appointment_patient ON appointment(patient_id);
CREATE INDEX ix_medication_encounter ON medication_entry(encounter_id);
CREATE INDEX ix_audit_actor_time ON audit_event(actor_id,occurred_at);

CREATE FUNCTION enforce_mapping_field_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE profile_version bigint; field_version bigint;
BEGIN
 SELECT form_version_id INTO profile_version FROM mapping_profile WHERE id=NEW.profile_id;
 SELECT s.version_id INTO field_version FROM form_field f JOIN form_section s ON s.id=f.section_id WHERE f.id=NEW.field_id;
 IF profile_version IS DISTINCT FROM field_version THEN RAISE EXCEPTION 'Trường ánh xạ không thuộc phiên bản mẫu của cấu hình' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER mapping_field_version BEFORE INSERT OR UPDATE ON mapping_rule FOR EACH ROW EXECUTE FUNCTION enforce_mapping_field_version();

CREATE FUNCTION protect_mapping_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.form_version_id IS DISTINCT FROM OLD.form_version_id AND EXISTS (SELECT 1 FROM mapping_rule WHERE profile_id=OLD.id) THEN
   RAISE EXCEPTION 'Không đổi phiên bản mẫu của cấu hình đã có quy tắc' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER mapping_profile_version_locked BEFORE UPDATE OF form_version_id ON mapping_profile FOR EACH ROW EXECUTE FUNCTION protect_mapping_version();

-- Xác minh phiên bản trường phù hợp với phiên bản mẫu của lượt khám.
CREATE FUNCTION enforce_observation_field_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE encounter_version bigint; field_version bigint;
BEGIN
 SELECT form_version_id INTO encounter_version FROM encounter WHERE id=NEW.encounter_id FOR UPDATE;
 SELECT s.version_id INTO field_version FROM form_field f JOIN form_section s ON s.id=f.section_id WHERE f.id=NEW.field_id;
 IF encounter_version IS DISTINCT FROM field_version THEN
   RAISE EXCEPTION 'Trường không thuộc phiên bản mẫu của lượt khám' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER observation_field_version BEFORE INSERT OR UPDATE OF encounter_id,field_id ON observation FOR EACH ROW EXECUTE FUNCTION enforce_observation_field_version();

CREATE FUNCTION protect_encounter_form() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE form_status text;
BEGIN
 SELECT status INTO form_status FROM form_version WHERE id=NEW.form_version_id FOR UPDATE;
 IF form_status IS DISTINCT FROM 'published' THEN RAISE EXCEPTION 'Lượt khám phải dùng mẫu đã phát hành' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.form_version_id IS DISTINCT FROM OLD.form_version_id OR NEW.patient_id IS DISTINCT FROM OLD.patient_id) AND EXISTS (SELECT 1 FROM observation WHERE encounter_id=OLD.id) THEN
   RAISE EXCEPTION 'Không đổi người bệnh hoặc mẫu của lượt đã có dữ liệu' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER encounter_form_valid BEFORE INSERT OR UPDATE OF form_version_id,patient_id ON encounter FOR EACH ROW EXECUTE FUNCTION protect_encounter_form();

CREATE FUNCTION protect_observation_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM observation_version WHERE observation_id=OLD.id) THEN
   RAISE EXCEPTION 'Bản ghi đã có phiên bản giá trị; không thay đổi định danh' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER observation_identity_locked BEFORE UPDATE OR DELETE ON observation FOR EACH ROW EXECUTE FUNCTION protect_observation_history();

-- Mỗi phiên bản giá trị phải phù hợp với kiểu trường và danh mục lựa chọn.
CREATE FUNCTION enforce_observation_value() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE kind text; fid bigint;
BEGIN
 SELECT f.value_kind,f.id INTO kind,fid FROM observation o JOIN form_field f ON f.id=o.field_id WHERE o.id=NEW.observation_id;
 IF NEW.value_status='known' AND NOT (
   (kind='number' AND NEW.value_number IS NOT NULL) OR
   (kind='text' AND NEW.value_text IS NOT NULL) OR
   (kind='date' AND NEW.value_date IS NOT NULL) OR
   (kind='boolean' AND NEW.value_boolean IS NOT NULL) OR
   (kind='choice' AND NEW.value_code IS NOT NULL AND EXISTS
     (SELECT 1 FROM field_option WHERE field_id=fid AND code=NEW.value_code))
 ) THEN RAISE EXCEPTION 'Giá trị hoặc lựa chọn không phù hợp với trường' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER observation_value_valid BEFORE INSERT OR UPDATE ON observation_version FOR EACH ROW EXECUTE FUNCTION enforce_observation_value();

CREATE FUNCTION prevent_value_rewrite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'Không sửa hoặc xóa phiên bản đã ghi; tạo phiên bản mới' USING ERRCODE='23514';
END $$;
CREATE TRIGGER observation_version_immutable BEFORE UPDATE OR DELETE ON observation_version FOR EACH ROW EXECUTE FUNCTION prevent_value_rewrite();

-- Nguồn và giá trị được ghi phải cùng lượt khám và trường đích.
CREATE FUNCTION enforce_import_application() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i_enc bigint; i_field bigint; o_enc bigint; o_field bigint; item_status text;
BEGIN
 SELECT i.encounter_id,m.field_id,i.status INTO i_enc,i_field,item_status FROM import_item i LEFT JOIN mapping_rule m ON m.id=i.mapping_rule_id WHERE i.id=NEW.import_item_id FOR UPDATE OF i;
 SELECT o.encounter_id,o.field_id INTO o_enc,o_field FROM observation_version ov JOIN observation o ON o.id=ov.observation_id WHERE ov.id=NEW.observation_version_id;
 IF i_enc IS NULL OR i_field IS NULL OR i_enc IS DISTINCT FROM o_enc OR i_field IS DISTINCT FROM o_field OR item_status NOT IN ('valid','applied') THEN
   RAISE EXCEPTION 'Dữ liệu nguồn chưa hợp lệ hoặc không khớp lượt khám và trường' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER import_application_match BEFORE INSERT OR UPDATE ON import_application FOR EACH ROW EXECUTE FUNCTION enforce_import_application();

CREATE FUNCTION enforce_source_zero_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE review_zero boolean;
BEGIN
 SELECT zero_requires_review INTO review_zero FROM import_batch WHERE id=NEW.batch_id;
 IF review_zero AND NEW.raw_value IS NOT NULL AND btrim(NEW.raw_value) ~ '^[+-]?0+([.,]0+)?$' AND NEW.status IN ('valid','applied') THEN
   RAISE EXCEPTION 'Giá trị 0 từ file phải chờ bác sĩ kiểm tra và nhập lại' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER import_zero_review BEFORE INSERT OR UPDATE ON import_item FOR EACH ROW EXECUTE FUNCTION enforce_source_zero_review();

CREATE FUNCTION enforce_import_mapping() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE batch_profile bigint; rule_profile bigint; rule_field bigint; rule_column text; encounter_version bigint; field_version bigint;
BEGIN
 IF NEW.status NOT IN ('valid','applied') THEN RETURN NEW; END IF;
 SELECT mapping_profile_id INTO batch_profile FROM import_batch WHERE id=NEW.batch_id FOR SHARE;
 SELECT profile_id,field_id,source_column INTO rule_profile,rule_field,rule_column FROM mapping_rule WHERE id=NEW.mapping_rule_id FOR SHARE;
 SELECT form_version_id INTO encounter_version FROM encounter WHERE id=NEW.encounter_id FOR SHARE;
 SELECT s.version_id INTO field_version FROM form_field f JOIN form_section s ON s.id=f.section_id WHERE f.id=rule_field;
 IF batch_profile IS NULL OR batch_profile IS DISTINCT FROM rule_profile OR encounter_version IS DISTINCT FROM field_version THEN
   RAISE EXCEPTION 'Cột nguồn, cấu hình, trường đích hoặc lượt khám không khớp' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER import_mapping_valid BEFORE INSERT OR UPDATE ON import_item FOR EACH ROW EXECUTE FUNCTION enforce_import_mapping();

CREATE FUNCTION protect_applied_import() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM import_application WHERE import_item_id=OLD.id) THEN
   RAISE EXCEPTION 'Không thay đổi phần nguồn đã ghi; tạo lần nhập mới' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER import_item_locked BEFORE UPDATE OR DELETE ON import_item FOR EACH ROW EXECUTE FUNCTION protect_applied_import();

-- Khóa hàng phiên bản để không thể thay đổi cấu trúc mẫu đã phát hành/sử dụng.
CREATE FUNCTION protect_form_definition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vid bigint; current_status text;
BEGIN
 IF TG_TABLE_NAME='form_section' THEN vid=CASE WHEN TG_OP='INSERT' THEN NEW.version_id ELSE OLD.version_id END;
 ELSIF TG_TABLE_NAME='form_field' THEN
   SELECT version_id INTO vid FROM form_section WHERE id=CASE WHEN TG_OP='INSERT' THEN NEW.section_id ELSE OLD.section_id END;
 ELSE
   SELECT s.version_id INTO vid FROM form_field f JOIN form_section s ON s.id=f.section_id WHERE f.id=CASE WHEN TG_OP='INSERT' THEN NEW.field_id ELSE OLD.field_id END;
 END IF;
 SELECT status INTO current_status FROM form_version WHERE id=vid FOR UPDATE;
 IF current_status <> 'draft' OR EXISTS(SELECT 1 FROM encounter WHERE form_version_id=vid) THEN
   RAISE EXCEPTION 'Không được sửa biểu mẫu đã phát hành hoặc đã sử dụng' USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' THEN
   IF TG_TABLE_NAME='form_section' AND (to_jsonb(NEW)->>'version_id') IS DISTINCT FROM (to_jsonb(OLD)->>'version_id') THEN
     RAISE EXCEPTION 'Không được chuyển nhóm sang mẫu khác' USING ERRCODE='23514';
   ELSIF TG_TABLE_NAME='form_field' AND (to_jsonb(NEW)->>'section_id') IS DISTINCT FROM (to_jsonb(OLD)->>'section_id') THEN
     RAISE EXCEPTION 'Không được chuyển trường sang nhóm khác' USING ERRCODE='23514';
   ELSIF TG_TABLE_NAME='field_option' AND (to_jsonb(NEW)->>'field_id') IS DISTINCT FROM (to_jsonb(OLD)->>'field_id') THEN
     RAISE EXCEPTION 'Không được chuyển lựa chọn sang trường khác' USING ERRCODE='23514';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_section BEFORE INSERT OR UPDATE OR DELETE ON form_section FOR EACH ROW EXECUTE FUNCTION protect_form_definition();
CREATE TRIGGER protect_field BEFORE INSERT OR UPDATE OR DELETE ON form_field FOR EACH ROW EXECUTE FUNCTION protect_form_definition();
CREATE TRIGGER protect_option BEFORE INSERT OR UPDATE OR DELETE ON field_option FOR EACH ROW EXECUTE FUNCTION protect_form_definition();

CREATE FUNCTION protect_published_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status <> 'draft' OR EXISTS(SELECT 1 FROM encounter WHERE form_version_id=OLD.id) THEN
   IF TG_OP='DELETE' OR NEW.template_id IS DISTINCT FROM OLD.template_id OR NEW.version_no IS DISTINCT FROM OLD.version_no OR NEW.status IS DISTINCT FROM OLD.status OR NEW.published_at IS DISTINCT FROM OLD.published_at THEN
     RAISE EXCEPTION 'Không được sửa phiên bản đã phát hành hoặc sử dụng' USING ERRCODE='23514';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_version BEFORE UPDATE OR DELETE ON form_version FOR EACH ROW EXECUTE FUNCTION protect_published_version();

-- Khóa khung giờ trong giao dịch để hai lần đặt đồng thời không vượt sức chứa.
CREATE FUNCTION enforce_slot_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cap integer; used integer;
BEGIN
 IF NEW.status <> 'booked' THEN RETURN NEW; END IF;
 SELECT capacity INTO cap FROM clinic_slot WHERE id=NEW.slot_id FOR UPDATE;
 SELECT count(*) INTO used FROM appointment WHERE slot_id=NEW.slot_id AND status='booked' AND id IS DISTINCT FROM NEW.id;
 IF used >= cap THEN RAISE EXCEPTION 'Khung giờ đã đủ sức chứa' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER appointment_capacity BEFORE INSERT OR UPDATE OF slot_id,status ON appointment FOR EACH ROW EXECUTE FUNCTION enforce_slot_capacity();
CREATE FUNCTION protect_slot_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE used integer;
BEGIN
 SELECT count(*) INTO used FROM appointment WHERE slot_id=OLD.id AND status='booked';
 IF NEW.capacity < used THEN RAISE EXCEPTION 'Sức chứa nhỏ hơn số lịch đã đặt' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER slot_capacity_valid BEFORE UPDATE OF capacity ON clinic_slot FOR EACH ROW EXECUTE FUNCTION protect_slot_capacity();

CREATE FUNCTION protect_used_mapping() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='mapping_profile' THEN
   IF EXISTS(SELECT 1 FROM import_batch WHERE mapping_profile_id=OLD.id) THEN
     RAISE EXCEPTION 'Cau hinh da dung; tao phien ban moi' USING ERRCODE='23514';
   END IF;
 ELSE
   IF TG_OP='INSERT' THEN
     IF EXISTS(SELECT 1 FROM import_batch WHERE mapping_profile_id=NEW.profile_id) THEN
       RAISE EXCEPTION 'Cau hinh da dung; tao phien ban moi' USING ERRCODE='23514';
     END IF;
   ELSIF EXISTS(SELECT 1 FROM import_batch WHERE mapping_profile_id=OLD.profile_id) THEN
     RAISE EXCEPTION 'Cau hinh da dung; tao phien ban moi' USING ERRCODE='23514';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER used_mapping_profile BEFORE UPDATE OR DELETE ON mapping_profile FOR EACH ROW EXECUTE FUNCTION protect_used_mapping();
CREATE TRIGGER used_mapping_rule BEFORE INSERT OR UPDATE OR DELETE ON mapping_rule FOR EACH ROW EXECUTE FUNCTION protect_used_mapping();

COMMIT;
