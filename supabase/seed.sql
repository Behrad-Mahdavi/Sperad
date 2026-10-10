-- ==========================================
-- SEED DATA: MUSCLES
-- ==========================================
insert into public.muscles (id, name_en, name_fa, group_name, max_sets_per_session, default_mev, default_mrv) values
  ('chest', 'Chest', 'سینه', 'chest', 10, 8, 22),
  ('lats', 'Latissimus Dorsi', 'زیربغل', 'back', 10, 8, 20),
  ('upper_back', 'Upper Back / Rhomboids', 'بخش بالایی پشت', 'back', 10, 8, 20),
  ('traps', 'Trapezius', 'کول و ذوزنقه‌ای', 'back', 8, 6, 18),
  ('front_delts', 'Anterior Deltoids', 'سرشانه جلویی', 'shoulders', 8, 4, 14),
  ('side_delts', 'Lateral Deltoids', 'سرشانه میانی', 'shoulders', 12, 8, 26),
  ('rear_delts', 'Posterior Deltoids', 'سرشانه پشتی', 'shoulders', 12, 8, 24),
  ('biceps', 'Biceps Brachii', 'جلو بازو', 'arms', 10, 8, 20),
  ('triceps', 'Triceps Brachii', 'پشت بازو', 'arms', 10, 8, 20),
  ('quads', 'Quadriceps', 'چهارسر ران', 'legs', 10, 8, 20),
  ('hamstrings', 'Hamstrings', 'همسترینگ', 'legs', 10, 6, 18),
  ('glutes', 'Gluteal Muscles', 'سرینی', 'legs', 10, 6, 18),
  ('calves', 'Calves', 'ساق پا', 'legs', 12, 8, 24),
  ('core', 'Abdominals & Core', 'شکم و میان‌تنه', 'core', 10, 6, 20)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_fa = excluded.name_fa,
  group_name = excluded.group_name,
  max_sets_per_session = excluded.max_sets_per_session,
  default_mev = excluded.default_mev,
  default_mrv = excluded.default_mrv;

-- ==========================================
-- SEED DATA: 36 CORE EXERCISES
-- ==========================================
insert into public.exercises (
  id, name_en, name_fa, movement_pattern, equipment,
  primary_muscles, secondary_muscles, sfr_prior, joint_fatigue,
  systemic_fatigue, length_bias, estimated_time_sec,
  default_load_increment_kg, e1rm_conversion_factor, source
) values

-- 1. CHEST / HORIZONTAL PUSH
(
  'barbell_bench_press', 'Barbell Bench Press', 'پرس سینه هالتر',
  'horizontal_push', 'barbell',
  '[{"muscleId": "chest", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "triceps", "weight": 0.5}, {"muscleId": "front_delts", "weight": 0.4}]'::jsonb,
  0.75, '{"shoulder": 0.5, "elbow": 0.3, "wrist": 0.2, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.70, 0.4, 180, 2.5, 1.0, 'prior'
),
(
  'incline_dumbbell_press', 'Incline Dumbbell Press', 'پرس بالا سینه دمبل',
  'horizontal_push', 'dumbbell',
  '[{"muscleId": "chest", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "front_delts", "weight": 0.5}, {"muscleId": "triceps", "weight": 0.4}]'::jsonb,
  0.85, '{"shoulder": 0.4, "elbow": 0.2, "wrist": 0.2, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.60, 0.6, 150, 2.0, 1.0, 'prior'
),
(
  'machine_chest_press', 'Converging Machine Chest Press', 'پرس سینه دستگاه',
  'horizontal_push', 'machine',
  '[{"muscleId": "chest", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "triceps", "weight": 0.35}, {"muscleId": "front_delts", "weight": 0.3}]'::jsonb,
  0.92, '{"shoulder": 0.2, "elbow": 0.2, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.40, 0.5, 120, 5.0, 1.0, 'prior'
),
(
  'cable_fly_mid', 'Standing Cable Chest Fly', 'قفسه سینه سیم‌کش',
  'isolation_chest', 'cable',
  '[{"muscleId": "chest", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "front_delts", "weight": 0.2}]'::jsonb,
  0.90, '{"shoulder": 0.3, "elbow": 0.1, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.30, 0.8, 120, 2.5, 1.0, 'prior'
),
(
  'weighted_dips', 'Chest Dips (Parallel Bars)', 'پارالل (دیپ)',
  'horizontal_push', 'bodyweight',
  '[{"muscleId": "chest", "weight": 0.8}, {"muscleId": "triceps", "weight": 0.7}]'::jsonb,
  '[{"muscleId": "front_delts", "weight": 0.4}]'::jsonb,
  0.78, '{"shoulder": 0.7, "elbow": 0.4, "wrist": 0.2, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.65, 0.7, 150, 2.5, 1.0, 'prior'
),

-- 2. SHOULDERS / VERTICAL PUSH & ISOLATION
(
  'standing_overhead_press', 'Overhead Barbell Press (OHP)', 'پرس سرشانه هالتر ایستاده',
  'vertical_push', 'barbell',
  '[{"muscleId": "front_delts", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "triceps", "weight": 0.5}, {"muscleId": "upper_back", "weight": 0.2}]'::jsonb,
  0.70, '{"shoulder": 0.6, "elbow": 0.3, "wrist": 0.3, "knee": 0.0, "lowerBack": 0.4}'::jsonb,
  0.75, 0.3, 180, 2.5, 1.0, 'prior'
),
(
  'seated_dumbbell_shoulder_press', 'Seated Dumbbell Shoulder Press', 'پرس سرشانه دمبل نشسته',
  'vertical_push', 'dumbbell',
  '[{"muscleId": "front_delts", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "triceps", "weight": 0.4}, {"muscleId": "side_delts", "weight": 0.3}]'::jsonb,
  0.82, '{"shoulder": 0.4, "elbow": 0.2, "wrist": 0.2, "knee": 0.0, "lowerBack": 0.1}'::jsonb,
  0.55, 0.4, 150, 2.0, 1.0, 'prior'
),
(
  'cable_lateral_raise', 'Single-Arm Cable Lateral Raise', 'نشر جانب سیم‌کش',
  'isolation_delts', 'cable',
  '[{"muscleId": "side_delts", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.95, '{"shoulder": 0.2, "elbow": 0.0, "wrist": 0.0, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.20, 0.7, 100, 1.25, 1.0, 'prior'
),
(
  'dumbbell_lateral_raise', 'Dumbbell Lateral Raise', 'نشر جانب دمبل',
  'isolation_delts', 'dumbbell',
  '[{"muscleId": "side_delts", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.88, '{"shoulder": 0.3, "elbow": 0.1, "wrist": 0.0, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.25, 0.4, 100, 1.0, 1.0, 'prior'
),
(
  'reverse_pec_deck', 'Reverse Pec Deck (Rear Delt Fly)', 'نشر خم فلای معکوس دستگاه',
  'isolation_delts', 'machine',
  '[{"muscleId": "rear_delts", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "upper_back", "weight": 0.3}]'::jsonb,
  0.94, '{"shoulder": 0.1, "elbow": 0.0, "wrist": 0.0, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.20, 0.6, 100, 2.5, 1.0, 'prior'
),

-- 3. BACK / PULL
(
  'lat_pulldown_wide', 'Wide-Grip Lat Pulldown', 'زیربغل سیم‌کش دست باز',
  'vertical_pull', 'cable',
  '[{"muscleId": "lats", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "biceps", "weight": 0.35}, {"muscleId": "upper_back", "weight": 0.3}]'::jsonb,
  0.90, '{"shoulder": 0.3, "elbow": 0.2, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.45, 0.7, 120, 5.0, 1.0, 'prior'
),
(
  'pull_ups', 'Neutral Grip Pull-Up', 'بارفیکس مچ موازی',
  'vertical_pull', 'bodyweight',
  '[{"muscleId": "lats", "weight": 0.9}, {"muscleId": "upper_back", "weight": 0.4}]'::jsonb,
  '[{"muscleId": "biceps", "weight": 0.5}]'::jsonb,
  0.82, '{"shoulder": 0.4, "elbow": 0.3, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.65, 0.7, 150, 2.5, 1.0, 'prior'
),
(
  'chest_supported_row', 'Chest-Supported T-Bar / Dumbbell Row', 'زیربغل تی‌بار با تکیه‌گاه سینه',
  'horizontal_pull', 'machine',
  '[{"muscleId": "upper_back", "weight": 0.8}, {"muscleId": "lats", "weight": 0.7}]'::jsonb,
  '[{"muscleId": "biceps", "weight": 0.35}, {"muscleId": "rear_delts", "weight": 0.3}]'::jsonb,
  0.93, '{"shoulder": 0.2, "elbow": 0.2, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.40, 0.6, 120, 2.5, 1.0, 'prior'
),
(
  'barbell_bent_over_row', 'Barbell Bent-Over Row', 'زیربغل هالتر خم',
  'horizontal_pull', 'barbell',
  '[{"muscleId": "upper_back", "weight": 0.8}, {"muscleId": "lats", "weight": 0.6}]'::jsonb,
  '[{"muscleId": "biceps", "weight": 0.4}, {"muscleId": "rear_delts", "weight": 0.3}]'::jsonb,
  0.72, '{"shoulder": 0.3, "elbow": 0.2, "wrist": 0.1, "knee": 0.1, "lowerBack": 0.7}'::jsonb,
  0.75, 0.5, 180, 2.5, 1.0, 'prior'
),
(
  'seated_cable_row', 'Seated Cable Row (Close/Mid Grip)', 'قایقی سیم‌کش نشسته',
  'horizontal_pull', 'cable',
  '[{"muscleId": "upper_back", "weight": 0.7}, {"muscleId": "lats", "weight": 0.7}]'::jsonb,
  '[{"muscleId": "biceps", "weight": 0.35}]'::jsonb,
  0.88, '{"shoulder": 0.2, "elbow": 0.2, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.2}'::jsonb,
  0.45, 0.6, 120, 5.0, 1.0, 'prior'
),

-- 4. ARMS / BICEPS & TRICEPS
(
  'incline_dumbbell_curl', 'Incline Dumbbell Bicep Curl', 'جلو بازو دمبل روی میز شیب‌دار',
  'isolation_arms', 'dumbbell',
  '[{"muscleId": "biceps", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.92, '{"shoulder": 0.2, "elbow": 0.2, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.25, 0.9, 100, 1.0, 1.0, 'prior'
),
(
  'barbell_ez_curl', 'EZ-Bar Bicep Curl', 'جلو بازو هالتر EZ ایستاده',
  'isolation_arms', 'barbell',
  '[{"muscleId": "biceps", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.86, '{"shoulder": 0.1, "elbow": 0.3, "wrist": 0.2, "knee": 0.0, "lowerBack": 0.1}'::jsonb,
  0.30, 0.4, 120, 2.5, 1.0, 'prior'
),
(
  'cable_preacher_curl', 'Cable Preacher Curl', 'جلو بازو لاری سیم‌کش',
  'isolation_arms', 'cable',
  '[{"muscleId": "biceps", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.94, '{"shoulder": 0.0, "elbow": 0.3, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.20, 0.4, 100, 2.5, 1.0, 'prior'
),
(
  'overhead_cable_triceps_ext', 'Overhead Cable Triceps Extension', 'پشت بازو سیم‌کش از پشت سر',
  'isolation_arms', 'cable',
  '[{"muscleId": "triceps", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.93, '{"shoulder": 0.3, "elbow": 0.3, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.25, 0.9, 100, 2.5, 1.0, 'prior'
),
(
  'cable_triceps_pushdown', 'Cable Triceps Pushdown (Straight/V-Bar)', 'پشت بازو سیم‌کش دستگیره صاف',
  'isolation_arms', 'cable',
  '[{"muscleId": "triceps", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.91, '{"shoulder": 0.1, "elbow": 0.3, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.20, 0.3, 100, 2.5, 1.0, 'prior'
),
(
  'lying_skull_crushers', 'Lying EZ-Bar Skull Crushers', 'پشت بازو هالتر خوابیده (پشت سر)',
  'isolation_arms', 'barbell',
  '[{"muscleId": "triceps", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.80, '{"shoulder": 0.2, "elbow": 0.6, "wrist": 0.2, "knee": 0.0, "lowerBack": 0.0}'::jsonb,
  0.30, 0.7, 120, 2.5, 1.0, 'prior'
),

-- 5. LEGS / SQUAT PATTERN (QUADS & GLUTES)
(
  'barbell_back_squat', 'Barbell Back Squat', 'اسکوات با هالتر از پشت',
  'squat', 'barbell',
  '[{"muscleId": "quads", "weight": 0.8}, {"muscleId": "glutes", "weight": 0.7}]'::jsonb,
  '[{"muscleId": "hamstrings", "weight": 0.2}, {"muscleId": "core", "weight": 0.3}]'::jsonb,
  0.68, '{"knee": 0.6, "lowerBack": 0.7, "shoulder": 0.1, "elbow": 0.0, "wrist": 0.1}'::jsonb,
  0.95, 0.6, 210, 2.5, 1.0, 'prior'
),
(
  'hack_squat_machine', 'Hack Squat Machine', 'هاک اسکوات دستگاه',
  'squat', 'machine',
  '[{"muscleId": "quads", "weight": 0.95}]'::jsonb,
  '[{"muscleId": "glutes", "weight": 0.4}]'::jsonb,
  0.88, '{"knee": 0.5, "lowerBack": 0.2, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.70, 0.7, 180, 5.0, 1.0, 'prior'
),
(
  'leg_press_45', '45-Degree Leg Press', 'پرس پا ۴۵ درجه',
  'squat', 'machine',
  '[{"muscleId": "quads", "weight": 0.8}, {"muscleId": "glutes", "weight": 0.5}]'::jsonb,
  '[{"muscleId": "hamstrings", "weight": 0.15}]'::jsonb,
  0.85, '{"knee": 0.4, "lowerBack": 0.2, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.65, 0.6, 180, 10.0, 1.0, 'prior'
),
(
  'bulgarian_split_squat', 'Bulgarian Split Squat (Dumbbells)', 'اسکوات بلغاری با دمبل',
  'lunge', 'dumbbell',
  '[{"muscleId": "quads", "weight": 0.8}, {"muscleId": "glutes", "weight": 0.8}]'::jsonb,
  '[{"muscleId": "hamstrings", "weight": 0.2}]'::jsonb,
  0.80, '{"knee": 0.4, "lowerBack": 0.1, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.1}'::jsonb,
  0.75, 0.7, 180, 2.0, 1.0, 'prior'
),
(
  'leg_extension', 'Seated Leg Extension Machine', 'جلو ران دستگاه',
  'isolation_legs', 'machine',
  '[{"muscleId": "quads", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.94, '{"knee": 0.4, "lowerBack": 0.0, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.30, 0.5, 100, 5.0, 1.0, 'prior'
),

-- 6. LEGS / HINGE PATTERN (HAMSTRINGS & GLUTES)
(
  'romanian_deadlift_barbell', 'Barbell Romanian Deadlift (RDL)', 'ددلیفت رومانیایی با هالتر (RDL)',
  'hinge', 'barbell',
  '[{"muscleId": "hamstrings", "weight": 0.9}, {"muscleId": "glutes", "weight": 0.7}]'::jsonb,
  '[{"muscleId": "upper_back", "weight": 0.2}, {"muscleId": "traps", "weight": 0.2}]'::jsonb,
  0.76, '{"lowerBack": 0.7, "knee": 0.1, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.2}'::jsonb,
  0.85, 0.9, 180, 2.5, 1.0, 'prior'
),
(
  'dumbbell_rdl', 'Dumbbell Romanian Deadlift', 'ددلیفت رومانیایی با دمبل',
  'hinge', 'dumbbell',
  '[{"muscleId": "hamstrings", "weight": 0.9}, {"muscleId": "glutes", "weight": 0.7}]'::jsonb,
  '[]'::jsonb,
  0.84, '{"lowerBack": 0.4, "knee": 0.1, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.1}'::jsonb,
  0.65, 0.9, 150, 2.0, 1.0, 'prior'
),
(
  'seated_leg_curl', 'Seated Leg Curl Machine', 'پشت ران نشسته دستگاه',
  'isolation_legs', 'machine',
  '[{"muscleId": "hamstrings", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.95, '{"knee": 0.2, "lowerBack": 0.0, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.25, 0.9, 100, 5.0, 1.0, 'prior'
),
(
  'lying_leg_curl', 'Lying Leg Curl Machine', 'پشت ران خوابیده دستگاه',
  'isolation_legs', 'machine',
  '[{"muscleId": "hamstrings", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.88, '{"knee": 0.3, "lowerBack": 0.1, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.25, 0.6, 100, 5.0, 1.0, 'prior'
),
(
  'barbell_hip_thrust', 'Barbell Hip Thrust', 'هیپ تراست با هالتر',
  'hinge', 'barbell',
  '[{"muscleId": "glutes", "weight": 1.0}]'::jsonb,
  '[{"muscleId": "hamstrings", "weight": 0.3}, {"muscleId": "quads", "weight": 0.2}]'::jsonb,
  0.86, '{"knee": 0.2, "lowerBack": 0.3, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.65, 0.4, 180, 5.0, 1.0, 'prior'
),

-- 7. CALVES & CORE
(
  'standing_calf_raise', 'Standing Calf Raise Machine', 'ساق پا ایستاده دستگاه',
  'isolation_calves', 'machine',
  '[{"muscleId": "calves", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.92, '{"knee": 0.1, "lowerBack": 0.1, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.20, 0.8, 90, 5.0, 1.0, 'prior'
),
(
  'seated_calf_raise', 'Seated Calf Raise Machine', 'ساق پا نشسته دستگاه',
  'isolation_calves', 'machine',
  '[{"muscleId": "calves", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.90, '{"knee": 0.1, "lowerBack": 0.0, "shoulder": 0.0, "elbow": 0.0, "wrist": 0.0}'::jsonb,
  0.15, 0.6, 90, 2.5, 1.0, 'prior'
),
(
  'hanging_leg_raise', 'Hanging Knee/Leg Raise', 'زیر شکم خلبانی / بارفیکس',
  'isolation_core', 'bodyweight',
  '[{"muscleId": "core", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.88, '{"shoulder": 0.2, "elbow": 0.1, "wrist": 0.1, "knee": 0.0, "lowerBack": 0.1}'::jsonb,
  0.30, 0.7, 90, 0.0, 1.0, 'prior'
),
(
  'cable_crunch', 'Kneeling Cable Crunch', 'کرانچ شکم با سیم‌کش زانو زده',
  'isolation_core', 'cable',
  '[{"muscleId": "core", "weight": 1.0}]'::jsonb,
  '[]'::jsonb,
  0.91, '{"shoulder": 0.1, "elbow": 0.1, "wrist": 0.0, "knee": 0.0, "lowerBack": 0.2}'::jsonb,
  0.25, 0.6, 90, 2.5, 1.0, 'prior'
)

on conflict (id) do update set
  name_en = excluded.name_en,
  name_fa = excluded.name_fa,
  movement_pattern = excluded.movement_pattern,
  equipment = excluded.equipment,
  primary_muscles = excluded.primary_muscles,
  secondary_muscles = excluded.secondary_muscles,
  sfr_prior = excluded.sfr_prior,
  joint_fatigue = excluded.joint_fatigue,
  systemic_fatigue = excluded.systemic_fatigue,
  length_bias = excluded.length_bias,
  estimated_time_sec = excluded.estimated_time_sec,
  default_load_increment_kg = excluded.default_load_increment_kg,
  e1rm_conversion_factor = excluded.e1rm_conversion_factor,
  source = excluded.source;
