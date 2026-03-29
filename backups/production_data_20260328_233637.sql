SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 6zvB3oOpNzbH4AVaJfhBOP2cwuoOIzcE4gDwcd9aQB0zGHzyl6Qyd1ZL3XcCDKM

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('43007d69-b0ba-4b18-8640-628581ba6adb', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '6aba36a7-c703-4fc0-8c53-8567a49287c6', 's256', 'Tb-BiOHPMgmLv9cC8YdkXXGx5kQ3u7aG5m73vtGCYDI', 'magiclink', '', '', '2026-01-11 00:31:02.636579+00', '2026-01-11 00:31:02.636579+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('04046b71-6028-4de9-98e6-c23be0c69f29', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'faefe46d-dde8-42b9-a489-e51928a8a705', 's256', 'Ku6KuXzCaosXLFebWSBNpxVf6nKogiDnBDhiUpMgJcU', 'magiclink', '', '', '2026-01-11 00:33:15.674344+00', '2026-01-11 00:33:15.674344+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('296b08e1-d2b2-4c41-b0b5-ad0f57accf81', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'ded5eb6c-21fb-49ee-9e34-f51c71d300d6', 's256', 'WVCPffdIuFR7gI50C-a_CD2jEoYLEudlenZtjDK5wD8', 'magiclink', '', '', '2026-01-11 00:36:12.419766+00', '2026-01-11 00:36:12.419766+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('4fa818d1-2ea0-47c5-9abc-81e9455e386f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'bf4222da-b1c9-4f99-bb1a-ed511b390220', 's256', 'hzD17EdcKWxKqNZlzRZCtzMW42cH4oI1TRinvltOrsY', 'magiclink', '', '', '2026-01-11 00:55:14.303077+00', '2026-01-11 00:55:14.303077+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('5749f120-c01d-42c1-b61c-231511e8ec72', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'f98603aa-3d15-408b-941e-92a4f67894bb', 's256', 'YeOXHCmFWxRRC1s_LPadjpV_usaQvj-zV8lt_yNJhkw', 'magiclink', '', '', '2026-01-11 01:14:50.788477+00', '2026-01-11 01:14:50.788477+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('a73a4d6a-ea3b-4156-853b-ae76ee30549b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '11e4b009-98e5-470b-b443-ceee435f0d45', 's256', 'nvHC81K865dflLabQgO5HD1MVL5UxutIQP9Qx_56sls', 'magiclink', '', '', '2026-01-11 08:21:18.563261+00', '2026-01-11 08:21:18.563261+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('cc9c017d-797a-4225-8746-34a36328a46f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'e9e91a8e-4f1a-4a4e-abad-ab4379276d83', 's256', 'JsKTDyYiANvdKp_7YzsyQNN2bUp1JFcXBxD-iCZYP0k', 'magiclink', '', '', '2026-01-11 09:08:55.027936+00', '2026-01-11 09:08:55.027936+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('720b742e-1a02-4dc9-9f37-72d8dc9f7c01', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'e86be950-8be0-4be8-9d6a-ad03ea90dfa9', 's256', 'BVLqcyd_xI5AsHEO3dEEH0kzDqT-4fHWgSCyztctacM', 'magiclink', '', '', '2026-01-11 09:09:37.229065+00', '2026-01-11 09:09:37.229065+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('4385f943-66d8-4bc5-92fc-120a91fa7ee9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'a913e132-3cee-45b1-8367-49fd38994b16', 's256', '0iSjVkbGo5jwkjE0SLUWRWmQH_p9LelnU-2ruOiRj1Y', 'magiclink', '', '', '2026-01-11 09:11:18.504227+00', '2026-01-11 09:11:18.504227+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('3450c0a1-6e1a-4bba-912d-29ac508d9274', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'cd3b2676-3373-4929-afb8-ff54b33d8d54', 's256', 'B-mCZ2bb9g1kMxX78mrGc3qbNvaVpFgOiUPROb_j8_k', 'magiclink', '', '', '2026-01-11 09:37:32.906152+00', '2026-01-11 09:37:32.906152+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('f42b8ba2-d84a-4a34-9b83-e91505ebf898', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'dd4e9124-887c-41b9-bf90-626b548a5b2e', 's256', '1wjopwN2U7YElTGWYhWLUAFnulWLCBo0x9tw0pZBSH8', 'magiclink', '', '', '2026-01-11 09:38:06.126832+00', '2026-01-11 09:38:06.126832+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('f0091b0e-b959-4072-aac4-98bef04cf37d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '105bc2d5-9071-4d33-b342-6cb74c3c7cd6', 's256', 'HDWUElkRPpJRSt431Gg_JiQXvxWmkTiVW1jC0bozCtg', 'magiclink', '', '', '2026-01-11 09:38:31.796612+00', '2026-01-11 09:38:31.796612+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('4db1e634-353c-4f8a-8f04-e290029f9c15', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'a90f5c6f-8c6d-4b22-91dc-500d564617fb', 's256', 'RHvr4ry232JukxH_LMydKxMfPEAQyqcqeSPPSgS_avI', 'magiclink', '', '', '2026-01-11 09:38:34.963117+00', '2026-01-11 09:38:34.963117+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('bb6e708c-9671-40e8-b6f3-9234b0ee82cc', '096bd3d3-edb9-4039-97d6-47d92d2b3fa6', 'c7b1385c-2ac0-4f19-a66a-9b3328992197', 's256', '3RlrrXVUFFDyOS0hxYErSrlqrSHI1HZGbda6OugaE9M', 'magiclink', '', '', '2026-01-11 10:01:53.906812+00', '2026-01-11 10:01:53.906812+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('1871b17a-4b12-4e64-b0de-9fd8f5eef46d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '91f076b7-9c1a-48ee-80aa-2e7ecf730026', 's256', 'EkSHh8ZPNbS7KCX4_iAW1FOoct0rF4IXmSSYdSYKdlg', 'magiclink', '', '', '2026-01-11 10:02:36.556659+00', '2026-01-11 10:02:36.556659+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('478fe2e9-8d8c-4ca5-b362-7a0d6e7b2507', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'd493d137-532a-4164-9757-8f115c72049f', 's256', 'tafcKVAeRYiKz1wFUQlOPj_gn8zWbhLDMMcJsqdhooc', 'magiclink', '', '', '2026-01-11 12:43:48.701559+00', '2026-01-11 12:43:48.701559+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('a9225b21-a8e8-4b8f-81a6-3fdb5df1c2ce', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'ad6049e0-5d60-4692-a6a6-0c56766643e4', 's256', 'hkrAixMzXSMq10FhRmCex1kiYGEUSn0-fTtYNHSELFY', 'magiclink', '', '', '2026-01-11 13:39:24.675949+00', '2026-01-11 13:39:24.675949+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('8456f51a-cabd-4cb6-854e-998a312f829d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '76ffdee9-09a6-48d8-afdf-15915ef37db6', 's256', 'h92DsTZJav6bxTSPU6RHABKKVlNmtSP2pGVMa9lnXDo', 'magiclink', '', '', '2026-01-11 13:46:34.339505+00', '2026-01-11 13:46:34.339505+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('9caa7b21-e1ac-4a9f-b2a9-43f85afd0f7b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'b0f1ec01-c648-47e3-ad87-dfb5a513d1fa', 's256', 'Rv63ahYSPcszDITmbcSWkszW09laUdTMywK9WaFhAoU', 'magiclink', '', '', '2026-01-11 19:10:19.948985+00', '2026-01-11 19:10:19.948985+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('4c5aa028-73e5-44a7-8854-e2eeb1af4c7b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '7ede6d31-3d69-411e-b5d7-9c2cf218346c', 's256', 'mQcNvNTvlNLLv39MdRmSTMZ5Mw1EasS54R5hHU0iTlo', 'magiclink', '', '', '2026-01-11 19:13:09.258566+00', '2026-01-11 19:13:09.258566+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('ea55c507-ac08-4126-b440-0c3b15bf8f02', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '80ceac24-ce23-418c-9d72-c0021f16093f', 's256', 'Zt-KmWD3hn79xYHLwLHV1lEVUxSObywyzDoPLupJoyg', 'magiclink', '', '', '2026-01-12 09:13:39.959952+00', '2026-01-12 09:13:39.959952+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('381fa9f6-4f2d-4381-96fc-5f3dd3409e66', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '5ec0d9a6-c4ff-45cc-970d-d8b3a35ea16a', 's256', 'IRN5l1nKcF8Mc0ftYs-0cRThrI4BNPttWDgZCDyID_c', 'magiclink', '', '', '2026-01-12 09:29:45.173298+00', '2026-01-12 09:29:45.173298+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('7baa3cd3-7689-480d-b063-2ab3affb083c', '096bd3d3-edb9-4039-97d6-47d92d2b3fa6', 'de78f0c5-2fce-4e3b-be9e-c3750ca2db06', 's256', 'KrD_bnHDdxCPgNITMMKDVzr3d7Y6qEGIZ_Cldne_4Ys', 'magiclink', '', '', '2026-01-12 09:39:49.110121+00', '2026-01-12 09:39:49.110121+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('ff79061c-4b79-4881-822f-eb4ea07bec31', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'b6bd9c16-e509-4e7f-971c-2322e91d66f3', 's256', 'rO1hu1_9YvWqyY6jYTdZ_GRiS8fchXxYdx9R_IEWkXU', 'magiclink', '', '', '2026-01-12 09:39:55.896053+00', '2026-01-12 09:39:55.896053+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('ee9c51a5-ca7b-40d8-9edf-22e3c870b1d4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '81700c4b-a1b2-4ca1-8efe-9438530454ba', 's256', 'CX4e1g2YO0Gro4t4T3A5LLgXrDl6Y-4X4QPgrAGJnoU', 'magiclink', '', '', '2026-01-13 23:16:23.276651+00', '2026-01-13 23:16:23.276651+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('41e5b4d9-6ddd-45f0-a527-abc7c30c9dfe', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '037ca059-91c1-4a12-bc97-0fd141e6b0df', 's256', 'dIEM3DK8sSJ38ervEOVfdLydWY9weWyC69X_0EjeATQ', 'magiclink', '', '', '2026-01-14 00:14:53.128827+00', '2026-01-14 00:14:53.128827+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('32f13330-001d-4e8e-b765-feab1a9666ba', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '090ade88-1354-4682-9cdd-05d9e67d9316', 's256', 'Ovt-KVWc7mq0uicYnpKj_o7vPqnD955l6Ygul6hv-Tg', 'magiclink', '', '', '2026-01-14 00:22:54.942245+00', '2026-01-14 00:22:54.942245+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('e0e1e0d6-3fc3-4c6c-93f7-efcea68c7d62', '5ece5b61-e004-480e-b4c5-44bcd744287f', '011fe700-e7a7-4aa0-bf05-307cfed318de', 's256', 'qAVMJECeSgtQU3eccUStCk1vCndYDCqCoZ9vy4DOOCs', 'magiclink', '', '', '2026-01-14 12:29:22.981253+00', '2026-01-14 12:29:22.981253+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('92f0c0c3-861c-4b7b-826a-2519f4994bf3', '054d9251-3b61-403d-a792-485624141d97', '69864328-f655-4755-805a-f1da9a75e53c', 's256', '2cgwep4m1ujghS8WkhybabMWksG6g0gtYvwNp0lNJbM', 'magiclink', '', '', '2026-01-14 12:30:48.760409+00', '2026-01-14 12:30:48.760409+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('9c8de7fd-d139-4c9c-946d-6f55c2197f0c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '450331e0-e844-40b0-ba48-3882cce13cb5', 's256', 'YOHvhfQjV0B2lUdmkTx4Y6oD0GvQnW7uhLOMDiF8W1E', 'magiclink', '', '', '2026-01-14 12:55:48.045783+00', '2026-01-14 12:55:48.045783+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('424b6895-d7d5-43db-a552-e1aa966a19aa', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '560d74be-65ee-4c40-9f1e-a7db28db7718', 's256', 'cCV8aeyp5ynWsqFPmLLUAoCewPBcwSfsKEutcsxV5kE', 'magiclink', '', '', '2026-01-22 06:53:57.757421+00', '2026-01-22 06:53:57.757421+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('1b174609-0bdf-40cd-ad54-6bc07b627c85', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '5c2b7aff-7db4-4f26-a364-5de768d42442', 's256', 'QO5LmolwIws-olfidmhNz1DcG2nDRCZbzQRZNOuIbAk', 'magiclink', '', '', '2026-02-08 05:21:59.648211+00', '2026-02-08 05:21:59.648211+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('ea3d66c8-23a8-46b8-bb1d-5df00d18673f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'afba6e2e-b09b-4b32-a0e3-5ee197c06e0b', 's256', 'ZWyu8EtYbW0tVajRqW_TfEmFlPBbWuKeCspE44HNxZ8', 'magiclink', '', '', '2026-03-07 13:57:59.743858+00', '2026-03-07 13:57:59.743858+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('5a91d6e6-92cb-444f-83a5-d22c608c7f95', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '3659055e-509e-40e4-9d9c-125140f214d2', 's256', 'eEN4J2lA8NPHmPm4Eew54cSl2ym69G3KTtQ_DrsQfgM', 'magiclink', '', '', '2026-03-11 14:24:41.449531+00', '2026-03-11 14:24:41.449531+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('8125ada7-c191-441f-b2e0-21f51a73bcde', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'eac57011-0ded-460f-a332-b46da1febdd7', 's256', 'P7mglsZhBxiV8SIBI69RL9mHCE-gZVWiTQcFQemP-fA', 'magiclink', '', '', '2026-03-11 14:25:24.914521+00', '2026-03-11 14:25:24.914521+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('e09586bd-9848-4c59-8d5c-e20c47012771', 'c6404bc9-8cf2-482a-b13f-4e0b8ef5beaf', '5b5a3896-7f80-47c9-b016-ae624c36c5dc', 's256', '4YnpctghWHKPnbmZrU93WHgIoWRYUz4qKnbNwAAm1eI', 'magiclink', '', '', '2026-03-11 17:07:48.88301+00', '2026-03-11 17:07:48.88301+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('dba34750-5aab-4bd7-a6cc-d8d6aee89660', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'cc33f263-f4ac-4da8-a41d-66381af9b8ae', 's256', 'cpHJ9OHVK7UNEPK84zBZVXm9qaWJcWazrVnAeBzoTec', 'magiclink', '', '', '2026-03-11 18:07:07.794784+00', '2026-03-11 18:07:07.794784+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('20700570-d5d3-4be1-b02e-8cae56039b8d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'd70439a5-b2c6-43d8-b92b-bea89c6e4984', 's256', 'eYG6fx07FOpDLb5P9vQLiHf54jrS_ol04l_gp3P_ZTQ', 'magiclink', '', '', '2026-03-11 18:07:13.60315+00', '2026-03-11 18:07:13.60315+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('53ca7828-bac2-4ea9-baa1-fdd7c8572538', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '39884961-0291-400e-8d9b-0146bb0c57d9', 's256', 'L4P7DKEu4tr7drpX_H6ZrmRMikKjz-dmmnc2NzhHa6w', 'magiclink', '', '', '2026-03-11 18:08:57.738336+00', '2026-03-11 18:08:57.738336+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('4d9689b9-a27a-4d03-9758-69e982c3657e', '8172a2c5-52b7-446c-8b2a-64ba98542a18', 'ebb241e3-b2e5-4a88-b4f8-77c6230bf373', 's256', 'vAwPC31vnKgUllcVMpjl-9_z3zpckMjlMxWRRLEvaT8', 'magiclink', '', '', '2026-03-12 02:54:53.47423+00', '2026-03-12 02:54:53.47423+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('5cee548d-802f-4b83-82f0-7bca7f35540d', '8172a2c5-52b7-446c-8b2a-64ba98542a18', 'a8ad809f-d344-4750-bc48-fb0ba89ab41e', 's256', 'HCX4vPvamCV2dgwyIAa1KT0hrFx1PQFJQl7FCSwwDvk', 'magiclink', '', '', '2026-03-12 15:27:09.224946+00', '2026-03-12 15:27:09.224946+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('365922c2-4285-4faf-a2c7-5d84b5c6193e', '8172a2c5-52b7-446c-8b2a-64ba98542a18', 'f1cde4f9-7d4a-4152-808c-20db5377b963', 's256', 'muYCAdZihY6vuza4Eg5tnxaJy8RwmBFMBCpgKo9gvfQ', 'magiclink', '', '', '2026-03-13 10:29:49.891468+00', '2026-03-13 10:29:49.891468+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('493bbad1-1472-44dc-9273-493ce39e2312', '6149bc92-eca2-460f-a4dd-2a3389c7aee5', 'ab799ca0-6654-4b6f-a279-97c53acdc5e2', 's256', 'V8MqqUfD3tt2Ym-dKli0MdQ1f5bQRQqw3v1yZWdmVKk', 'magiclink', '', '', '2026-03-13 10:32:02.454866+00', '2026-03-13 10:32:02.454866+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('dac0a8b9-8d97-45c7-8607-9df8d08aac4d', '8172a2c5-52b7-446c-8b2a-64ba98542a18', '18d89755-3e8c-468d-8be6-dee66c636d08', 's256', 'EfERMzaalTfx-dWYFOV-2AEX1mcQyoMrgPsDZn1TS8M', 'magiclink', '', '', '2026-03-14 06:47:21.253845+00', '2026-03-14 06:47:21.253845+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('9b4cd1a3-78c2-40e0-9434-7733a764e14b', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', '1e485a38-b275-4951-84d8-c469cd355885', 's256', 'cdd6gGaOiHdB8QN2TEHgmqNV5FqWRGi9wAOyDPZi9Q4', 'magiclink', '', '', '2026-03-19 02:10:44.537925+00', '2026-03-19 02:10:44.537925+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('36591c86-644c-4f44-82af-f517998c25e8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'c2701b05-5c1c-4826-a4d3-e597b44aaca1', 's256', '6jhA3gyubelrR_81QeEEq9IUd1Wf3xSOtLVwb4fTCLY', 'magiclink', '', '', '2026-03-21 06:39:48.562713+00', '2026-03-21 06:39:48.562713+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('2de9e1d6-1f56-41b5-9012-bf337d1af1ab', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', 'a5ed9713-d3d0-4c8d-9956-ca4021499f22', 's256', 'umjU5CPrB-8MJymiNUU2TiC-oocCxFt4vp-akeAHRpM', 'magiclink', '', '', '2026-03-21 08:08:18.169088+00', '2026-03-21 08:08:18.169088+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('0ebb63fc-49d2-4f57-9655-5a33fab8862d', '1c154887-9d93-4045-93c9-94f204c485d2', 'ee2e63bf-fc9b-420e-9c84-b22e849fcce5', 's256', 'U9aidaSD3S0BX4BaC2lGGl9IQ1VqZ2l4ZkEr6uFgeGQ', 'magiclink', '', '', '2026-03-21 09:35:54.993914+00', '2026-03-21 09:35:54.993914+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('a9c47a7d-27af-4f30-bd19-f658e6d890b3', '3ff49fc5-778e-43fe-9adb-19a1fbdfc6d8', '1a798121-d126-43f6-9364-776140045ed4', 's256', 'd5TqfKAOC71k4mK6OqyoeAVesC5f8z-GHtWKsoto1z0', 'magiclink', '', '', '2026-03-21 09:43:26.915833+00', '2026-03-21 09:43:26.915833+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('9788c866-0580-4e0b-bf9f-0cfc2d14ccb6', 'a6987c7b-c348-4d6e-8af1-ce387a361bdf', '522c3f2e-1d38-4d13-a35e-472b2b510c69', 's256', '7aKUAwxT7hMRvtyUra7bIBShBdHqnQENAWZMQkkM7vk', 'magiclink', '', '', '2026-03-22 00:05:26.61861+00', '2026-03-22 00:05:26.61861+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('a6fe99bc-2a7d-431a-9e16-411d5473a4f4', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '9a1bf342-4b61-4494-be75-86b6539e139c', 's256', 'CZExfqh6ZwSrg96UIz6AzH_pr_nYw1a3kJI-vtRxrw4', 'magiclink', '', '', '2026-03-24 08:52:49.470051+00', '2026-03-24 08:52:49.470051+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('d05372fe-c1bb-42d0-9893-8c3dc6078982', '5296b70b-03bb-463b-853c-9ccff2697685', '324eb952-fb8a-443b-b435-b32d16548824', 's256', 'c0KZMRqetGJIFQyHxo0hoZI3q6VH0MJD3CwrqtsgbhE', 'magiclink', '', '', '2026-03-24 10:06:31.903834+00', '2026-03-24 10:06:31.903834+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('3824cb87-7f9e-404c-a332-c0b491faed2f', '7c65c9b0-a62d-496e-a35a-f71f220c9546', 'c4777066-1b9b-4c1e-bc89-241bd1180eb4', 's256', 'ghwHCY8L_0NPYmbEm_VRKMXykRhSp-BXIXNkmRSwvds', 'magiclink', '', '', '2026-03-25 02:20:53.834888+00', '2026-03-25 02:20:53.834888+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('d7ef1de5-6ad1-42f7-9f56-b34a02959370', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', '83b53c1d-3aae-46b8-8f24-fa1cc07790ad', 's256', 'i4haBaj-eZeW7sZrrD35bI_-cWv5ZESPwepXtX9IStE', 'magiclink', '', '', '2026-03-25 16:27:02.913056+00', '2026-03-25 16:27:02.913056+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('01a59e78-84cd-4e44-826c-3e337a98367a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'f21253fb-6b8d-494a-b9b1-23c74146e0eb', 's256', 'XqEpky_8omwWR3zUE-FTQnCAAaczcV4LJrr86I0-uoQ', 'magiclink', '', '', '2026-03-25 18:02:56.395437+00', '2026-03-25 18:02:56.395437+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('a1bc4b04-5eb9-49e9-a958-ddf0186325b8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '74489d1d-7e4d-4ab2-8146-d625a35a0d1e', 's256', 'E-5NISa5TSmI3mNyu79EF-lrcDx4k8DBzU84dUkrrLY', 'magiclink', '', '', '2026-03-26 05:34:20.482763+00', '2026-03-26 05:34:20.482763+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('b1d91c24-03a9-41a0-83d1-6232951ade95', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'fc9853a4-987b-485d-bf1b-07cd236000d1', 's256', '2G_r6za-mTluls2VAS1oikRn26an81PKgI5C7Wi6WD4', 'magiclink', '', '', '2026-03-26 07:01:17.013777+00', '2026-03-26 07:01:17.013777+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('306b7260-86a4-4b35-a143-2e02af8e8a46', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '0a9ffea6-6885-4999-ac19-87f8b7476be6', 's256', '29dHiv5DdbBkK7qCSVCzCxZKYGGlh5SUEAYCEgxvims', 'magiclink', '', '', '2026-03-26 07:01:38.452357+00', '2026-03-26 07:01:38.452357+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('63896b9f-4545-479c-a363-59dd8be00986', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'fa015743-a4d4-40b7-adbd-353db336473d', 's256', 'QtmyA7sUxBv6u8zCzfqBKIMIAifqxUU2WCrhJZzlRr8', 'magiclink', '', '', '2026-03-26 07:04:32.283788+00', '2026-03-26 07:04:32.283788+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('dd26f2a6-ca42-4cf9-b1a4-88cbcf6a2ab3', 'baaf6f34-042d-468e-8913-080def59f6ea', 'b0ddf456-91a6-4d91-95ae-000fcb670a8a', 's256', 'Pq_-m_6nIvWyrulOJUjpvaXWXb5Yjbcf0KvMWn0hjhk', 'magiclink', '', '', '2026-03-28 04:08:15.705901+00', '2026-03-28 04:08:15.705901+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('3b39d635-1219-4cff-a7fb-d181dfd23585', 'eff865b7-be58-4ac8-9eeb-91bcb678d1e6', '771f7a35-2d44-4f76-a125-d5ac5fab1acd', 's256', 'GdnijxmQdmDwaeLzYswdB08IsT0NNTDvHIPqpmfIf8E', 'magiclink', '', '', '2026-03-28 04:15:13.689309+00', '2026-03-28 04:15:13.689309+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('46e903e6-b12b-4b4f-8b7e-72eaf1cdcfc8', 'baaf6f34-042d-468e-8913-080def59f6ea', 'a1a5c84f-af95-41d8-a9f9-80eb1a4682d8', 's256', 'jhecYpzs_G7f1GgG9gdlpYOXSjcElrKQLvg-4x25bMc', 'magiclink', '', '', '2026-03-28 04:22:54.846335+00', '2026-03-28 04:22:54.846335+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('7a82f342-1d26-4c1e-b8d2-6ad1e2ecfd90', '85155afe-ec56-471e-a0a1-3fbf58b972ac', 'e4781368-a76a-4bae-91b1-81a2d1aa798b', 's256', 'rb2xCZrxIVR1m50L5sSsIHT6PARHEmXq6t-wBi3S9kc', 'magiclink', '', '', '2026-03-28 05:08:36.114502+00', '2026-03-28 05:08:36.114502+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('0e463ee6-2084-43f8-8c8f-6ef203e047d9', '5296b70b-03bb-463b-853c-9ccff2697685', '3927e1ea-d80e-486a-8fab-aff94abe8d35', 's256', 'J3o970pDUrC-3aatgJ6pIl8ycLlQs1on9EJZV2-Wxfk', 'magiclink', '', '', '2026-03-28 05:20:05.893747+00', '2026-03-28 05:20:05.893747+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('a941272a-fb7a-4afb-8f4f-b3cb5b4b0d32', '12504482-719b-41bc-b754-97e33d61852b', '4c99775c-2ae4-4276-a257-040ca6a4daec', 's256', '8X1ZLPUo39Pwfto2LvEcr4SImo9RXSk8heko_9wMUkg', 'magiclink', '', '', '2026-03-28 09:17:31.873442+00', '2026-03-28 09:17:31.873442+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('2ff6dc4e-9216-4113-9ed4-604e1a49efe1', '12504482-719b-41bc-b754-97e33d61852b', '84aa0b16-fc70-417b-ac50-ef4e0b3f39f8', 's256', 'gTj5vYtFZB0qvlE5_9sCK1-gUcPUBRcEdPxaYnVNAtU', 'magiclink', '', '', '2026-03-28 09:27:52.597619+00', '2026-03-28 09:27:52.597619+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('1fbf2853-7240-42a1-b636-395f80e63b25', '285512e4-a8f3-4c2e-9402-824eacc1fd86', '615f64f1-733c-4831-9243-bbf4f1ac42d3', 's256', 'zLSm_Z11ud8hYscnpNBUm-0UfG_3gzEshfpccFUxb6o', 'magiclink', '', '', '2026-03-28 09:30:13.639783+00', '2026-03-28 09:30:13.639783+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('0a02f0e8-d4e5-4b0c-b4cb-27e05322ea16', '285512e4-a8f3-4c2e-9402-824eacc1fd86', '7acbcbc4-306f-4563-afab-d3a4942e6c81', 's256', 'CXitRitBlRtpRfYtDqPuHV8Fgsp1Ks-MbE3W6_xUt4s', 'magiclink', '', '', '2026-03-28 09:31:14.653166+00', '2026-03-28 09:31:14.653166+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('cfc37792-fa7f-4f4f-ab8a-b084901d64a7', '285512e4-a8f3-4c2e-9402-824eacc1fd86', '12437351-987f-4dde-83a4-c0f133af2c37', 's256', 'JwVG7kYgwe9v8C9LkKUOBHBWl8U9Ye_49ftHFWXISBw', 'magiclink', '', '', '2026-03-28 09:32:20.900662+00', '2026-03-28 09:32:20.900662+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('d502f5b0-ed01-428c-ba90-b6c272e0d58f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'c3106414-3a29-451e-96f4-26dd55d1dcaf', 's256', 'cQUN-2ULcnRwvYwC0PJPcL4bK_45hMTNAwXf_UN2D_k', 'magiclink', '', '', '2026-03-28 10:36:24.629216+00', '2026-03-28 10:36:24.629216+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('42b44ff3-cd65-4b2a-8dc8-6c79f22273cf', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'c8af2ccb-1464-486f-8b06-769c0b41a5d1', 's256', 'c_fsTl1WBtE7s0f5ry2_xKPA3VGwLFUE4hr944ct1lA', 'magiclink', '', '', '2026-03-28 11:23:35.014271+00', '2026-03-28 11:23:35.014271+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('0d8df138-fad8-49a7-a5fd-ba1e04c57e84', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '020efcca-d9d0-4f99-bd28-818c3cdfbbf3', 's256', 'WcHBly4xry3PlWU8iypAnMVc7nztUFyh8uqghE67eiA', 'magiclink', '', '', '2026-03-28 11:39:16.172465+00', '2026-03-28 11:39:16.172465+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false),
	('a3d51994-003e-402f-9d0e-5b5f3f4bd16e', '880025b6-0043-45ea-ad81-b035326d403f', 'ff3c50a2-f3a1-4245-ad7e-6c17afa19e42', 's256', 'RqdGXcvlnfufSXwosgx6LkecbNljxhrdSsraMpoQtOM', 'magiclink', '', '', '2026-03-28 14:22:43.734833+00', '2026-03-28 14:22:43.734833+00', 'magiclink', NULL, NULL, NULL, NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'baaf6f34-042d-468e-8913-080def59f6ea', 'authenticated', 'authenticated', 'yen05031991@gmail.com', '$2a$10$dPPkAFzbs80pNNwIYeZKuer2VQseQbMmi7u64d0a0WLWZX3VlInsO', '2026-03-28 04:08:15.60514+00', NULL, '', NULL, '', '2026-03-28 04:22:54.87568+00', '', '', NULL, '2026-03-28 04:23:32.664643+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "baaf6f34-042d-468e-8913-080def59f6ea", "email": "yen05031991@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-28 04:08:15.532434+00', '2026-03-28 04:23:32.693338+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '285512e4-a8f3-4c2e-9402-824eacc1fd86', 'authenticated', 'authenticated', 'thunguyetdoan17081972@gmail.com', '$2a$10$HApXBIOGylH7z4ix0mtCEeAudI4ELCeKbnXR/6a9ebJ9pDwKxCJVK', '2026-03-28 09:30:13.629399+00', NULL, '', NULL, '', '2026-03-28 09:32:20.905493+00', '', '', NULL, '2026-03-28 09:32:48.066078+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "285512e4-a8f3-4c2e-9402-824eacc1fd86", "email": "thunguyetdoan17081972@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-28 09:30:13.605462+00', '2026-03-28 09:32:48.092399+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', 'authenticated', 'authenticated', 'trandung233@gmail.com', '$2a$10$SG8b6ISKZPyrVuG7YzNlw.fpx/XfpwozUGYXFu6fS2IWWhgkC733q', '2026-03-24 08:52:49.339732+00', NULL, '', NULL, '', '2026-03-24 08:52:49.482135+00', '', '', NULL, '2026-03-24 08:53:17.780424+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "8f75d261-fd19-45e0-a9b0-e40fe02a2fb6", "email": "trandung233@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-24 08:52:49.172991+00', '2026-03-28 09:44:16.058953+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '8172a2c5-52b7-446c-8b2a-64ba98542a18', 'authenticated', 'authenticated', 'ngoctanphan02@gmail.com', '$2a$10$2kyKWvyYLv563xdC4gcXPOmB5oGvoqeY55WmGSbRemtLoMHHfJ2Ni', '2026-03-12 02:54:53.354779+00', NULL, '', NULL, '', '2026-03-14 06:47:21.308528+00', '', '', NULL, '2026-03-14 06:47:38.263589+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "8172a2c5-52b7-446c-8b2a-64ba98542a18", "email": "ngoctanphan02@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-12 02:54:53.231255+00', '2026-03-23 01:55:34.688435+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '7c65c9b0-a62d-496e-a35a-f71f220c9546', 'authenticated', 'authenticated', 'test@test.com', '$2a$10$FQR/50ELQuKzax5gEgP8uud2sk9ip6MK7tqH6H1s1gSYIoQFhoX1u', '2026-03-25 02:20:53.805547+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-25 02:20:53.812851+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "7c65c9b0-a62d-496e-a35a-f71f220c9546", "email": "test@test.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-25 02:20:53.774562+00', '2026-03-25 02:20:53.823016+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'authenticated', 'authenticated', 'phanquochoipt@gmail.com', '$2a$10$5RWcZ6ktjJS/Z0SxYTYXiu8l8PMTrtCoqf25sMfyDHRU6QFEF17Wi', '2026-01-10 15:09:33.038193+00', NULL, '', NULL, '', '2026-03-28 11:39:16.188856+00', '', '', NULL, '2026-03-28 11:39:33.160625+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "dfdf03f7-aec8-4080-bcd2-169e8c1d95ed", "email": "phanquochoipt@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-01-10 15:09:33.024486+00', '2026-03-28 14:34:13.846409+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '85155afe-ec56-471e-a0a1-3fbf58b972ac', 'authenticated', 'authenticated', 'manhhieu972000@gmail.com', '$2a$10$Krokv9MpPpdFfA4FdxS1A.iqP9udifuBHdNyos/UNNDvK1bUDxlai', '2026-03-28 05:08:36.074744+00', NULL, '', NULL, '', '2026-03-28 05:08:36.123539+00', '', '', NULL, '2026-03-28 05:08:56.11251+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "85155afe-ec56-471e-a0a1-3fbf58b972ac", "email": "manhhieu972000@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-28 05:08:36.006915+00', '2026-03-28 15:38:17.823606+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '5296b70b-03bb-463b-853c-9ccff2697685', 'authenticated', 'authenticated', 'nguyenphuonghoang888@gmail.com', '$2a$10$QkQBG0NWvWFUJbbn0v50wetEpb7WW8pQhcnhsl3VP5beyF5Gwl.uW', '2026-03-24 10:06:31.815562+00', NULL, '', NULL, '', '2026-03-28 05:20:05.910354+00', '', '', NULL, '2026-03-28 05:21:11.507198+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "5296b70b-03bb-463b-853c-9ccff2697685", "email": "nguyenphuonghoang888@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-24 10:06:31.665683+00', '2026-03-28 05:21:11.537255+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', 'authenticated', 'authenticated', 'lamduy.action@gmail.com', '$2a$10$l.qjzKCOOkcn9oswKrKED.Kahce5dE4ichPJFJMw.yOOR2xsta8tC', '2026-03-25 16:27:02.834064+00', NULL, '', NULL, '', '2026-03-25 16:27:02.922297+00', '', '', NULL, '2026-03-25 16:27:34.068395+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "b5fd97d9-97ab-4a97-a7b6-ea9dcba22470", "email": "lamduy.action@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-25 16:27:02.707043+00', '2026-03-28 05:22:00.803819+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '880025b6-0043-45ea-ad81-b035326d403f', 'authenticated', 'authenticated', 'trangiangha@gmail.com', '$2a$10$h5wYTzM.laB1J3x9RK8iPev3x6otYl5V2NYu.C1YlkIdTUpd2mzoS', '2026-03-28 14:22:43.608913+00', NULL, '', NULL, '', '2026-03-28 14:22:43.751339+00', '', '', NULL, '2026-03-28 14:23:17.215865+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "880025b6-0043-45ea-ad81-b035326d403f", "email": "trangiangha@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-28 14:22:43.52027+00', '2026-03-28 14:23:17.218981+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', 'authenticated', 'authenticated', 'akiracong@gmail.com', '$2a$10$9.Scpy3ig6OTgyRUJdtixOTPAN4SV4jSzXb2YaQ10K44ak8bZaTYS', '2026-03-21 08:08:18.040322+00', NULL, '', NULL, '', '2026-03-21 08:08:18.184602+00', '', '', NULL, '2026-03-21 08:08:43.325416+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "1f7e5e98-b4e9-478c-beb1-e3ddc66cd875", "email": "akiracong@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-21 08:08:17.938363+00', '2026-03-22 02:35:55.080925+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '12504482-719b-41bc-b754-97e33d61852b', 'authenticated', 'authenticated', 'thanhthain06@gmail.com', '$2a$10$uEvBUvVpJ31HW3IxSWrKOOpR/5tKmDy9X.lhmfEdlvGyssN042kCK', '2026-03-28 09:17:31.751109+00', NULL, '', NULL, '', '2026-03-28 09:27:52.633951+00', '', '', NULL, '2026-03-28 09:28:58.778475+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "12504482-719b-41bc-b754-97e33d61852b", "email": "thanhthain06@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-28 09:17:31.688894+00', '2026-03-28 09:28:58.793333+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', 'authenticated', 'authenticated', 'hoanglongsaomai8@gmail.com', '$2a$10$l8.8Nf4P53M36so7C/9X4eBRCIxVDv6xAnpdWA9t.4/zFHYzT85eu', '2026-03-19 02:10:44.399152+00', NULL, '', NULL, '', '2026-03-19 02:10:44.553108+00', '', '', NULL, '2026-03-19 02:11:14.993084+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "85fd2d59-fc3b-4f97-bf6e-861138d89d88", "email": "hoanglongsaomai8@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-19 02:10:44.270032+00', '2026-03-19 07:39:48.325804+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'eff865b7-be58-4ac8-9eeb-91bcb678d1e6', 'authenticated', 'authenticated', 'yen050391@gmail.com', '$2a$10$ukhAfCbRfU7dDdavHrBni.MPCek99efZNBEZf4tBgykWQeMFNgeO.', '2026-03-28 04:15:13.667679+00', NULL, '', NULL, 'pkce_26e30f5dbdec2aaf1a480d08a267b1554c8b15be140b758383cdb515', '2026-03-28 04:15:13.695629+00', '', '', NULL, '2026-03-28 04:15:13.672783+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "eff865b7-be58-4ac8-9eeb-91bcb678d1e6", "email": "yen050391@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-28 04:15:13.638501+00', '2026-03-28 04:15:15.322492+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '1c154887-9d93-4045-93c9-94f204c485d2', 'authenticated', 'authenticated', 'epsiloncryptoai@gmail.com', '$2a$10$CxGOlBGPQF6WWOCqwO8imec0NiHE.3NRGVPL5CVb8VqEWDo8bkjSC', '2026-03-21 09:35:54.916439+00', NULL, '', NULL, '', '2026-03-21 09:35:55.003231+00', '', '', NULL, '2026-03-21 09:36:34.256432+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "1c154887-9d93-4045-93c9-94f204c485d2", "email": "epsiloncryptoai@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-21 09:35:54.837931+00', '2026-03-26 07:00:34.617325+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '{"sub": "dfdf03f7-aec8-4080-bcd2-169e8c1d95ed", "email": "phanquochoipt@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-01-10 15:09:33.03557+00', '2026-01-10 15:09:33.035618+00', '2026-01-10 15:09:33.035618+00', 'f73f10f0-5932-4604-b534-2ec3e40c7d3d'),
	('8172a2c5-52b7-446c-8b2a-64ba98542a18', '8172a2c5-52b7-446c-8b2a-64ba98542a18', '{"sub": "8172a2c5-52b7-446c-8b2a-64ba98542a18", "email": "ngoctanphan02@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-12 02:54:53.335452+00', '2026-03-12 02:54:53.335503+00', '2026-03-12 02:54:53.335503+00', '6927d59f-ff98-4463-ab0c-85caf6f343fc'),
	('85fd2d59-fc3b-4f97-bf6e-861138d89d88', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', '{"sub": "85fd2d59-fc3b-4f97-bf6e-861138d89d88", "email": "hoanglongsaomai8@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-19 02:10:44.368852+00', '2026-03-19 02:10:44.368906+00', '2026-03-19 02:10:44.368906+00', '6ccd8224-ef47-408d-8331-f94e20c66125'),
	('1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', '{"sub": "1f7e5e98-b4e9-478c-beb1-e3ddc66cd875", "email": "akiracong@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-21 08:08:18.019604+00', '2026-03-21 08:08:18.019658+00', '2026-03-21 08:08:18.019658+00', 'f8f0a1f2-1ab4-437d-b617-1599932f28e5'),
	('1c154887-9d93-4045-93c9-94f204c485d2', '1c154887-9d93-4045-93c9-94f204c485d2', '{"sub": "1c154887-9d93-4045-93c9-94f204c485d2", "email": "epsiloncryptoai@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-21 09:35:54.898763+00', '2026-03-21 09:35:54.898813+00', '2026-03-21 09:35:54.898813+00', '37cd203d-9211-434c-89b1-f75bdfeb4601'),
	('8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '{"sub": "8f75d261-fd19-45e0-a9b0-e40fe02a2fb6", "email": "trandung233@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-24 08:52:49.321087+00', '2026-03-24 08:52:49.321141+00', '2026-03-24 08:52:49.321141+00', '88afd821-ead8-4644-8499-3f2ef85900c7'),
	('5296b70b-03bb-463b-853c-9ccff2697685', '5296b70b-03bb-463b-853c-9ccff2697685', '{"sub": "5296b70b-03bb-463b-853c-9ccff2697685", "email": "nguyenphuonghoang888@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-24 10:06:31.800724+00', '2026-03-24 10:06:31.800772+00', '2026-03-24 10:06:31.800772+00', '2770352b-3b4e-4e78-bc8e-84e22a8068fe'),
	('7c65c9b0-a62d-496e-a35a-f71f220c9546', '7c65c9b0-a62d-496e-a35a-f71f220c9546', '{"sub": "7c65c9b0-a62d-496e-a35a-f71f220c9546", "email": "test@test.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-25 02:20:53.801355+00', '2026-03-25 02:20:53.801401+00', '2026-03-25 02:20:53.801401+00', 'ca433e26-9012-43be-88db-2782d9f96a60'),
	('b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', '{"sub": "b5fd97d9-97ab-4a97-a7b6-ea9dcba22470", "email": "lamduy.action@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-25 16:27:02.820373+00', '2026-03-25 16:27:02.820423+00', '2026-03-25 16:27:02.820423+00', '4d9e32a5-aa74-4e64-bde1-bbf0cc26c680'),
	('baaf6f34-042d-468e-8913-080def59f6ea', 'baaf6f34-042d-468e-8913-080def59f6ea', '{"sub": "baaf6f34-042d-468e-8913-080def59f6ea", "email": "yen05031991@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-28 04:08:15.591493+00', '2026-03-28 04:08:15.591546+00', '2026-03-28 04:08:15.591546+00', 'fd806445-bb8f-431a-9325-d68ded9a21ac'),
	('eff865b7-be58-4ac8-9eeb-91bcb678d1e6', 'eff865b7-be58-4ac8-9eeb-91bcb678d1e6', '{"sub": "eff865b7-be58-4ac8-9eeb-91bcb678d1e6", "email": "yen050391@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-28 04:15:13.663441+00', '2026-03-28 04:15:13.663486+00', '2026-03-28 04:15:13.663486+00', '7262a8d3-fdb1-4ad8-b260-f6f492c49424'),
	('85155afe-ec56-471e-a0a1-3fbf58b972ac', '85155afe-ec56-471e-a0a1-3fbf58b972ac', '{"sub": "85155afe-ec56-471e-a0a1-3fbf58b972ac", "email": "manhhieu972000@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-28 05:08:36.069294+00', '2026-03-28 05:08:36.069355+00', '2026-03-28 05:08:36.069355+00', '88c7cedb-5f28-42b0-a35c-c545a1a743e7'),
	('12504482-719b-41bc-b754-97e33d61852b', '12504482-719b-41bc-b754-97e33d61852b', '{"sub": "12504482-719b-41bc-b754-97e33d61852b", "email": "thanhthain06@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-28 09:17:31.742793+00', '2026-03-28 09:17:31.742841+00', '2026-03-28 09:17:31.742841+00', '3af0dff7-2cea-471a-9444-1bcd3e12a8b3'),
	('285512e4-a8f3-4c2e-9402-824eacc1fd86', '285512e4-a8f3-4c2e-9402-824eacc1fd86', '{"sub": "285512e4-a8f3-4c2e-9402-824eacc1fd86", "email": "thunguyetdoan17081972@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-28 09:30:13.623767+00', '2026-03-28 09:30:13.624463+00', '2026-03-28 09:30:13.624463+00', '8b7c4d8d-e250-4a21-a690-1b62ffeacd7f'),
	('880025b6-0043-45ea-ad81-b035326d403f', '880025b6-0043-45ea-ad81-b035326d403f', '{"sub": "880025b6-0043-45ea-ad81-b035326d403f", "email": "trangiangha@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-28 14:22:43.590713+00', '2026-03-28 14:22:43.590768+00', '2026-03-28 14:22:43.590768+00', '7cb27711-cbdf-4eaa-88e6-0faa86f69c06');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('887ebea2-f956-4cd2-9388-3aaed9ad5dc7', 'baaf6f34-042d-468e-8913-080def59f6ea', '2026-03-28 04:23:32.664745+00', '2026-03-28 04:23:32.664745+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', '171.250.16.184', NULL, NULL, NULL, NULL, NULL),
	('db185ef5-af40-4f8b-bc3b-e98a1d8de042', '5296b70b-03bb-463b-853c-9ccff2697685', '2026-03-28 05:21:11.507285+00', '2026-03-28 05:21:11.507285+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '42.116.141.85', NULL, NULL, NULL, NULL, NULL),
	('da9e6395-702e-40c0-af15-1fad175d3e43', '7c65c9b0-a62d-496e-a35a-f71f220c9546', '2026-03-25 02:20:53.812944+00', '2026-03-25 02:20:53.812944+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '42.116.141.85', NULL, NULL, NULL, NULL, NULL),
	('19d13376-def6-4662-a3c2-00058bc77ce4', '285512e4-a8f3-4c2e-9402-824eacc1fd86', '2026-03-28 09:30:13.632372+00', '2026-03-28 09:30:13.632372+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/702 ZaloTheme/light ZaloLanguage/vn', '103.199.57.146', NULL, NULL, NULL, NULL, NULL),
	('3575aaee-960b-41ad-b8d0-8c69e5279007', '285512e4-a8f3-4c2e-9402-824eacc1fd86', '2026-03-28 09:32:48.069032+00', '2026-03-28 09:32:48.069032+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/702 ZaloTheme/light ZaloLanguage/vn', '103.199.57.146', NULL, NULL, NULL, NULL, NULL),
	('2644c8f4-ac85-45e8-a7a4-a8452c86b678', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '2026-03-24 08:53:17.78121+00', '2026-03-28 09:44:16.082866+00', NULL, 'aal1', NULL, '2026-03-28 09:44:16.082759', 'Next.js Middleware', '157.230.250.55', NULL, NULL, NULL, NULL, NULL),
	('921a4a4f-20c2-4851-a83d-8d4a45ff0268', '880025b6-0043-45ea-ad81-b035326d403f', '2026-03-28 14:22:43.637233+00', '2026-03-28 14:22:43.637233+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1', '42.116.141.85', NULL, NULL, NULL, NULL, NULL),
	('efc72be4-b6b2-42c4-a769-4df2be245cd2', '880025b6-0043-45ea-ad81-b035326d403f', '2026-03-28 14:23:17.215952+00', '2026-03-28 14:23:17.215952+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1', '42.116.141.85', NULL, NULL, NULL, NULL, NULL),
	('14e79ce2-3e2f-4df7-810e-3a019e5e0bbc', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '2026-03-24 08:52:49.364175+00', '2026-03-24 08:52:49.364175+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1', '113.185.76.234', NULL, NULL, NULL, NULL, NULL),
	('dd1c6b44-7373-4ef3-8fbf-b9c33d558604', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', '2026-03-21 08:08:18.068365+00', '2026-03-21 08:08:18.068365+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.40 Mobile/15E148 Safari/604.1', '27.65.22.201', NULL, NULL, NULL, NULL, NULL),
	('0309a85d-3c1f-49d4-874c-4e2f86c1d09a', 'eff865b7-be58-4ac8-9eeb-91bcb678d1e6', '2026-03-28 04:15:13.672865+00', '2026-03-28 04:15:13.672865+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', '171.250.16.184', NULL, NULL, NULL, NULL, NULL),
	('920eecf6-8cfe-4808-95ad-a5556d64c56f', '85155afe-ec56-471e-a0a1-3fbf58b972ac', '2026-03-28 05:08:36.085103+00', '2026-03-28 05:08:36.085103+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '104.28.159.45', NULL, NULL, NULL, NULL, NULL),
	('73773a0d-20ea-4c64-8639-335e875e94d1', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', '2026-03-25 16:27:34.068482+00', '2026-03-28 05:22:00.807087+00', NULL, 'aal1', NULL, '2026-03-28 05:22:00.806936', 'Next.js Middleware', '157.230.250.55', NULL, NULL, NULL, NULL, NULL),
	('ff7b78d0-36c4-4450-a61d-411c5ec59d7d', '12504482-719b-41bc-b754-97e33d61852b', '2026-03-28 09:28:58.780565+00', '2026-03-28 09:28:58.780565+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Linux; Android 15; SM-A145F Build/AP3A.240905.015.A2;) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.119 Mobile Safari/537.36 Zalo android/26031886 ZaloTheme/light ZaloLanguage/vi', '117.5.142.9', NULL, NULL, NULL, NULL, NULL),
	('b1825318-a2d3-457b-8144-021fcb2b8192', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', '2026-03-21 08:08:43.325503+00', '2026-03-22 02:35:55.09798+00', NULL, 'aal1', NULL, '2026-03-22 02:35:55.097127', 'Next.js Middleware', '157.230.250.55', NULL, NULL, NULL, NULL, NULL),
	('3c850de8-744f-449f-8883-3fd550be77af', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-28 11:39:33.160734+00', '2026-03-28 14:34:13.857835+00', NULL, 'aal1', NULL, '2026-03-28 14:34:13.857727', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '42.116.141.85', NULL, NULL, NULL, NULL, NULL),
	('948dc3c7-4c6a-4ff9-845e-a8735fe397bd', '8172a2c5-52b7-446c-8b2a-64ba98542a18', '2026-03-14 06:47:38.264293+00', '2026-03-14 17:36:13.111196+00', NULL, 'aal1', NULL, '2026-03-14 17:36:13.110419', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '117.5.143.37', NULL, NULL, NULL, NULL, NULL),
	('e62928f1-af6b-4c16-bac7-660efb145cfa', '85155afe-ec56-471e-a0a1-3fbf58b972ac', '2026-03-28 05:08:56.112594+00', '2026-03-28 15:38:17.84152+00', NULL, 'aal1', NULL, '2026-03-28 15:38:17.841412', 'Next.js Middleware', '157.230.250.55', NULL, NULL, NULL, NULL, NULL),
	('50767a57-7445-4a4e-afe4-cf714588166e', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', '2026-03-19 02:10:44.426895+00', '2026-03-19 02:10:44.426895+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '58.186.196.215', NULL, NULL, NULL, NULL, NULL),
	('2af52718-60ff-4025-8625-451d801ef50f', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', '2026-03-19 02:11:14.993174+00', '2026-03-19 07:39:48.328538+00', NULL, 'aal1', NULL, '2026-03-19 07:39:48.328435', 'Next.js Middleware', '74.220.52.1', NULL, NULL, NULL, NULL, NULL),
	('3037d897-8418-41d6-b87d-18edc9d6f4dd', '8172a2c5-52b7-446c-8b2a-64ba98542a18', '2026-03-13 10:30:08.850563+00', '2026-03-23 01:55:34.705936+00', NULL, 'aal1', NULL, '2026-03-23 01:55:34.70583', 'Next.js Middleware', '157.230.250.55', NULL, NULL, NULL, NULL, NULL),
	('903c71e6-e1be-4e07-af39-ccd4a12cd31e', '5296b70b-03bb-463b-853c-9ccff2697685', '2026-03-24 10:06:31.830172+00', '2026-03-24 10:06:31.830172+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1', '104.28.38.130', NULL, NULL, NULL, NULL, NULL),
	('6a17546f-2764-4727-b01a-4200b2faaa2e', '5296b70b-03bb-463b-853c-9ccff2697685', '2026-03-24 10:06:53.582145+00', '2026-03-24 10:06:53.582145+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1', '104.28.71.165', NULL, NULL, NULL, NULL, NULL),
	('10d5df4e-3817-4f4e-a21f-59b03c10489b', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', '2026-03-25 16:27:02.844067+00', '2026-03-25 16:27:02.844067+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '1.54.120.214', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('14e79ce2-3e2f-4df7-810e-3a019e5e0bbc', '2026-03-24 08:52:49.423482+00', '2026-03-24 08:52:49.423482+00', 'password', '2e163db9-e630-4966-a860-5c99b528474d'),
	('2644c8f4-ac85-45e8-a7a4-a8452c86b678', '2026-03-24 08:53:17.823457+00', '2026-03-24 08:53:17.823457+00', 'otp', '2b1d97ca-65ab-43f3-bd75-382d65a1b71b'),
	('903c71e6-e1be-4e07-af39-ccd4a12cd31e', '2026-03-24 10:06:31.875385+00', '2026-03-24 10:06:31.875385+00', 'password', 'a00b6be3-ad54-47ff-abf5-e284ed06cd47'),
	('6a17546f-2764-4727-b01a-4200b2faaa2e', '2026-03-24 10:06:53.585319+00', '2026-03-24 10:06:53.585319+00', 'otp', 'aac94750-0ce4-42a8-8ac0-b36c04c5f7c2'),
	('da9e6395-702e-40c0-af15-1fad175d3e43', '2026-03-25 02:20:53.824156+00', '2026-03-25 02:20:53.824156+00', 'password', '9c43bd46-02eb-4c5f-8804-1674a8d40c47'),
	('10d5df4e-3817-4f4e-a21f-59b03c10489b', '2026-03-25 16:27:02.879644+00', '2026-03-25 16:27:02.879644+00', 'password', '5ccf63f2-14eb-4f78-a367-b59057761c7e'),
	('73773a0d-20ea-4c64-8639-335e875e94d1', '2026-03-25 16:27:34.071755+00', '2026-03-25 16:27:34.071755+00', 'otp', 'e27c5085-c0f9-4698-83e9-2ce89e99065d'),
	('0309a85d-3c1f-49d4-874c-4e2f86c1d09a', '2026-03-28 04:15:13.682012+00', '2026-03-28 04:15:13.682012+00', 'password', '1d523d09-53de-42fa-893b-01902e759f25'),
	('887ebea2-f956-4cd2-9388-3aaed9ad5dc7', '2026-03-28 04:23:32.693843+00', '2026-03-28 04:23:32.693843+00', 'otp', 'eb68a482-bf8a-4494-aa08-982d1546be02'),
	('920eecf6-8cfe-4808-95ad-a5556d64c56f', '2026-03-28 05:08:36.101229+00', '2026-03-28 05:08:36.101229+00', 'password', 'f8c6c812-6556-42b6-99dd-97ca911d19f8'),
	('e62928f1-af6b-4c16-bac7-660efb145cfa', '2026-03-28 05:08:56.114809+00', '2026-03-28 05:08:56.114809+00', 'otp', 'f2d2bf4c-7a6d-4235-94a6-d103dc43e850'),
	('db185ef5-af40-4f8b-bc3b-e98a1d8de042', '2026-03-28 05:21:11.538396+00', '2026-03-28 05:21:11.538396+00', 'otp', 'c314b6bc-d246-4071-9d34-c27b2d165c68'),
	('ff7b78d0-36c4-4450-a61d-411c5ec59d7d', '2026-03-28 09:28:58.793839+00', '2026-03-28 09:28:58.793839+00', 'otp', '0c0b0454-c425-413d-9341-0ac2f972acc9'),
	('19d13376-def6-4662-a3c2-00058bc77ce4', '2026-03-28 09:30:13.635522+00', '2026-03-28 09:30:13.635522+00', 'password', '1489a9b5-2f2a-4b80-ab8e-eea69f5c7712'),
	('3575aaee-960b-41ad-b8d0-8c69e5279007', '2026-03-28 09:32:48.093395+00', '2026-03-28 09:32:48.093395+00', 'otp', 'f52cf633-b009-4f39-941c-e76b8aa3af1c'),
	('3c850de8-744f-449f-8883-3fd550be77af', '2026-03-28 11:39:33.209429+00', '2026-03-28 11:39:33.209429+00', 'otp', '1b665fba-e7ba-40c7-b0cb-9beebbedeefa'),
	('921a4a4f-20c2-4851-a83d-8d4a45ff0268', '2026-03-28 14:22:43.694461+00', '2026-03-28 14:22:43.694461+00', 'password', 'eefb3ee2-9f62-451a-b474-adf570be3a50'),
	('efc72be4-b6b2-42c4-a769-4df2be245cd2', '2026-03-28 14:23:17.219291+00', '2026-03-28 14:23:17.219291+00', 'otp', '360a9950-9727-4664-a142-14ddba7802f8'),
	('3037d897-8418-41d6-b87d-18edc9d6f4dd', '2026-03-13 10:30:08.861754+00', '2026-03-13 10:30:08.861754+00', 'otp', '56b9bd00-677a-4590-a8ad-7184824a0b88'),
	('948dc3c7-4c6a-4ff9-845e-a8735fe397bd', '2026-03-14 06:47:38.306243+00', '2026-03-14 06:47:38.306243+00', 'otp', '664d417b-60ae-469b-aa70-fcb2422ef053'),
	('50767a57-7445-4a4e-afe4-cf714588166e', '2026-03-19 02:10:44.497394+00', '2026-03-19 02:10:44.497394+00', 'password', 'ea17b1f3-7968-43c4-88d7-3e137a55db1b'),
	('2af52718-60ff-4025-8625-451d801ef50f', '2026-03-19 02:11:14.998507+00', '2026-03-19 02:11:14.998507+00', 'otp', 'e70af40b-fe13-4d03-b632-bed5b0681238'),
	('dd1c6b44-7373-4ef3-8fbf-b9c33d558604', '2026-03-21 08:08:18.131495+00', '2026-03-21 08:08:18.131495+00', 'password', '9e86d0f7-5545-40bd-b925-d32ab6a1ffdc'),
	('b1825318-a2d3-457b-8144-021fcb2b8192', '2026-03-21 08:08:43.328152+00', '2026-03-21 08:08:43.328152+00', 'otp', '3711a7d9-ab59-4e7c-827b-6c8c3c540f50');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('550d764a-c3fe-4eed-9b51-166ff7674821', 'eff865b7-be58-4ac8-9eeb-91bcb678d1e6', 'recovery_token', 'pkce_26e30f5dbdec2aaf1a480d08a267b1554c8b15be140b758383cdb515', 'yen050391@gmail.com', '2026-03-28 04:15:15.32474', '2026-03-28 04:15:15.32474');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 224, 'ikhgubauyji7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', true, '2026-03-28 11:39:33.178046+00', '2026-03-28 12:37:43.846079+00', NULL, '3c850de8-744f-449f-8883-3fd550be77af'),
	('00000000-0000-0000-0000-000000000000', 163, 'w26hcoyamezz', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-22 09:22:37.098662+00', '2026-03-22 10:21:04.915317+00', 'glg2uljwluu4', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 226, '4zosml7zrh5d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', true, '2026-03-28 13:35:45.222592+00', '2026-03-28 14:34:13.83322+00', '77papv4y5tab', '3c850de8-744f-449f-8883-3fd550be77af'),
	('00000000-0000-0000-0000-000000000000', 165, '56xhdvuhunrn', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-22 10:21:04.916763+00', '2026-03-23 01:55:34.648785+00', 'w26hcoyamezz', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 167, 'a5hkyvikyw2h', '8172a2c5-52b7-446c-8b2a-64ba98542a18', false, '2026-03-23 01:55:34.674671+00', '2026-03-23 01:55:34.674671+00', '56xhdvuhunrn', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 169, 'dzp2fq2etmg4', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', false, '2026-03-24 08:52:49.391487+00', '2026-03-24 08:52:49.391487+00', NULL, '14e79ce2-3e2f-4df7-810e-3a019e5e0bbc'),
	('00000000-0000-0000-0000-000000000000', 229, '37hhwklpdxey', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', false, '2026-03-28 14:34:13.841661+00', '2026-03-28 14:34:13.841661+00', '4zosml7zrh5d', '3c850de8-744f-449f-8883-3fd550be77af'),
	('00000000-0000-0000-0000-000000000000', 170, 'cxgqdnwwmesr', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', true, '2026-03-24 08:53:17.80317+00', '2026-03-24 10:08:34.106098+00', NULL, '2644c8f4-ac85-45e8-a7a4-a8452c86b678'),
	('00000000-0000-0000-0000-000000000000', 173, 't3rfwlk7gvn6', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', true, '2026-03-24 10:08:34.111063+00', '2026-03-24 23:15:40.374036+00', 'cxgqdnwwmesr', '2644c8f4-ac85-45e8-a7a4-a8452c86b678'),
	('00000000-0000-0000-0000-000000000000', 133, 'm4kcpzvewjbm', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-14 15:16:43.529278+00', '2026-03-14 16:16:49.678179+00', 'cplpr3h5sdmr', '948dc3c7-4c6a-4ff9-845e-a8735fe397bd'),
	('00000000-0000-0000-0000-000000000000', 135, 'hzi4ys7t3lsh', '8172a2c5-52b7-446c-8b2a-64ba98542a18', false, '2026-03-14 17:36:13.077851+00', '2026-03-14 17:36:13.077851+00', '7ujlzqpivepv', '948dc3c7-4c6a-4ff9-845e-a8735fe397bd'),
	('00000000-0000-0000-0000-000000000000', 137, 'gbfjopnwo2f5', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', false, '2026-03-19 02:10:44.464835+00', '2026-03-19 02:10:44.464835+00', NULL, '50767a57-7445-4a4e-afe4-cf714588166e'),
	('00000000-0000-0000-0000-000000000000', 138, 'eztxaqqrm7st', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', true, '2026-03-19 02:11:14.994018+00', '2026-03-19 07:39:48.321769+00', NULL, '2af52718-60ff-4025-8625-451d801ef50f'),
	('00000000-0000-0000-0000-000000000000', 140, 'osuhrgcgvd7g', '85fd2d59-fc3b-4f97-bf6e-861138d89d88', false, '2026-03-19 07:39:48.323282+00', '2026-03-19 07:39:48.323282+00', 'eztxaqqrm7st', '2af52718-60ff-4025-8625-451d801ef50f'),
	('00000000-0000-0000-0000-000000000000', 151, 'kzl5cnhwlqza', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-21 15:57:10.80759+00', '2026-03-22 05:09:58.12394+00', 'krqezbqnm6y5', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 159, '5ny7jx4pjzpm', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-22 05:09:58.140088+00', '2026-03-22 06:08:00.468872+00', 'kzl5cnhwlqza', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 161, 'lqortlvncf3x', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-22 07:06:30.719707+00', '2026-03-22 08:04:42.849365+00', 'a65pmwfms2es', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 177, 'ksopndk4cap2', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', true, '2026-03-25 03:39:19.542276+00', '2026-03-28 04:15:03.524118+00', '2pb5gj5a2bdx', '2644c8f4-ac85-45e8-a7a4-a8452c86b678'),
	('00000000-0000-0000-0000-000000000000', 205, '6vs3t7wvxgzm', 'eff865b7-be58-4ac8-9eeb-91bcb678d1e6', false, '2026-03-28 04:15:13.678562+00', '2026-03-28 04:15:13.678562+00', NULL, '0309a85d-3c1f-49d4-874c-4e2f86c1d09a'),
	('00000000-0000-0000-0000-000000000000', 211, 'vjqiki5grwoc', '5296b70b-03bb-463b-853c-9ccff2697685', false, '2026-03-28 05:21:11.51791+00', '2026-03-28 05:21:11.51791+00', NULL, 'db185ef5-af40-4f8b-bc3b-e98a1d8de042'),
	('00000000-0000-0000-0000-000000000000', 219, 'un5qd5g7u4yf', '12504482-719b-41bc-b754-97e33d61852b', false, '2026-03-28 09:28:58.78541+00', '2026-03-28 09:28:58.78541+00', NULL, 'ff7b78d0-36c4-4450-a61d-411c5ec59d7d'),
	('00000000-0000-0000-0000-000000000000', 222, 'akxrh3zz26x7', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', false, '2026-03-28 09:44:16.039752+00', '2026-03-28 09:44:16.039752+00', 'zdfzbksa3362', '2644c8f4-ac85-45e8-a7a4-a8452c86b678'),
	('00000000-0000-0000-0000-000000000000', 162, 'glg2uljwluu4', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-22 08:04:42.864269+00', '2026-03-22 09:22:37.077266+00', 'lqortlvncf3x', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 225, '77papv4y5tab', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', true, '2026-03-28 12:37:43.888996+00', '2026-03-28 13:35:45.196739+00', 'ikhgubauyji7', '3c850de8-744f-449f-8883-3fd550be77af'),
	('00000000-0000-0000-0000-000000000000', 227, 'idi34tdnc5bk', '880025b6-0043-45ea-ad81-b035326d403f', false, '2026-03-28 14:22:43.668209+00', '2026-03-28 14:22:43.668209+00', NULL, '921a4a4f-20c2-4851-a83d-8d4a45ff0268'),
	('00000000-0000-0000-0000-000000000000', 228, 'yuklunks5car', '880025b6-0043-45ea-ad81-b035326d403f', false, '2026-03-28 14:23:17.217511+00', '2026-03-28 14:23:17.217511+00', NULL, 'efc72be4-b6b2-42c4-a769-4df2be245cd2'),
	('00000000-0000-0000-0000-000000000000', 210, 'pwd476ucqgyz', '85155afe-ec56-471e-a0a1-3fbf58b972ac', true, '2026-03-28 05:08:56.113512+00', '2026-03-28 15:38:17.786158+00', NULL, 'e62928f1-af6b-4c16-bac7-660efb145cfa'),
	('00000000-0000-0000-0000-000000000000', 171, 'fsznh4ywsyvw', '5296b70b-03bb-463b-853c-9ccff2697685', false, '2026-03-24 10:06:31.855808+00', '2026-03-24 10:06:31.855808+00', NULL, '903c71e6-e1be-4e07-af39-ccd4a12cd31e'),
	('00000000-0000-0000-0000-000000000000', 172, 'twmsnuwspaif', '5296b70b-03bb-463b-853c-9ccff2697685', false, '2026-03-24 10:06:53.583532+00', '2026-03-24 10:06:53.583532+00', NULL, '6a17546f-2764-4727-b01a-4200b2faaa2e'),
	('00000000-0000-0000-0000-000000000000', 230, '4h3tuxwf342s', '85155afe-ec56-471e-a0a1-3fbf58b972ac', false, '2026-03-28 15:38:17.806567+00', '2026-03-28 15:38:17.806567+00', 'pwd476ucqgyz', 'e62928f1-af6b-4c16-bac7-660efb145cfa'),
	('00000000-0000-0000-0000-000000000000', 176, 'qwgsa7v7hhzy', '7c65c9b0-a62d-496e-a35a-f71f220c9546', false, '2026-03-25 02:20:53.820359+00', '2026-03-25 02:20:53.820359+00', NULL, 'da9e6395-702e-40c0-af15-1fad175d3e43'),
	('00000000-0000-0000-0000-000000000000', 132, 'cplpr3h5sdmr', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-14 06:47:38.280205+00', '2026-03-14 15:16:43.503063+00', NULL, '948dc3c7-4c6a-4ff9-845e-a8735fe397bd'),
	('00000000-0000-0000-0000-000000000000', 174, '2pb5gj5a2bdx', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', true, '2026-03-24 23:15:40.405139+00', '2026-03-25 03:39:19.512099+00', 't3rfwlk7gvn6', '2644c8f4-ac85-45e8-a7a4-a8452c86b678'),
	('00000000-0000-0000-0000-000000000000', 134, '7ujlzqpivepv', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-14 16:16:49.691834+00', '2026-03-14 17:36:13.047804+00', 'm4kcpzvewjbm', '948dc3c7-4c6a-4ff9-845e-a8735fe397bd'),
	('00000000-0000-0000-0000-000000000000', 129, 'jva7hqiaay54', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-13 10:30:08.858722+00', '2026-03-16 02:00:52.115528+00', NULL, '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 136, 'mztkdhqpmdan', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-16 02:00:52.151904+00', '2026-03-19 07:34:36.043324+00', 'jva7hqiaay54', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 139, 'gzgpjfskoqas', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-19 07:34:36.064166+00', '2026-03-20 04:01:22.451707+00', 'mztkdhqpmdan', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 180, '4jqphdobte57', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', false, '2026-03-25 16:27:02.867286+00', '2026-03-25 16:27:02.867286+00', NULL, '10d5df4e-3817-4f4e-a21f-59b03c10489b'),
	('00000000-0000-0000-0000-000000000000', 143, 'u2pip25ritrs', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', false, '2026-03-21 08:08:18.103145+00', '2026-03-21 08:08:18.103145+00', NULL, 'dd1c6b44-7373-4ef3-8fbf-b9c33d558604'),
	('00000000-0000-0000-0000-000000000000', 141, 'ik6s33havq35', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-20 04:01:22.485117+00', '2026-03-21 13:04:51.737711+00', 'gzgpjfskoqas', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 150, 'krqezbqnm6y5', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-21 13:04:51.763735+00', '2026-03-21 15:57:10.723208+00', 'ik6s33havq35', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 181, 'e7sx2jut2qcc', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', true, '2026-03-25 16:27:34.069908+00', '2026-03-26 06:56:12.761877+00', NULL, '73773a0d-20ea-4c64-8639-335e875e94d1'),
	('00000000-0000-0000-0000-000000000000', 144, '2ccfugeho3rh', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', true, '2026-03-21 08:08:43.326887+00', '2026-03-22 02:35:55.046705+00', NULL, 'b1825318-a2d3-457b-8144-021fcb2b8192'),
	('00000000-0000-0000-0000-000000000000', 158, 'wmhhcyejh3b3', '1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', false, '2026-03-22 02:35:55.064054+00', '2026-03-22 02:35:55.064054+00', '2ccfugeho3rh', 'b1825318-a2d3-457b-8144-021fcb2b8192'),
	('00000000-0000-0000-0000-000000000000', 160, 'a65pmwfms2es', '8172a2c5-52b7-446c-8b2a-64ba98542a18', true, '2026-03-22 06:08:00.492557+00', '2026-03-22 07:06:30.689989+00', '5ny7jx4pjzpm', '3037d897-8418-41d6-b87d-18edc9d6f4dd'),
	('00000000-0000-0000-0000-000000000000', 206, 'dkdsxn75famp', 'baaf6f34-042d-468e-8913-080def59f6ea', false, '2026-03-28 04:23:32.68023+00', '2026-03-28 04:23:32.68023+00', NULL, '887ebea2-f956-4cd2-9388-3aaed9ad5dc7'),
	('00000000-0000-0000-0000-000000000000', 209, 'yp6kxef6obl4', '85155afe-ec56-471e-a0a1-3fbf58b972ac', false, '2026-03-28 05:08:36.097916+00', '2026-03-28 05:08:36.097916+00', NULL, '920eecf6-8cfe-4808-95ad-a5556d64c56f'),
	('00000000-0000-0000-0000-000000000000', 190, 'zhbajrh4mlac', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', true, '2026-03-26 06:56:12.78419+00', '2026-03-28 05:22:00.797423+00', 'e7sx2jut2qcc', '73773a0d-20ea-4c64-8639-335e875e94d1'),
	('00000000-0000-0000-0000-000000000000', 212, 'ymmdwobm2xwl', 'b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', false, '2026-03-28 05:22:00.802421+00', '2026-03-28 05:22:00.802421+00', 'zhbajrh4mlac', '73773a0d-20ea-4c64-8639-335e875e94d1'),
	('00000000-0000-0000-0000-000000000000', 220, 'yfjobvcktkq2', '285512e4-a8f3-4c2e-9402-824eacc1fd86', false, '2026-03-28 09:30:13.633584+00', '2026-03-28 09:30:13.633584+00', NULL, '19d13376-def6-4662-a3c2-00058bc77ce4'),
	('00000000-0000-0000-0000-000000000000', 221, 'q3w77dhc4yo3', '285512e4-a8f3-4c2e-9402-824eacc1fd86', false, '2026-03-28 09:32:48.078208+00', '2026-03-28 09:32:48.078208+00', NULL, '3575aaee-960b-41ad-b8d0-8c69e5279007'),
	('00000000-0000-0000-0000-000000000000', 204, 'zdfzbksa3362', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', true, '2026-03-28 04:15:03.530335+00', '2026-03-28 09:44:16.019009+00', 'ksopndk4cap2', '2644c8f4-ac85-45e8-a7a4-a8452c86b678');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: admin_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."admin_preferences" ("user_id", "email_notifications", "in_app_sound", "created_at", "updated_at") VALUES
	('dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '{"alerts": true, "orders": true, "withdrawals": true}', true, '2026-01-14 13:28:45.777186+00', '2026-01-14 22:40:19.667791+00');


--
-- Data for Name: lots; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lots" ("id", "name", "region", "description", "location_lat", "location_lng", "total_trees", "created_at", "updated_at", "planted") VALUES
	('11111111-1111-1111-1111-111111111111', 'Lo Test Notification', 'Dong Nai', 'Test lot for notification system', NULL, NULL, 9, '2026-01-11 02:17:45.326374+00', '2026-01-11 02:17:45.326374+00', 9),
	('22222222-2222-2222-2222-222222222222', 'Lo Thu Nghiem B', 'Binh Phuoc', 'Lo test thu 2', NULL, NULL, 150, '2026-01-11 02:29:07.033928+00', '2026-01-11 02:29:07.033928+00', 25);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."orders" ("id", "code", "user_id", "quantity", "total_amount", "payment_method", "status", "created_at", "updated_at", "tree_status", "planted_at", "lot_id", "latest_photo_url", "co2_absorbed", "order_code", "contract_url", "referred_by", "user_email", "user_name") VALUES
	('da8ce255-87b8-4743-a7ec-df808319e7bf', 'DHHBDPTA', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 1, 260000, 'banking', 'cancelled', '2026-03-28 11:54:32.48581+00', '2026-03-28 11:54:33.717647+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('e7de009e-57d3-4e10-a656-abf5a24fe477', 'DHEQWYZM', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 1, 260000, 'banking', 'cancelled', '2026-03-28 11:54:35.408657+00', '2026-03-28 11:54:35.836637+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('45725e17-8972-4bc8-9f06-feb6ed9c0163', 'DHLS8MH9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 1, 260000, 'banking', 'cancelled', '2026-03-28 11:54:36.219246+00', '2026-03-28 12:01:58.103441+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('0cc6ed91-9c67-49d9-bc25-28c22f2fcbb0', 'DHVLLC13', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 10, 2600000, 'banking', 'cancelled', '2026-03-28 12:01:59.627384+00', '2026-03-28 12:02:00.066321+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('d7e2e40e-4f71-47a7-a082-98a2246eac38', 'DHHU025M', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 10, 2600000, 'banking', 'cancelled', '2026-03-28 12:02:01.25873+00', '2026-03-28 12:02:01.662608+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('ad8ad0ab-dba1-4dbd-8f9b-de06e6015d0c', 'DH5F4MAX', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 10, 2600000, 'banking', 'cancelled', '2026-03-28 12:02:04.025021+00', '2026-03-28 12:12:05.102814+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('2f30b26f-df7b-445e-9ec9-a41c9a178dbc', 'DHH2QQJM', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 1, 260000, 'banking', 'pending', '2026-03-28 12:12:10.07693+00', '2026-03-28 12:12:10.07693+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('7bd202fe-1f1f-49e2-8d79-32ae47930df2', 'DHY0MJBQ', '880025b6-0043-45ea-ad81-b035326d403f', 1, 260000, 'banking', 'completed', '2026-03-28 14:46:27.332345+00', '2026-03-28 14:46:27.332345+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL),
	('d873f8ad-9d50-4084-acad-cc77e405ec38', 'DHHCH1T1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 1, 260000, 'banking', 'cancelled', '2026-03-28 11:54:34.177572+00', '2026-03-28 11:54:34.977253+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('c5e81182-89bf-44e9-a451-1f636ec1b44b', 'DH0RC00K', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 10, 2600000, 'banking', 'cancelled', '2026-03-28 12:01:58.495994+00', '2026-03-28 12:01:59.244663+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('bf628ae7-6c95-46fe-9d14-667ec73de4f7', 'DHZJA6SD', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 10, 2600000, 'banking', 'cancelled', '2026-03-28 12:02:00.409846+00', '2026-03-28 12:02:00.87458+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('f7e0698d-3bf6-4cd8-a7ea-fd7b2663e4f8', 'DHDSA6GE', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 10, 2600000, 'banking', 'cancelled', '2026-03-28 12:02:01.996128+00', '2026-03-28 12:02:02.857498+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('419dc3d7-0d58-4972-b052-3c9e08a021c1', 'DH5U9SWP', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 10, 2600000, 'banking', 'cancelled', '2026-03-28 12:02:03.211424+00', '2026-03-28 12:02:03.66627+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('456443e3-9201-473e-a454-cc17d61d740d', 'DHMY78Y6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 1, 260000, 'banking', 'pending', '2026-03-28 12:12:10.382732+00', '2026-03-28 12:12:10.382732+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'phanquochoipt@gmail.com', 'phanquochoipt'),
	('d2b0e40d-1eff-45c1-9f1a-4f2d26d4b386', 'DH1ZZTHM', '5296b70b-03bb-463b-853c-9ccff2697685', 1, 260000, 'banking', 'completed', '2026-03-28 14:52:27.960631+00', '2026-03-28 14:52:27.960631+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL),
	('85ff9ecf-482d-4482-9f7f-84b844cbbb89', 'DHE6MDDH', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', 5, 1300000, 'banking', 'completed', '2026-03-24 08:54:33.663263+00', '2026-03-24 08:54:33.663263+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL),
	('f41b0622-8a58-4a32-80de-95ab397c56be', 'DH203F89', 'baaf6f34-042d-468e-8913-080def59f6ea', 10, 2600000, 'banking', 'completed', '2026-03-28 10:11:31.650098+00', '2026-03-28 10:11:31.650098+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', 'yen05031991@gmail.com', NULL),
	('52273e22-c33a-40e2-98b6-9706e9333af1', 'DHYQ4OK1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 100, 26000000, 'banking', 'completed', '2026-03-25 15:58:20.757629+00', '2026-03-28 10:28:26.208133+00', 'pending', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: casso_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."casso_transactions" ("id", "casso_id", "casso_tid", "amount", "description", "bank_account", "transaction_at", "raw_payload", "status", "note", "order_id", "created_at") VALUES
	('5a5825c3-c9fb-4760-b42c-80b6086b0552', 1, 'test123', 100000, 'test', 'test', '2026-03-28 10:00:00+00', '{"id": 1, "tid": "test123", "type": 1, "when": "2026-03-28T10:00:00Z", "amount": 100000, "description": "test", "bank_sub_acc_id": "test"}', 'no_match', 'orderCode not found in description', NULL, '2026-03-28 10:25:52.48705+00'),
	('527aee0a-71fb-4ca0-bd0e-1d7c4552bfcf', NULL, '999', 100000, 'test', '771368999999', '2026-03-28 10:00:00+00', '{"tid": 999, "type": 2, "when": "2026-03-28 10:00:00", "amount": 100000, "description": "test", "bank_sub_acc_id": "771368999999"}', 'no_match', 'Outgoing transaction ignored', NULL, '2026-03-28 10:50:27.022144+00');


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."email_logs" ("id", "order_id", "email_type", "recipient", "status", "resend_id", "error_message", "sent_at", "created_at") VALUES
	('3ae03060-a00b-40a8-aea3-1546306a862b', '88def0d3-bc17-4b94-8e71-6b47ed7b50f6', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'b7c539ad-be24-4d6a-9552-87e2deb08014', NULL, '2026-01-11 00:09:30.772+00', '2026-01-11 00:09:30.999428+00'),
	('43a13aad-31ee-4e5f-9feb-f34dab5a4a40', 'ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'dd2c84a0-6e59-4921-aac9-34669729b6ff', NULL, '2026-01-11 00:33:42.073+00', '2026-01-11 00:33:42.2838+00'),
	('60c10459-9fb8-4a56-80de-4d7bb01419ca', 'fa36f511-85ea-411e-873d-40eb5a161e0e', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'aed1fcd2-561e-49a8-92e6-0a650fc4d053', NULL, '2026-01-11 08:22:52.855+00', '2026-01-11 08:22:53.0561+00'),
	('5a1b1dc9-89bd-42c9-aebf-1553c27decb7', '543044d9-745f-479a-a17c-2a60ba130645', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', '4bcd76d5-4193-4375-8a5c-bcb46302e0e1', NULL, '2026-01-11 09:11:43.082+00', '2026-01-11 09:11:43.305197+00'),
	('98a2138a-04f8-407a-9924-2a7ec45fcf79', '17df7f92-bbde-4ccb-8359-a42cf9ac5532', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'e4fad430-f992-4bd7-815c-d0c3e808d407', NULL, '2026-01-11 13:47:08.037+00', '2026-01-11 13:47:08.266355+00'),
	('ff84fc1d-5c66-4015-969a-f25b8d2dc36a', '9fcd4d4f-6e04-41cd-86f3-e34c35f13178', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', '2b3df96f-57f5-4dc8-9f2b-e35f5ba71603', NULL, '2026-01-13 06:09:28.065+00', '2026-01-13 06:09:28.133429+00'),
	('9b2bab79-1079-4618-a6cb-e453be9888d8', 'e928f1d1-bd06-4c03-a029-1c8e85f71790', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'be9a7990-170e-4e34-8c10-7f75e16c9e1d', NULL, '2026-01-13 06:16:14.649+00', '2026-01-13 06:16:14.736383+00'),
	('5698ef0c-8cd4-4614-b1e1-3b28811a7393', '2573db80-bebc-46f3-a987-84c13e1fa964', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'f13ef42a-ec8d-425b-be5e-090f21207da8', NULL, '2026-01-13 23:17:03.808+00', '2026-01-13 23:17:04.038329+00'),
	('45a64bca-ef78-4f4f-ae5d-99fef78657eb', '31c688d3-7270-4665-9b32-d9358c3ec03f', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', '1df2f211-d4d7-4f94-9d21-c84e5b8bfedd', NULL, '2026-01-14 00:15:14.264+00', '2026-01-14 00:15:14.60007+00'),
	('06ca2aec-8b64-468e-8681-e13219c65eca', '954f1b23-d00f-4ed4-833d-a5d921506e18', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'ca2cbecd-d429-4c58-b84c-8a16424862f8', NULL, '2026-01-14 00:23:13.192+00', '2026-01-14 00:23:13.351948+00'),
	('c32dcf18-058d-49c2-b211-1d36b600aa1f', '185f2d3c-5139-474a-a046-dfc34f2d9941', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'd5348d1c-f6a3-491c-8b19-16e42c865288', NULL, '2026-01-14 00:46:32.315+00', '2026-01-14 00:46:32.537125+00'),
	('38d93a3c-0bd3-4459-8de2-01e01a9efde7', 'e88da3b6-9eed-4849-b73e-1209cd9b7e7b', 'withdrawal_notification', 'test_debug_uuid_hack@gmail.com', 'sent', 'test_id_uuid_hack', NULL, '2026-01-14 12:45:03.823+00', '2026-01-14 12:45:04.193883+00'),
	('39949332-2260-4486-a4a4-57f63ac44a69', 'e88da3b6-9eed-4849-b73e-1209cd9b7e7b', 'withdrawal_notification', 'dainganxanh_test@gmail.com', 'sent', '07975f65-b9dc-43b9-bb91-677727e4e29f', NULL, '2026-01-14 12:45:50.242+00', '2026-01-14 12:45:50.683937+00'),
	('4c337e5c-164d-49d9-988f-aed92c349863', '9093a1f1-0859-499f-b8af-03ce19f02e5e', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'fb275840-c6a4-415c-96e3-170d5d5ee044', NULL, '2026-01-14 13:02:14.523+00', '2026-01-14 13:02:14.743162+00'),
	('69083f0b-8b5a-441f-9396-1f0516d4d303', '14b53aec-a7e1-4a8d-aa2d-16c06913b268', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', '188640c3-8f84-465c-9a5d-53bb5d24c47a', NULL, '2026-01-22 06:54:37.769+00', '2026-01-22 06:54:38.033599+00'),
	('b919327c-477e-4fc3-b596-cc6a7116dd3d', '9093a1f1-0859-499f-b8af-03ce19f02e5e', 'tree_assignment', 'phanquochoipt@gmail.com', 'sent', 'b40eba42-9693-4823-9fc8-ed4303e4bf38', NULL, '2026-01-22 07:01:31.508+00', '2026-01-22 07:01:32.065832+00'),
	('7b63bf3b-0541-4e04-8566-3719437a87e5', '5bb2873e-4e2e-41e8-b9ae-f469727e3db3', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', '60d71c56-4da4-48df-a97f-51ea635af81c', NULL, '2026-02-07 05:11:50.616+00', '2026-02-07 05:11:50.625473+00'),
	('f08870ad-c8d1-4383-b04d-df102f1319d5', 'dd0e5560-d141-41d3-8971-d9f3cd7552cb', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', 'ec2a0c8f-a3ab-4ebf-a564-a157a183ff40', NULL, '2026-02-08 05:22:28.681+00', '2026-02-08 05:22:28.740315+00'),
	('8fd43955-467e-46ba-9fbb-59a40b9e2dac', '3a431b75-7be5-4977-88e9-a4d1de02bc3e', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', '453d4df4-f173-4ed6-8696-2a7a39899bd8', NULL, '2026-03-07 13:58:51.386+00', '2026-03-07 13:58:51.404226+00'),
	('c03fc605-1d9f-4e95-a742-8fb3a99be95d', 'cc4886a9-2306-4c8d-a0f5-969772f520c5', 'order_confirmation', 'ngoctanphan02@gmail.com', 'sent', 'dcf56005-ef46-4a34-a74f-a8f3b3e53c39', NULL, '2026-03-12 02:55:36.604+00', '2026-03-12 02:55:36.663894+00'),
	('fe2c1e4e-69e7-4661-a2fe-4c7fa9c01ac9', '8fc3b4c9-039c-413e-a7f9-d3d2deb89473', 'order_confirmation', 'ngoctanphan02@gmail.com', 'sent', '816614aa-f2cc-4702-98ff-0d6894cb79d6', NULL, '2026-03-12 03:55:49.212+00', '2026-03-12 03:55:49.241717+00'),
	('fee901a2-5ec4-4f12-ae6d-4a3b0b2e37db', '1eff3386-f23b-4e22-979f-a92b14be6fad', 'order_confirmation', 'ngoctanphan02@gmail.com', 'sent', '2464250b-0761-4b00-8f76-4dbe2c91db31', NULL, '2026-03-12 03:58:47.735+00', '2026-03-12 03:58:47.766886+00'),
	('3f5db29d-215e-4302-844b-6db42091bf2c', '2314c79c-b599-447a-bfed-c55707873530', 'order_confirmation', 'daingan1@yopmail.com', 'sent', '3182e9e3-90d9-44ce-afcd-a0dda709c0a2', NULL, '2026-03-13 10:32:18.153+00', '2026-03-13 10:32:18.16021+00'),
	('9c1e33d7-8916-4a81-8f88-6a68ceadeada', '8fc3b4c9-039c-413e-a7f9-d3d2deb89473', 'tree_assignment', 'ngoctanphan02@gmail.com', 'sent', '9f74a7b0-e345-44d7-86df-0677f6c7da42', NULL, '2026-03-14 06:49:09.665+00', '2026-03-14 06:49:09.905861+00'),
	('b8b29d98-7aee-41bf-a9dd-20c8ff7b1602', '1fc8d4f9-9482-4c18-836d-27682e18786a', 'order_confirmation', 'ngoctanphan02@gmail.com', 'sent', 'ea2c56bb-9324-420e-bef9-0f6f8e84d028', NULL, '2026-03-14 15:20:05.54+00', '2026-03-14 15:20:05.600098+00'),
	('75117cd1-7be5-4522-ac1b-9513a5b2b69a', '533dbfc1-e46f-4965-980e-53656a20cd77', 'order_confirmation', 'ngoctanphan02@gmail.com', 'sent', '3c92059a-a09e-4636-8da5-dae27f3b3a4d', NULL, '2026-03-14 15:22:14.182+00', '2026-03-14 15:22:14.223686+00'),
	('463f3508-e859-4587-ba15-695fa2abcf22', '1fc8d4f9-9482-4c18-836d-27682e18786a', 'tree_assignment', 'ngoctanphan02@gmail.com', 'sent', '6eb600d8-cdc1-4e81-a254-2a84acfdf6fc', NULL, '2026-03-14 16:12:49.634+00', '2026-03-14 16:12:50.062951+00'),
	('6de9beaa-05b3-4c4a-b346-97ef95b3beba', '85ff9ecf-482d-4482-9f7f-84b844cbbb89', 'order_confirmation', 'trandung233@gmail.com', 'sent', '99820a48-99a4-403e-bcf6-4db47eda3b6a', NULL, '2026-03-24 08:54:36.905+00', '2026-03-24 08:54:37.17804+00'),
	('b3ddc850-fe7f-48c1-afb9-7ff3fc6e21b4', '52273e22-c33a-40e2-98b6-9706e9333af1', 'order_confirmation', 'phanquochoipt@gmail.com', 'sent', '88e0bc5f-e7b8-44d9-8933-6ebe940514da', NULL, '2026-03-25 15:58:30.353+00', '2026-03-25 15:58:31.02583+00'),
	('7e6eeeff-e6a9-411c-bc95-cf8c0888bbf8', '7bd202fe-1f1f-49e2-8d79-32ae47930df2', 'order_confirmation', 'trangiangha@gmail.com', 'sent', '650255a8-7e04-4dc9-af3b-d50126883f96', NULL, '2026-03-28 14:46:29.85+00', '2026-03-28 14:46:29.857756+00'),
	('fc146ca5-cecd-4f74-b5c0-f73235d335c6', 'd2b0e40d-1eff-45c1-9f1a-4f2d26d4b386', 'order_confirmation', 'nguyenphuonghoang888@gmail.com', 'sent', '7368b72a-bc82-4777-9c11-9d35b0a2e360', NULL, '2026-03-28 14:52:30.025+00', '2026-03-28 14:52:30.117813+00'),
	('dc507e1e-2819-4fe4-8cc8-78614af4d6d1', '7bd202fe-1f1f-49e2-8d79-32ae47930df2', 'order_confirmation', 'trangiangha@gmail.com', 'failed', NULL, 'Failed to download PDF: {}', NULL, '2026-03-28 15:27:04.591386+00'),
	('dce9b1d9-97c4-4ae2-a38a-7e13e8dc318f', '7bd202fe-1f1f-49e2-8d79-32ae47930df2', 'order_confirmation', 'trangiangha@gmail.com', 'sent', '3af6dad5-d1a4-40f2-a3ce-8482bd489b28', NULL, '2026-03-28 15:28:12.093+00', '2026-03-28 15:28:12.382635+00'),
	('381c39cf-4abf-4bf0-b8b0-271f08e2dc88', 'd2b0e40d-1eff-45c1-9f1a-4f2d26d4b386', 'order_confirmation', 'nguyenphuonghoang888@gmail.com', 'sent', 'f73c1ee6-749b-4d43-93b9-aba87e74c1b0', NULL, '2026-03-28 15:28:58.998+00', '2026-03-28 15:28:59.111696+00');


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."email_templates" ("id", "template_key", "subject", "html_body", "variables", "updated_by", "updated_at", "created_at") VALUES
	('707d3284-772e-426e-a205-51f814d42f4d', 'withdrawal_request_created', 'Yêu cầu rút tiền mới - Đại Ngàn Xanh', '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <div style="font-size: 24px; font-weight: bold; color: #10b981; text-decoration: none;">Đại Ngàn Xanh</div>
    </div>
    <h2>Yêu cầu rút tiền mới</h2>
    <p>Có một yêu cầu rút tiền mới từ <strong>{{fullName}}</strong>.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Số tiền:</strong> {{amount}}</p>
      <p><strong>Ngân hàng:</strong> {{bankName}}</p>
      <p><strong>Số tài khoản:</strong> {{bankAccountNumber}}</p>
      <p><strong>Người nhận:</strong> {{fullName}}</p>
    </div>
    <p>Vui lòng kiểm tra và xử lý tại trang quản trị.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
      <p>Email này được gửi tự động từ hệ thống Đại Ngàn Xanh.</p>
    </div>
  </div>', '["fullName", "amount", "bankName", "bankAccountNumber"]', NULL, '2026-01-14 22:26:55.416348+00', '2026-01-14 22:26:55.416348+00'),
	('0043b4c4-69d7-43ec-902e-f2181f497cad', 'withdrawal_request_approved', 'Yêu cầu rút tiền đã được duyệt - Đại Ngàn Xanh', '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <div style="font-size: 24px; font-weight: bold; color: #10b981; text-decoration: none;">Đại Ngàn Xanh</div>
    </div>
    <h2 style="color: #10b981;">Yêu cầu rút tiền thành công</h2>
    <p>Xin chào <strong>{{fullName}}</strong>,</p>
    <p>Yêu cầu rút tiền của bạn đã được duyệt và chuyển khoản thành công.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Số tiền:</strong> {{amount}}</p>
      <p><strong>Ngân hàng:</strong> {{bankName}}</p>
      <p><strong>Số tài khoản:</strong> {{bankAccountNumber}}</p>
    </div>
    <p>Cảm ơn bạn đã đồng hành cùng Đại Ngàn Xanh!</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
      <p>Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.</p>
    </div>
  </div>', '["fullName", "amount", "bankName", "bankAccountNumber", "proofImageUrl"]', NULL, '2026-01-14 22:26:55.416348+00', '2026-01-14 22:26:55.416348+00'),
	('70e9183d-9175-447a-8917-94122e70ac59', 'withdrawal_request_rejected', 'Thông báo về yêu cầu rút tiền - Đại Ngàn Xanh', '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <div style="font-size: 24px; font-weight: bold; color: #10b981; text-decoration: none;">Đại Ngàn Xanh</div>
    </div>
    <h2 style="color: #ef4444;">Yêu cầu rút tiền bị từ chối</h2>
    <p>Xin chào <strong>{{fullName}}</strong>,</p>
    <p>Rất tiếc, yêu cầu rút tiền của bạn đã không được chấp nhận.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Số tiền:</strong> {{amount}}</p>
      <p><strong>Lý do từ chối:</strong></p>
      <p style="color: #ef4444; font-weight: 500;">{{rejectionReason}}</p>
    </div>
    <p>Vui lòng kiểm tra lại thông tin hoặc liên hệ bộ phận hỗ trợ để được giải đáp.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
      <p>Email này được gửi tự động từ hệ thống Đại Ngàn Xanh.</p>
    </div>
  </div>', '["fullName", "amount", "rejectionReason"]', NULL, '2026-01-14 22:26:55.416348+00', '2026-01-14 22:26:55.416348+00');


--
-- Data for Name: field_checklists; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."field_checklists" ("id", "lot_id", "quarter", "checklist_items", "overall_status", "due_date", "completed_at", "created_at", "updated_at") VALUES
	('e1e927b1-ba15-4611-978d-ae1b7c7686fe', '22222222-2222-2222-2222-222222222222', '2026-Q1', '[{"id": "visit", "label": "Thăm vườn", "notes": "", "completed": false, "completed_at": null, "completed_by": null}, {"id": "photos", "label": "Chụp ảnh", "notes": "", "completed": false, "completed_at": null, "completed_by": null}, {"id": "health_check", "label": "Kiểm tra sức khỏe", "notes": "", "completed": false, "completed_at": null, "completed_by": null}, {"id": "upload_photos", "label": "Upload ảnh", "notes": "", "completed": false, "completed_at": null, "completed_by": null}, {"id": "update_status", "label": "Cập nhật status", "notes": "", "completed": false, "completed_at": null, "completed_by": null}]', 'pending', '2026-03-31', NULL, '2026-01-13 12:23:02.439964+00', '2026-01-13 12:23:02.439964+00'),
	('aad5251e-0c92-4350-b270-d6556345b6d1', '11111111-1111-1111-1111-111111111111', '2026-Q1', '[{"id": "visit", "label": "Thăm vườn", "notes": "", "completed": true, "completed_at": "2026-01-13T12:23:48.530Z", "completed_by": "admin"}, {"id": "photos", "label": "Chụp ảnh", "notes": "", "completed": true, "completed_at": "2026-01-13T12:23:58.438Z", "completed_by": "admin"}, {"id": "health_check", "label": "Kiểm tra sức khỏe", "notes": "", "completed": true, "completed_at": "2026-01-13T12:24:06.445Z", "completed_by": "admin"}, {"id": "upload_photos", "label": "Upload ảnh", "notes": "", "completed": true, "completed_at": "2026-01-13T12:24:14.424Z", "completed_by": "admin"}, {"id": "update_status", "label": "Cập nhật status", "notes": "", "completed": true, "completed_at": "2026-01-13T12:24:23.784Z", "completed_by": "admin"}]', 'completed', '2026-03-31', '2026-01-13 12:24:23.784+00', '2026-01-13 12:23:02.291816+00', '2026-01-13 12:24:24.056164+00');


--
-- Data for Name: trees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."trees" ("id", "code", "order_id", "user_id", "created_at", "status", "lot_id", "planted_at", "health_status") VALUES
	('c46191ca-f66d-4328-b30f-ac7447666e88', 'TREE-2026-1774709187184-00721', '7bd202fe-1f1f-49e2-8d79-32ae47930df2', '880025b6-0043-45ea-ad81-b035326d403f', '2026-03-28 14:46:27.467432+00', 'active', NULL, NULL, 'healthy'),
	('7c467d60-80bf-4a06-9005-9cf18629ec8c', 'TREE-2026-1774709547916-00673', 'd2b0e40d-1eff-45c1-9f1a-4f2d26d4b386', '5296b70b-03bb-463b-853c-9ccff2697685', '2026-03-28 14:52:28.0366+00', 'active', NULL, NULL, 'healthy'),
	('86554e38-d54e-48a2-9bdf-e118ca6ede0f', 'TREE-2026-1774342472436-00505', '85ff9ecf-482d-4482-9f7f-84b844cbbb89', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '2026-03-24 08:54:34.007479+00', 'active', NULL, NULL, 'healthy'),
	('b84176db-679b-488b-96ad-b893371b3613', 'TREE-2026-1774342472436-01727', '85ff9ecf-482d-4482-9f7f-84b844cbbb89', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '2026-03-24 08:54:34.007479+00', 'active', NULL, NULL, 'healthy'),
	('60dbcb3e-2160-4ba5-a053-61c3f0a40e11', 'TREE-2026-1774342472436-02183', '85ff9ecf-482d-4482-9f7f-84b844cbbb89', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '2026-03-24 08:54:34.007479+00', 'active', NULL, NULL, 'healthy'),
	('a73f8ddb-283d-48ef-9023-e3fcfb9ec124', 'TREE-2026-1774342472436-03350', '85ff9ecf-482d-4482-9f7f-84b844cbbb89', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '2026-03-24 08:54:34.007479+00', 'active', NULL, NULL, 'healthy'),
	('d222aade-e708-475f-9529-c6046ad0bab0', 'TREE-2026-1774342472436-04585', '85ff9ecf-482d-4482-9f7f-84b844cbbb89', '8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', '2026-03-24 08:54:34.007479+00', 'active', NULL, NULL, 'healthy'),
	('c816b35a-c91c-4940-9795-2db6bcaef5ee', 'TREE-2026-1774454299751-00035', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('df2f6719-cc76-44bc-87ac-f9b1021afc11', 'TREE-2026-1774454299751-01304', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('e1a8cf2c-8ad9-4405-8fd8-1abab355653f', 'TREE-2026-1774454299751-02134', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('976830d4-92de-4c46-bf4e-14eecd959127', 'TREE-2026-1774454299751-03827', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('5c6fac72-4538-422b-83bd-1fb3b56795a6', 'TREE-2026-1774454299751-04943', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('9768569b-0e44-4669-9f8e-ce8df1a97aab', 'TREE-2026-1774454299751-05731', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('ccf7c14c-5ab5-42bc-9374-a73e355eadc2', 'TREE-2026-1774454299751-06362', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('fe16bb7c-a207-4062-ad50-ee8475c1f2c0', 'TREE-2026-1774454299751-07802', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('12e9bdd3-18b3-4734-bac5-863c11b8cf79', 'TREE-2026-1774454299751-08588', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('32209608-54e4-4588-af3c-c9bc054eb1ee', 'TREE-2026-1774454299751-09471', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('1e70fbd2-8953-4c77-aed3-5ee33baa4dc0', 'TREE-2026-1774454299751-10917', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('a68bc8e0-7de3-439a-83b9-1cfdf4d2090e', 'TREE-2026-1774454299751-11532', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('9337de7b-4718-41bb-a374-dc5f0c63e702', 'TREE-2026-1774454299751-12956', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('d7ded773-41d7-4511-9d97-3bb84591128e', 'TREE-2026-1774454299751-13582', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('01633925-d762-421c-b0eb-d06a8f188c0c', 'TREE-2026-1774454299751-14596', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('1c0a5f68-cf2b-4dcb-84a7-382a430edbcb', 'TREE-2026-1774454299751-15866', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('ab260a34-b62d-4a9c-813c-382de51e9db3', 'TREE-2026-1774454299751-16997', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('2496e163-07e6-44cc-80a9-2fc626c1efa8', 'TREE-2026-1774454299751-17924', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('7e896e06-0718-4c44-9dfa-e17815ef6a08', 'TREE-2026-1774454299751-18154', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('cab8f24a-62b6-438f-9124-d913afa460db', 'TREE-2026-1774454299751-19598', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('9da351bb-2823-4262-9327-8e956950074f', 'TREE-2026-1774454299751-20409', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('f502d996-c210-4023-87d2-d3cbc9f35881', 'TREE-2026-1774454299751-21371', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('ccd9fa83-6ae2-4c19-a9c2-6f318cb0f0ac', 'TREE-2026-1774454299751-22170', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('adaa7e1f-65c1-4df8-878d-76b2dab3b302', 'TREE-2026-1774454299751-23838', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('f798d580-ca84-4478-a3c5-ccb60cc5e4d1', 'TREE-2026-1774454299751-24843', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('1c2aa37b-caac-4b63-93d8-829b16026158', 'TREE-2026-1774454299751-25768', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('fbdfe8c4-7856-4896-9785-ab2c395c4120', 'TREE-2026-1774454299751-26263', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('ad66bf8e-e5c4-40ba-9726-e936a8a0acb0', 'TREE-2026-1774454299751-27633', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('1a825034-e9c2-48c4-9188-71061f078a47', 'TREE-2026-1774454299751-28799', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('e9218ffa-e208-4f4b-8801-a518b123b604', 'TREE-2026-1774454299751-29717', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('0e8d3db1-2856-4a5b-87ba-037b9485523d', 'TREE-2026-1774454299751-30577', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('2b90a3b9-7f2d-431d-a0ec-dba401f20847', 'TREE-2026-1774454299751-31666', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('41dd123a-3baa-493e-b3b3-8a924d98d9c0', 'TREE-2026-1774454299751-32371', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('9a40e9cd-3078-4605-b993-7fc4c34d19b9', 'TREE-2026-1774454299751-33611', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('b96c952f-f999-46cb-8486-0985d0fb8071', 'TREE-2026-1774454299751-34412', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('88ca1905-5d81-4e31-a451-5dd53c7a57aa', 'TREE-2026-1774454299751-35082', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('40c567e9-6aff-42da-94c1-1ae30306fb61', 'TREE-2026-1774454299751-36398', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('03217acb-b7c6-4747-9c20-f8455a04de39', 'TREE-2026-1774454299751-37131', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('352968cb-9d74-4e87-8c1d-ee9182997783', 'TREE-2026-1774454299751-38132', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('58d26e74-34a1-44a8-a055-ddcb632e5b9e', 'TREE-2026-1774454299751-39995', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('b07c5776-c9b3-4626-8a1c-ae06ec7b1fd3', 'TREE-2026-1774454299751-40188', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('cb1ce8fa-77ca-46e8-a13b-053f6550dcd0', 'TREE-2026-1774454299751-41183', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('fba63b4d-8442-4fb2-ba81-7b4a9ee8d0f7', 'TREE-2026-1774454299751-42443', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('f46db1fe-b8ca-4d33-8fbc-84fe2f9e615c', 'TREE-2026-1774454299751-43653', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('1036eec5-8847-478f-ac09-ed1d3985a5ee', 'TREE-2026-1774454299751-44540', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('0bc8921c-fa6a-445e-bf96-4edc58a5b772', 'TREE-2026-1774454299751-45094', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('3efc553c-ac6a-42b6-8271-c0b40ddb8e1e', 'TREE-2026-1774454299751-46758', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('1856537b-7326-4600-be74-367dedd0ac3b', 'TREE-2026-1774454299751-47490', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('e5cc4e2a-3bae-40bd-83fd-348dc96a3e11', 'TREE-2026-1774454299751-48241', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy'),
	('6831462b-46fa-4976-8467-87fa1cee9f56', 'TREE-2026-1774454299751-49953', '52273e22-c33a-40e2-98b6-9706e9333af1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-03-25 15:58:23.209355+00', 'active', NULL, NULL, 'healthy');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "phone", "email", "full_name", "referral_code", "created_at", "updated_at", "role") VALUES
	('dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', NULL, 'phanquochoipt@gmail.com', NULL, 'DNG581361', '2026-01-10 15:09:33.022112+00', '2026-01-10 15:09:33.022112+00', 'admin'),
	('8172a2c5-52b7-446c-8b2a-64ba98542a18', NULL, 'ngoctanphan02@gmail.com', NULL, 'DNG709365', '2026-03-12 15:22:40.144402+00', '2026-03-12 15:22:40.144402+00', 'admin'),
	('1c154887-9d93-4045-93c9-94f204c485d2', NULL, 'epsiloncryptoai@gmail.com', NULL, 'DNG898536', '2026-03-21 23:40:44.940989+00', '2026-03-21 23:40:44.940989+00', 'user'),
	('1f7e5e98-b4e9-478c-beb1-e3ddc66cd875', NULL, 'akiracong@gmail.com', NULL, 'DNG009990', '2026-03-21 23:40:44.940989+00', '2026-03-21 23:40:44.940989+00', 'user'),
	('85fd2d59-fc3b-4f97-bf6e-861138d89d88', NULL, 'hoanglongsaomai8@gmail.com', NULL, 'DNG934403', '2026-03-21 23:40:44.940989+00', '2026-03-21 23:40:44.940989+00', 'user'),
	('8f75d261-fd19-45e0-a9b0-e40fe02a2fb6', NULL, 'trandung233@gmail.com', NULL, 'DNG453347', '2026-03-24 08:52:49.169601+00', '2026-03-24 08:52:49.169601+00', 'user'),
	('7c65c9b0-a62d-496e-a35a-f71f220c9546', NULL, 'test@test.com', NULL, 'DNG135235', '2026-03-25 02:20:53.774241+00', '2026-03-25 02:20:53.774241+00', 'user'),
	('baaf6f34-042d-468e-8913-080def59f6ea', NULL, 'yen05031991@gmail.com', NULL, 'DNG988882', '2026-03-28 04:08:15.531399+00', '2026-03-28 04:08:15.531399+00', 'user'),
	('eff865b7-be58-4ac8-9eeb-91bcb678d1e6', NULL, 'yen050391@gmail.com', NULL, 'DNG058078', '2026-03-28 04:15:13.638144+00', '2026-03-28 04:15:13.638144+00', 'user'),
	('5296b70b-03bb-463b-853c-9ccff2697685', NULL, 'nguyenphuonghoang888@gmail.com', NULL, 'DNG895075', '2026-03-24 10:06:31.664723+00', '2026-03-24 10:06:31.664723+00', 'admin'),
	('85155afe-ec56-471e-a0a1-3fbf58b972ac', NULL, 'manhhieu972000@gmail.com', NULL, 'DNG171223', '2026-03-28 05:08:36.00535+00', '2026-03-28 05:08:36.00535+00', 'user'),
	('b5fd97d9-97ab-4a97-a7b6-ea9dcba22470', NULL, 'lamduy.action@gmail.com', NULL, 'digioden', '2026-03-25 16:27:02.705259+00', '2026-03-25 16:27:02.705259+00', 'user');


--
-- Data for Name: tree_health_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: follow_up_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("id", "user_id", "type", "title", "body", "data", "read", "created_at") VALUES
	('c8f1133d-1810-454e-b546-16122d8b94fa', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00312 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1a13a811-281b-4bda-abce-961ab8d8b714", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00312", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:43.112674+00'),
	('cd8b235e-a586-4585-badb-8a4f235eb052', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00314 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "d3eac0b2-5e5d-45c4-be9d-6807f44af7db", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00314", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:45.047608+00'),
	('d1e71e6d-cc4f-472d-8a49-e6e1267ab7ad', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00316 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "c58d571d-51fd-43a1-ab87-cafc915dbb4a", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00316", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:47.085108+00'),
	('026ec2bb-f0ec-410e-a134-1a1d4059099e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00319 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "68ef182a-f284-4916-9242-1023c5f32dc7", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00319", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:49.817109+00'),
	('93433a0d-546e-4b8e-9bd1-0ac8390d2ca7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00321 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1f358310-9654-405f-b3ee-e473e9835f01", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00321", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:51.641296+00'),
	('0fe6ef9b-722b-4637-9003-17b7dd214cf7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-9093A001-285713 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "abaa9c4c-d9c2-4e1d-8776-6aaef5da51f8", "orderId": "9093a1f1-0859-499f-b8af-03ce19f02e5e", "treeCode": "TREE-2026-9093A001-285713", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:27.988779+00'),
	('2c478907-62b5-4abc-9069-d587f2510c92', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7001 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "be178d14-4ecc-4d49-a327-99eec3eb0d12", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7001", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:28.924959+00'),
	('fd2de786-053a-492f-99aa-334dee2c5b9b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7002 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "38808486-d935-44ee-afcb-cf39a07ba191", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7002", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:29.812582+00'),
	('97f4ffa3-72b5-4a7f-93d4-82f2a2518812', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7003 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "3c198e4a-19dd-40b1-85a9-c44f66b6f55e", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7003", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:31.413305+00'),
	('6841b41f-7843-4c72-bf8f-62cce95d9219', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7004 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "c2540324-68a5-482e-b401-77dd3c564665", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7004", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:32.302293+00'),
	('24b2d792-1da4-441a-9c11-38ed334eed3c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00313 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "c657d50f-3bd2-49e1-98ca-36ba72998176", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00313", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:44.100835+00'),
	('9e4682da-81cf-47c8-9b8d-7c4f0fddee5a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00315 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "3c7ac83e-60cf-4794-b6f4-16aa633f84f2", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00315", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:46.051976+00'),
	('8f66624a-1806-4fc8-a116-729e8a4dcec2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00317 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "41d9f10a-ce1a-43e8-8bf4-3bd1a29b1054", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00317", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:47.987536+00'),
	('78ed546d-ad73-4679-9585-693770d78093', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00318 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1046d843-391d-4215-986c-5ac7ce59d18f", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00318", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:48.892021+00'),
	('1f05b7e9-1a69-46cc-a4db-d459a4140fe6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-00320 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "f637286d-5c8d-4e80-b0a9-d0e00cadbc10", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-00320", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-01-12 09:46:50.72081+00'),
	('6181aaa6-78db-4a30-89f9-b413820a42d2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7009 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "2a508328-76a8-4050-9695-96ed160f5bb7", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7009", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:36.84356+00'),
	('4258c303-d58c-4713-912f-523f80ffa7d1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7010 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1ae61b10-cf66-481d-890d-b4613da3f10d", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7010", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:37.737405+00'),
	('fbacf381-ae50-439d-93dc-d5abe2fea369', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-9093A002-285714 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "937e32a9-3d82-48e6-b3e4-86debcaad3ce", "orderId": "9093a1f1-0859-499f-b8af-03ce19f02e5e", "treeCode": "TREE-2026-9093A002-285714", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:38.640798+00'),
	('3dccec5b-9d06-4f13-b8fd-c1d68fb233a1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-A4324001 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "bc6fb487-c016-4691-8756-e53b8ec35e75", "orderId": "a4324264-3893-4442-8599-903da0c86d19", "treeCode": "TREE-2026-A4324001", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:39.553514+00'),
	('8f3b9453-8651-4c99-9644-7750df770545', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7001-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "89e3151b-a59d-4e0d-ae43-a61e7b6aee31", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7001-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:40.57725+00'),
	('16f0ce24-2603-4537-b11a-455015da2a68', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7004-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "93f7686c-7850-4b17-8686-5af05d8d5a0c", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7004-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:24.383065+00'),
	('f11a0b68-a662-487c-a0b8-2cb802a8f6ea', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7005-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1f182459-8c4f-4f51-87e4-858435061ecf", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7005-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:25.299866+00'),
	('d9c39ec3-f822-496d-9af6-ea96e1faad6f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7006-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "51b7ce02-1e0e-4ea0-995e-ce2cee12dea8", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7006-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:26.213499+00'),
	('60e1dfa8-fc39-417b-8d05-f48db11fdbd0', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7007-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "d1ec9725-1bd4-4e6e-9ecd-44a5e4062378", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7007-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:27.258565+00'),
	('137eadcb-7c0b-4238-9eeb-3604fdcb4df5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7008-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "61731988-f738-4a9a-ab91-0b74872a2cc7", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7008-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:28.165117+00'),
	('bbae47b5-bba1-4080-8966-91471bb8a9e1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7009-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "279ef76b-ca07-48b8-85e5-394a9720fcc9", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7009-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:29.102646+00'),
	('5ee7ccdf-96c2-458e-a571-d5d4fa09f0ca', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7010-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "886f7b37-6207-4361-a078-205decc9bc71", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7010-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:29.979587+00'),
	('ab0e67bd-fa7a-47b9-96a6-5de7ecf2528e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7001-121348 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "e76a3c79-2967-438f-8d92-8293899254a8", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7001-121348", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:30.849034+00'),
	('0654a313-c8d6-434c-9dca-398e9212da71', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7002-121348 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "98071ce6-6d75-4f94-9d24-c1034da0ac32", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7002-121348", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:31.722545+00'),
	('b706e291-569f-4f58-9ea9-2e00c8f24f1d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7003-121348 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "6d9f0e3c-68b5-4dd2-a392-30e0e566a2b1", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7003-121348", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:32.600524+00'),
	('f074fa71-2e22-4a01-912d-1af18b08b5d5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7004-121348 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "5be1706e-7be5-4f8a-92ab-86c9633f40a9", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7004-121348", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:33.529015+00'),
	('ca7233b9-66ce-4b6f-b047-bdb4f0772db6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7005-121348 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "cee26d96-f0c8-4ba2-ad0e-6c2e09611c8d", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7005-121348", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:34.437369+00'),
	('4f4ca9b6-8b33-42a2-9ef0-188886402f69', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7006-121348 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "98b59564-c583-42f3-89da-1093a4e1b903", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7006-121348", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:35.35007+00'),
	('0e26c50c-f4c5-48a2-b631-4315be891c77', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7005 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "6a746f09-910b-46e3-992f-92a7fb155a22", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7005", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:33.19728+00'),
	('33f17ab3-2704-4fa9-9174-28847b5b2711', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7006 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "179964b4-bfa4-4748-baf8-b5ed066755f3", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7006", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:34.110438+00'),
	('fd7c11c4-8533-4c02-adf8-00c8ef0f4fbe', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7007 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "34b00a4c-1939-402d-9475-93ee90268f42", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7007", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:35.018786+00'),
	('69f99a9f-b96d-4a29-93ef-02867e75d57a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7008 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "a90dad7d-4960-41df-814b-c2fd319fcf6b", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7008", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:35.934404+00'),
	('1bdc8d1a-dad0-4761-81d9-5c9a253c91cc', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7002-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "a0b28ad1-1a89-424b-b385-662fc1f2f864", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7002-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:41.443436+00'),
	('d91914c7-7424-4ce1-bdbb-70c370c7a83c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7003-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "454e0f10-ef3d-4247-b0be-7f6baa496d94", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7003-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:43.120465+00'),
	('b71b3a71-7316-4967-beef-65830ed7f3bb', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7004-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "cf4b63ef-eb4b-48e7-ba15-6103b3c988e9", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7004-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:43.993766+00'),
	('57d28b21-165b-4dda-b666-08440c6d990e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7005-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "020388fd-56d1-431e-b677-d7984cfb9bcb", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7005-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:44.8704+00'),
	('f163d114-4f7a-48e2-ba82-04447b8f3164', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7006-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "3704a7e1-9cd6-413d-b70a-ed3368a23068", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7006-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:45.825454+00'),
	('50310967-29be-49c2-9313-9df927d56e4a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7007-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "44ae6229-df27-473f-92bc-242d1fb1d692", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7007-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:46.888641+00'),
	('a28df641-ff5d-4aa4-bd89-4c568f09865a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7008-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "90a674ed-82c2-45db-a950-5c7078b17360", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7008-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:47.910934+00'),
	('982d8828-aa31-4b24-8794-9bf6942243cb', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7009-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "7e8bfdcb-2701-44a6-8ee9-8206322c083c", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7009-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:48.820931+00'),
	('4981fc03-37ac-4357-802d-476e4ff57b84', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7010-802610 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1f0319a5-f8a4-434a-8afc-65b6e05b8705", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7010-802610", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:49.685994+00'),
	('979ac80b-fef5-4881-b714-a80e93531a08', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7001-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "b87b949b-d819-4903-9418-d4a37378d613", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7001-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:50.588308+00'),
	('c2bbbd60-8d62-43ac-8eb6-b074b71bf2b7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7002-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "b0a91b55-3bda-4a25-9d2f-f58865901575", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7002-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:51.458474+00'),
	('ef08ad35-eec4-40b5-ab42-615163ef2e4a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7003-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "6a0225c4-80cd-41d6-a51b-cb54a6ff6c38", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7003-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:52.355193+00'),
	('da84922a-0e19-437d-baf4-b0e0bd295a00', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7004-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "f1a10a88-4a2c-403a-b3d8-3679e0c4ec30", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7004-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:53.254779+00'),
	('c723b0c2-6407-415c-bde4-63b42b47b385', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7005-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1cad4939-3827-4dea-8d77-0bbae7284986", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7005-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:54.123762+00'),
	('78ee3de1-cf46-4cc4-8be2-f83d6c024cd8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7006-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "fcfdfb81-46de-4204-9516-70da72ae71fb", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7006-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:55.008842+00'),
	('eabd470b-168e-4f84-a4f2-eb784913cb26', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7007-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "0ea00707-7728-465c-ad04-d40405e7e0d1", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7007-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:55.897251+00'),
	('4d65cc5b-2bc8-440f-ad2b-9824c1ea41b8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7008-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "d3944107-b206-4185-b4c1-6e3b7255d00d", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7008-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:56.808536+00'),
	('5a3692a6-c409-4830-b4d3-b0e10d3b374c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7009-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "bb7a1ea4-6854-4261-bc39-ed73ace82135", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7009-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:57.779395+00'),
	('2f1aeb48-529f-4cbd-b3fb-096d1976e6ea', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7010-432858 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "04b40be5-78b7-4ed9-9e4d-04e05875d15e", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7010-432858", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:58.663618+00'),
	('7fb9a99a-9294-474c-976f-385c6a7f66ca', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7001-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "3c06d1f2-2d2e-4d8f-8c66-c77709bdce1e", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7001-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:01:59.709995+00'),
	('465713d2-3b00-4808-b49e-8c06dc71d958', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7002-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "b28aa4e1-4471-4414-b2aa-698056712d0f", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7002-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:00.606393+00'),
	('16b114a4-69a2-4aac-bbc4-c26e0d32ac23', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7003-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "3157b456-2f54-43cb-a7fd-4180c99454d5", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7003-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:01.4958+00'),
	('42db4ee9-dbff-47ba-8821-75f3eb4fc6d2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7004-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "386c6fd3-445c-4c06-b47c-47ab65c102ac", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7004-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:05.672132+00'),
	('72ad70ef-4322-4202-a949-53cd981967b1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7005-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "aae3f607-f8b5-4314-9484-38423568033c", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7005-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:07.155076+00'),
	('00de5b69-0c2c-4301-9667-8ab7bda18986', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7006-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "4f553618-f2f3-44cb-8a46-80b7670a1b60", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7006-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:08.068803+00'),
	('093512e0-f61d-40ae-9128-34483fa5a3c6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7007-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "f00d3a7f-a277-4533-957e-ced5896f2274", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7007-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:09.002341+00'),
	('099a5d6c-b9b3-468e-8785-a578c8a62c10', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7008-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "e57a4e98-72d2-4df3-94a1-2a5b78f37e35", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7008-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:09.898626+00'),
	('c30bd315-bf1e-4fd7-8586-ff9a440d29c1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7009-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "0d1a69b9-aaed-48e7-8e94-fee6db6eb5c6", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7009-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:10.835056+00'),
	('a4991333-d877-4985-9dde-074e2fffa2af', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7010-536467 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "9ec90574-1a5d-4fe3-b549-62c940c4392d", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7010-536467", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:11.720284+00'),
	('33d4f4c4-5005-45a8-bb2f-2fbe56f645af', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7001-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "295b7e1f-be7a-4cad-b775-8a388eb114b8", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7001-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:12.642739+00'),
	('28bc4039-58fe-4fed-b70b-2a33bf923b2d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7002-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "c488e6d6-e18d-4329-b8f0-2038317de37e", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7002-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:13.54528+00'),
	('300e2e22-311b-459e-9470-10725b354d06', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7003-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "548304a0-7bde-4fcd-96bf-56c98a7b1d8b", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7003-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:14.447658+00'),
	('9fb552cd-667d-456a-8636-55c50ccda5cd', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7004-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "060d63c6-f8c8-46e0-8cf7-f33fecc911a3", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7004-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:15.355488+00'),
	('cfd5e894-b8df-4fd9-9dfc-7b3d3c99fa17', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7005-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "a033936d-79c1-4df5-8af5-241ad6a1d617", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7005-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:16.279054+00'),
	('d86d727d-13db-4cdf-bd15-605d70021a03', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7006-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "206310b5-9692-4991-a26e-c236f491ab64", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7006-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:17.166048+00'),
	('457e9555-5798-40f7-9c40-1d8b69f3fe22', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7007-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "1e360409-3c94-404a-ad98-6b9dc563f797", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7007-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:18.063202+00'),
	('64b4c126-3cb7-45b9-85fa-cf3dc469e464', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7008-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "478a3cdf-43f7-448f-96b7-e5b32ada1e83", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7008-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:18.957417+00'),
	('c70e6a7a-7ad5-4d9d-8dab-8dd5cf52a46d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7009-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "0b7406ee-ddde-42a4-8728-1932e4769f85", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7009-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:19.85465+00'),
	('38d50683-aba2-4925-92dd-3ac1f994afbc', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7010-777499 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "a4c48e00-f38a-4396-934a-d0a8668128b7", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7010-777499", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:20.73999+00'),
	('0a204ae6-c20e-42fd-928d-d292468323c2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7001-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "08f31d56-99de-400f-afa9-1d9602699d20", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7001-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:21.652916+00'),
	('96c2b81b-f8a1-4920-be26-3b61a43b5c92', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7002-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "352fe4d8-2f8a-4b06-8a3c-f9744b347aaa", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7002-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:22.621772+00'),
	('eba14b30-d884-4911-9301-da7b8e093e6f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', 'Cây TREE-2026-17DF7003-046017 (0 tháng) đã sẵn sàng thu hoạch. Xem các lựa chọn của bạn.', '{"treeId": "68617e3a-bdf2-4253-b9f2-16b859339ec5", "orderId": "17df7f92-bbde-4ccb-8359-a42cf9ac5532", "treeCode": "TREE-2026-17DF7003-046017", "ageMonths": 0, "co2Absorbed": 0}', true, '2026-02-01 09:02:23.482438+00'),
	('850be171-5661-402b-9f8f-c5a5753531d5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f965842f-ae69-47da-9031-3ac18a9e9315", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00306", "ageMonths": 0}', true, '2026-01-11 11:48:35.366226+00'),
	('9bb4c232-7123-487b-a20d-155dcc25ac4f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "128edb39-1ae7-4335-9e37-65833b498d3c", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00311", "ageMonths": 0}', true, '2026-01-11 11:48:37.681055+00'),
	('db34db2a-67d1-4101-b71b-42ab9deb17ea', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a3dfb64e-f742-4738-9333-57c22150f17f", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00302", "ageMonths": 0}', true, '2026-01-11 11:48:33.516126+00'),
	('a9c38f9b-4a91-4733-b0f3-e881525b0ccc', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "cd06efd2-5306-49ea-8377-11bf2eda35a5", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00303", "ageMonths": 0}', true, '2026-01-11 11:48:33.882037+00'),
	('477d6a86-32b6-4c6a-81c1-064eef56e1d3', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "19fb4029-0ce3-487b-82ab-9851724b638b", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00304", "ageMonths": 0}', true, '2026-01-11 11:48:34.256577+00'),
	('16c909e6-cb26-4f1d-bf9b-11e90b7d7830', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9d535b14-6f71-437f-8b39-9a5c8779fb95", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00305", "ageMonths": 0}', true, '2026-01-11 11:48:34.962969+00'),
	('5eba703d-d070-4367-87cf-31a43068049c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'tree_update', '🌳 Cây của bạn có ảnh mới!', 'Lô Test A vừa được cập nhật ảnh mới. Hãy xem cây của bạn đang lớn lên như thế nào nhé!', '{"lotId": "test-lot-123", "lotName": "Lô Test A", "orderIds": ["543044d9-745f-479a-a17c-2a60ba130645"], "photoUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"}', true, '2026-01-11 09:16:33.849966+00'),
	('431265f9-d6d3-4857-aa28-75abd9b3ca94', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f4b4d9df-179a-4e61-9363-2f30f1feb2b5", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00051", "ageMonths": 0}', true, '2026-01-11 11:46:55.579567+00'),
	('b0fbd46e-2718-4124-b836-1645ec5a49ba', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c23a97b6-f442-41b4-98e6-6a98a7a93a1d", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00052", "ageMonths": 0}', true, '2026-01-11 11:46:56.000031+00'),
	('27f1f0c7-071e-4c49-ac39-5c940e7a61cf', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "29925af4-b038-4458-969d-638f0a97a1f0", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00053", "ageMonths": 0}', true, '2026-01-11 11:46:56.380224+00'),
	('1aecd440-3ad7-4b8f-ac96-149cba59a796', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "e83a7542-8732-41f2-815f-5d3d3125a00b", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00054", "ageMonths": 0}', true, '2026-01-11 11:46:56.726975+00'),
	('04f897db-5819-41cf-affc-05c0c5e6eca7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d6f07cc5-71e4-459b-83e0-f0188f4c5722", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00055", "ageMonths": 0}', true, '2026-01-11 11:46:57.120389+00'),
	('dd1a5966-2c87-4bfa-b3b1-5378e77caa05', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c76b1513-7183-4a0d-bbe8-39e177b1fcb2", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00056", "ageMonths": 0}', true, '2026-01-11 11:46:57.50191+00'),
	('1d532aeb-9c03-43e1-bb5f-df28cb85aa83', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0396e6b0-29e3-448b-bbf3-7fea5cd833e4", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00057", "ageMonths": 0}', true, '2026-01-11 11:46:57.853729+00'),
	('204db9d4-a9bf-4def-880e-7f645c74a107', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "efe0f1fb-4005-4d7c-a13a-73fcf7d77356", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00058", "ageMonths": 0}', true, '2026-01-11 11:46:58.221129+00'),
	('b80287ab-f68a-49be-a7c8-db98f409389f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d5407caf-3faa-4f05-a800-f8f04fbb57a8", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00059", "ageMonths": 0}', true, '2026-01-11 11:46:58.60794+00'),
	('d4b0d816-00b1-4880-a2e1-bf50046d19fa', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "06ff29c1-8f85-4000-af43-ca6acd06692a", "orderId": "0ddee661-7857-4241-8151-cb544bfcc9d1", "treeCode": "TREE-2026-00060", "ageMonths": 0}', true, '2026-01-11 11:46:58.947177+00'),
	('845f9e67-6930-477b-8aea-bb39edfdf7a3', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "954abdbf-b90b-4b66-94a8-f27de2d85c38", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00307", "ageMonths": 0}', true, '2026-01-11 11:48:36.156324+00'),
	('a073ea9a-d873-4991-bb12-85db004eaa8a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "fc62432e-f88a-4d26-bb40-355f952c46af", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00308", "ageMonths": 0}', true, '2026-01-11 11:48:36.523511+00'),
	('4d1c2709-1f2a-4882-91f4-dee410af492a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f4593b5d-4a71-455c-a47b-7ecdcd3ac88c", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00309", "ageMonths": 0}', true, '2026-01-11 11:48:36.927529+00'),
	('748ada5e-3fe8-42b2-9963-d68a4ec00413', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "8c011d57-50b0-42c3-a9fc-7dab7c2a77f2", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00061", "ageMonths": 0}', true, '2026-01-11 11:46:59.338172+00'),
	('06c9514b-5cdf-466d-8526-adf69064f0b1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "373b5616-9abc-46cc-8aac-b4deb197e9c4", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00062", "ageMonths": 0}', true, '2026-01-11 11:46:59.704023+00'),
	('7f20c14c-4634-464f-b4a3-7bb4a74770d0', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a6196f10-0dba-4bc4-a4be-cfc4c7e5d6c1", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00063", "ageMonths": 0}', true, '2026-01-11 11:47:00.041847+00'),
	('012e28e4-fe5a-4203-b64b-fb28ae0189da', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2f716597-d600-4548-a834-cecccfc79e46", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00064", "ageMonths": 0}', true, '2026-01-11 11:47:00.454895+00'),
	('994c5a76-bdbb-45f2-91be-59a868f07c6c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f87e1540-aff4-4d92-abd3-a517615e9715", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00065", "ageMonths": 0}', true, '2026-01-11 11:47:00.849403+00'),
	('13ec2c36-db4a-46b1-a3cb-0b55471c9cee', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "4e27a7e9-0257-4cd2-969c-e80791584bdd", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00066", "ageMonths": 0}', true, '2026-01-11 11:47:01.222663+00'),
	('95f8c088-3c40-44b7-8f28-764fe3055e7a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9e0d1079-a8a3-42fd-a9ac-811924132a96", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00067", "ageMonths": 0}', true, '2026-01-11 11:47:01.609794+00'),
	('9e4b5327-38e6-4e29-8630-6efa07ae9ecf', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1979a382-9787-4e61-bca0-81035104dbc6", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00068", "ageMonths": 0}', true, '2026-01-11 11:47:02.010991+00'),
	('3c79a268-271d-4dfa-b4f7-49a991f58087', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "285c88d3-e83c-48eb-8e25-4c7fde83d97e", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00069", "ageMonths": 0}', true, '2026-01-11 11:47:02.357944+00'),
	('8b3c1def-15b1-4c51-bba3-b2e770cc103e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1cb5db1c-4f7e-4d06-b995-9aaa928bca41", "orderId": "f36a46ba-0635-45f4-8b51-ed69c5a2a67c", "treeCode": "TREE-2026-00070", "ageMonths": 0}', true, '2026-01-11 11:47:02.751308+00'),
	('37b75d62-dd87-40ef-94e8-4018448f8693', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1ff608e2-e7b4-4b94-841b-8dd649111d29", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00071", "ageMonths": 0}', true, '2026-01-11 11:47:03.138366+00'),
	('b911339a-9488-4a97-bda3-2442d365f06d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "bbead146-a26d-4cb8-a87e-f98567a78028", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00072", "ageMonths": 0}', true, '2026-01-11 11:47:03.477896+00'),
	('0793ea14-7413-493b-a96a-b4c07301d4d9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "cdf67743-d006-4e68-a1d1-4f713db9d96d", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00073", "ageMonths": 0}', true, '2026-01-11 11:47:03.870868+00'),
	('be1f838b-aabb-4d8f-a693-a635f59f4c65', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6f4c8901-2a81-499f-9fd5-f08b535931af", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00074", "ageMonths": 0}', true, '2026-01-11 11:47:04.254291+00'),
	('996ea043-5fe2-46c1-956f-914fb9e2490d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ffbf4c6e-86c6-4550-ab2d-7e69dc4b7040", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00075", "ageMonths": 0}', true, '2026-01-11 11:47:04.599957+00'),
	('08246002-1aab-4441-a9df-bd63d76c3716', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "441766a6-8794-41e8-96dc-c694639c4a11", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00076", "ageMonths": 0}', true, '2026-01-11 11:47:04.997769+00'),
	('82610c6b-ec08-4398-8c10-4abca130567e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "da98a888-8c8f-4f8f-b00b-de0419b27c12", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00077", "ageMonths": 0}', true, '2026-01-11 11:47:05.395508+00'),
	('1137ae48-78bf-47e3-9914-7196c841ce96', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5737db3d-fc7f-4b55-af6a-b9d3d253f3d4", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00078", "ageMonths": 0}', true, '2026-01-11 11:47:05.738961+00'),
	('49e0e74e-56e4-41e2-af85-bcf10f32292b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "295e6bee-bb75-42ff-9cc0-1d07fb634bb6", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00079", "ageMonths": 0}', true, '2026-01-11 11:47:06.143482+00'),
	('20c2c801-f1c2-4e2f-8c74-38db401af851', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "4bc7feda-a58c-4b5c-85bc-19e9134bf74d", "orderId": "a47d4f87-541d-4730-8b9e-31cef6eb923f", "treeCode": "TREE-2026-00080", "ageMonths": 0}', true, '2026-01-11 11:47:06.509414+00'),
	('02ec739d-2101-40b2-8c7d-ad0bc330a97d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "e74493eb-69e2-44c9-9225-2fd729814540", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00081", "ageMonths": 0}', true, '2026-01-11 11:47:06.855579+00'),
	('b8738c75-082e-41ba-8281-6c9f378cc82b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3b99e9bc-57da-4684-b533-c4d69ff45f4f", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00082", "ageMonths": 0}', true, '2026-01-11 11:47:07.260487+00'),
	('981de950-369f-4873-b485-d39a0ea17f90', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3eac4a01-15b0-4323-b18f-19a296adcbe0", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00083", "ageMonths": 0}', true, '2026-01-11 11:47:07.63525+00'),
	('4fa3090b-6126-4a07-8ac9-f177fd1d3278', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7793aa94-e894-4ca3-a581-cc32f6f4e1d9", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00084", "ageMonths": 0}', true, '2026-01-11 11:47:08.224601+00'),
	('05924e21-6f7c-4a90-9dd9-c02868afa588', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6e11668f-3333-4068-912a-84706a913785", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00085", "ageMonths": 0}', true, '2026-01-11 11:47:08.62628+00'),
	('c3f1baba-9c2e-47bc-9223-d4603da55866', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "b60a955c-3e10-487e-9365-6dfcaf2d6861", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00086", "ageMonths": 0}', true, '2026-01-11 11:47:09.00145+00'),
	('45ef429e-bd3b-4b76-9d77-cc47b585079a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7fbd939f-402f-437b-860e-41168933b1ba", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00087", "ageMonths": 0}', true, '2026-01-11 11:47:09.374754+00'),
	('abfd3ecb-8b36-4fd0-8aaa-8423c9a8a523', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5304951b-fe30-4435-83d9-6385116b3dae", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00088", "ageMonths": 0}', true, '2026-01-11 11:47:09.74131+00'),
	('2b2a446c-44a4-4f8b-97e1-8a7e8fa0af0a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "43986484-fb35-45c2-b3d2-a52b327d7660", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00089", "ageMonths": 0}', true, '2026-01-11 11:47:10.142892+00'),
	('34836e7d-71cc-410f-a3a3-1f635f387c88', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "46ba5fdf-bea5-40cc-87cc-69635e7d1103", "orderId": "26f2edb0-7e2d-439a-9a2b-defab048e62f", "treeCode": "TREE-2026-00090", "ageMonths": 0}', true, '2026-01-11 11:47:10.489229+00'),
	('00ef2489-ee7d-45df-8c6e-a5a482e3e9e5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6c703024-1265-454c-8119-04675e59a3db", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00091", "ageMonths": 0}', true, '2026-01-11 11:47:10.871237+00'),
	('0f245463-aef0-47a6-b1bd-5893130b3f5d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "fce706bc-990e-4a0a-96d2-3a2328fd2560", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00092", "ageMonths": 0}', true, '2026-01-11 11:47:11.253551+00'),
	('9afaf2e5-6c55-476e-9155-deb2102250a2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5fd3e420-f20c-4e2a-a74a-95dd4b102e71", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00093", "ageMonths": 0}', true, '2026-01-11 11:47:11.596335+00'),
	('b682bb80-6e63-4988-b8d5-7e3c2b3ec05b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "e87a7ca4-00ca-4b79-b277-cf48556e4379", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00094", "ageMonths": 0}', true, '2026-01-11 11:47:11.985108+00'),
	('757e825f-33c0-4374-949f-631a23849e1a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "adfebe79-9aab-403c-a879-8cdecbbb80bd", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00095", "ageMonths": 0}', true, '2026-01-11 11:47:12.378469+00'),
	('113fb2ba-42b4-4ce2-b93c-782c4d69cdbd', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "b83d93e5-028a-4fbf-b18b-579e18041467", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00096", "ageMonths": 0}', true, '2026-01-11 11:47:12.809171+00'),
	('52d7953d-76bc-432c-9f00-4882e8eef543', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f8839d71-394b-4462-ab50-26c04d5cbad2", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00097", "ageMonths": 0}', true, '2026-01-11 11:47:13.209217+00'),
	('d1fce70d-1108-4b4d-b871-2c5036544c66', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d936b571-0be2-4a8c-b6a2-54fe8daab22e", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00098", "ageMonths": 0}', true, '2026-01-11 11:47:13.613528+00'),
	('70693076-d1b1-48b5-86a8-991bed8b0e30', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "74c9ff7a-b026-4464-abad-a842dd83c72b", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00099", "ageMonths": 0}', true, '2026-01-11 11:47:13.981982+00'),
	('1ffea35f-4fb9-413f-90e4-808569c57168', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3bc4ad12-7df3-4d82-8335-7722cf0586b7", "orderId": "9f0dc776-182a-4bd9-bcf2-bc571368f959", "treeCode": "TREE-2026-00100", "ageMonths": 0}', true, '2026-01-11 11:47:14.35688+00'),
	('b184d6d9-372c-482d-adf2-0a6acda4c139', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "079cf0dd-51a4-4cb9-9780-922fdbb9d3e4", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00101", "ageMonths": 0}', true, '2026-01-11 11:47:14.749192+00'),
	('1ad06e5e-f983-4d8b-b61f-0760b36b9b6b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "aab081b0-46ca-4fe7-aec6-5c3cbabed4d8", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00102", "ageMonths": 0}', true, '2026-01-11 11:47:15.099251+00'),
	('ad9462eb-9669-4e50-bdae-72ee0f9d0271', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2f24afa7-00d1-46ca-a382-5b2670a4c2ca", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00103", "ageMonths": 0}', true, '2026-01-11 11:47:15.465846+00'),
	('285a7486-01ff-4fe4-a505-bd263dad555d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3f1a6f2c-ec0a-4c72-a36b-88af5b27aedb", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00104", "ageMonths": 0}', true, '2026-01-11 11:47:15.860957+00'),
	('1bedf050-71fd-4939-8ac3-4bc334bf52c9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6ee656ab-8c81-4350-a3c2-b569fb765ea1", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00105", "ageMonths": 0}', true, '2026-01-11 11:47:16.217771+00'),
	('ab0f2e17-bbef-42de-93e2-6c856365a06e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "4fd9c775-59dd-49c9-ae88-d70024b486fc", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00106", "ageMonths": 0}', true, '2026-01-11 11:47:16.58804+00'),
	('08d8b21b-1e9d-4a85-8c7f-28dac71a7ed4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0c4fbafe-aa37-48f0-ba71-317e15a14e49", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00107", "ageMonths": 0}', true, '2026-01-11 11:47:16.971658+00'),
	('94347113-45e0-4572-9b84-319b1622093b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9789cba4-02e6-4eaf-b355-699f6f77fe0a", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00108", "ageMonths": 0}', true, '2026-01-11 11:47:17.324908+00'),
	('91f770a0-caf9-4ef1-a163-49ff27391ac6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5ec72f94-34c9-405f-83df-4c2e99af1c75", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00109", "ageMonths": 0}', true, '2026-01-11 11:47:17.706134+00'),
	('e2da250a-3b08-411d-a108-cae293fd9c89', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c9009bdb-bc42-4883-8009-64cd1096b42b", "orderId": "a46001d2-6b3e-4f5b-977f-29541f911ea5", "treeCode": "TREE-2026-00110", "ageMonths": 0}', true, '2026-01-11 11:47:18.110617+00'),
	('8553154e-f970-436a-a1e4-996c7b452536', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a79f3d1b-36f5-4d06-9067-41dae5c907fe", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00111", "ageMonths": 0}', true, '2026-01-11 11:47:18.478191+00'),
	('e9c67d84-9e5a-45ec-a3d1-55bfadf91f00', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "aad1f247-cbb7-4df5-a189-45f612032cfc", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00112", "ageMonths": 0}', true, '2026-01-11 11:47:18.856273+00'),
	('e377ea84-2f5f-4ade-98a9-91f303ceb7e0', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a74c00e2-3d09-4a4f-b030-e6a04aefa42c", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00113", "ageMonths": 0}', true, '2026-01-11 11:47:19.238506+00'),
	('b52843f8-04e4-420e-be28-148627e20615', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "21447c54-e809-4535-b93f-8f175005fba8", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00114", "ageMonths": 0}', true, '2026-01-11 11:47:19.592575+00'),
	('26f8faca-1ea7-4b43-969f-e31c5af91ef7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "186d7250-a9c6-4016-aef0-53a98784dd04", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00115", "ageMonths": 0}', true, '2026-01-11 11:47:19.972374+00'),
	('957d7627-515a-4d5e-bfc1-109a120c5d4c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "519d1cee-ba2d-49bb-83c1-3be2e80b1e13", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00116", "ageMonths": 0}', true, '2026-01-11 11:47:20.362113+00'),
	('6ac82693-0138-4c17-8092-53f11081d34c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6dc907e7-6645-4d31-8f61-9868cf7a879f", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00117", "ageMonths": 0}', true, '2026-01-11 11:47:20.767366+00'),
	('bd3523bf-1c53-4c24-8bf3-0f56b2aee67c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "e7ae2300-4246-4be0-98d0-d16e6913fdd8", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00118", "ageMonths": 0}', true, '2026-01-11 11:47:21.14644+00'),
	('aa260ef8-497d-4a88-bf0f-141fd1669f77', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5b9810a2-87f8-4106-b467-acab2e54a597", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00119", "ageMonths": 0}', true, '2026-01-11 11:47:21.534312+00'),
	('de399968-0588-4f02-acec-f3f19a4a9ccd', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7662376b-06c8-43fa-b504-a7539c32efda", "orderId": "ffc4b055-e31d-4baa-a1f4-3825f75d879a", "treeCode": "TREE-2026-00120", "ageMonths": 0}', true, '2026-01-11 11:47:21.882294+00'),
	('16254174-60b5-49a5-9993-d14206bac4a8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "34d103cb-ce66-44dc-95be-257e46a2f8e5", "orderId": "a4324264-3893-4442-8599-903da0c86d19", "treeCode": "TREE-2026-00121", "ageMonths": 0}', true, '2026-01-11 11:47:22.279833+00'),
	('fe250222-8630-46ec-869c-2fba424cc9d6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1d7347c2-c76b-4e86-acb8-2db02a34b7b3", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00122", "ageMonths": 0}', true, '2026-01-11 11:47:22.740679+00'),
	('27a6a7ef-e2e1-4d5d-ac27-8ef24d8c5c8f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ecd0fc82-4299-4a0c-a29b-7809aff9b294", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00123", "ageMonths": 0}', true, '2026-01-11 11:47:23.111699+00'),
	('b2875b70-b3e7-4029-a3fc-bec1f2e61ff9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "01e96f3f-78cd-4c96-a6ff-0485c8485236", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00124", "ageMonths": 0}', true, '2026-01-11 11:47:23.545994+00'),
	('0278f901-3b30-42d7-bacf-78dc342469b2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2aca4e79-81b8-4344-b70e-3ef0374dcf77", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00125", "ageMonths": 0}', true, '2026-01-11 11:47:23.945374+00'),
	('4c142397-b158-4dfb-86a2-82001eebcd72', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "75789368-44f9-438f-8550-ce5ab3793da0", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00126", "ageMonths": 0}', true, '2026-01-11 11:47:24.303086+00'),
	('10d5a311-ad65-41f9-9ce7-6cbc05712eb6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ee095200-e77b-4cb4-a18b-8eaa72b64e1e", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00127", "ageMonths": 0}', true, '2026-01-11 11:47:24.714639+00'),
	('da3fb422-51a7-4ac4-9f42-6a3343ffc037', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5b0572db-dd4b-4ad4-9829-a27bd989c81e", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00128", "ageMonths": 0}', true, '2026-01-11 11:47:25.127607+00'),
	('e4fdfd48-c3c3-44f4-840d-fe29d0290be8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "73e86126-347a-402c-a0dc-3792f1ef4738", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00129", "ageMonths": 0}', true, '2026-01-11 11:47:25.480337+00'),
	('76447959-e1d3-4d3e-b3cc-3731b330a897', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "71da33c7-7f01-4b85-a89a-15e96459d7b9", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00130", "ageMonths": 0}', true, '2026-01-11 11:47:25.8649+00'),
	('98ee561f-2fee-4f5e-ad26-be1bb58d16e4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2b38b43d-c575-49bd-8af2-38229080d84c", "orderId": "bf0e58c7-2ee1-449a-b084-7f476448688d", "treeCode": "TREE-2026-00131", "ageMonths": 0}', true, '2026-01-11 11:47:26.25599+00'),
	('b18651a5-0ff3-4aaa-8a71-1c0299980949', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ef45064b-f34d-4330-a27f-cfca0ecb1739", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00132", "ageMonths": 0}', true, '2026-01-11 11:47:26.610523+00'),
	('df10ea03-9f5b-4f68-8510-89e1796ce36a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "39f4df6c-03ac-4f10-b3f5-2ab04cd524ca", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00133", "ageMonths": 0}', true, '2026-01-11 11:47:26.998882+00'),
	('a5749874-d269-4d38-81e7-00a610d08457', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "57e4dc35-b56a-40a8-aa26-a0f4642acd4a", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00134", "ageMonths": 0}', true, '2026-01-11 11:47:27.411675+00'),
	('c49a4b84-2fea-43f0-a25c-7f338ecda0c6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3ba1533d-fad7-431d-9736-0f9dc653716e", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00135", "ageMonths": 0}', true, '2026-01-11 11:47:27.772445+00'),
	('75bc7bdb-4e6f-4144-8ccc-1afbfefbf08a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "8abe7aa5-8bab-4145-9059-c07b9698b973", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00136", "ageMonths": 0}', true, '2026-01-11 11:47:28.212052+00'),
	('d75e8047-4610-4c36-8c7c-d87298caff07', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "861f2216-5683-47e2-aa37-bf83e0ca2420", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00137", "ageMonths": 0}', true, '2026-01-11 11:47:28.591826+00'),
	('61a380a3-d36d-4572-b71e-a642409674a0', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "152c7fab-17c4-4628-b217-e168c2335753", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00138", "ageMonths": 0}', true, '2026-01-11 11:47:28.936865+00'),
	('59a3a6fc-4098-4225-8774-a9d6f3941b03', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "91882cde-6779-48a0-8418-73687f39dcef", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00139", "ageMonths": 0}', true, '2026-01-11 11:47:29.317149+00'),
	('a1138c51-25a3-438e-9c77-fa67ac1630b7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "e2f65a2a-d19d-46b0-b329-c33a13f3df18", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00140", "ageMonths": 0}', true, '2026-01-11 11:47:29.702601+00'),
	('75e3adee-29b3-478c-853f-1f1193db47c8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "28935b5f-dda9-49fb-81e0-d68a13ae34e5", "orderId": "88def0d3-bc17-4b94-8e71-6b47ed7b50f6", "treeCode": "TREE-2026-00141", "ageMonths": 0}', true, '2026-01-11 11:47:30.060204+00'),
	('9d164914-53bd-4589-8dd5-fd92c397c407', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ac543f9b-cf84-4fdb-a13b-457d9d9f971c", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00142", "ageMonths": 0}', true, '2026-01-11 11:47:30.462079+00'),
	('d852ca07-fe44-427b-ae9f-8fdecc62db5d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "813849b2-7a85-437f-af99-b93c356259f2", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00143", "ageMonths": 0}', true, '2026-01-11 11:47:30.853365+00'),
	('12289aee-ab17-4cdd-8c66-bfa7866f90fd', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "4836423d-838f-4a54-932d-9508b42323cf", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00144", "ageMonths": 0}', true, '2026-01-11 11:47:31.206141+00'),
	('ea3c93b3-734b-4011-b33f-b51de822914b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "aeb284e8-e53a-4db9-908c-13383d355855", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00145", "ageMonths": 0}', true, '2026-01-11 11:47:31.597246+00'),
	('b96f2c40-41a5-40e1-a7af-dd22675108b2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "bbba5d08-bf5c-4e63-80b8-a3b169f6b782", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00146", "ageMonths": 0}', true, '2026-01-11 11:47:31.973486+00'),
	('cdc537d5-6b47-442a-9006-a3871da3dba8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1ac9d47c-0a1c-4b8a-8bbd-cc2f1002ad69", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00147", "ageMonths": 0}', true, '2026-01-11 11:47:32.320158+00'),
	('d80aba05-0951-48eb-86ea-f937460a58fe', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d7e08539-cea5-410b-afaf-430b98f12850", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00148", "ageMonths": 0}', true, '2026-01-11 11:47:32.717646+00'),
	('5745ed90-d6ea-4f3e-b3e8-f71d7f2b7f21', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2b0291d9-f75c-4b5f-b2ca-c3bd6250e4ab", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00149", "ageMonths": 0}', true, '2026-01-11 11:47:33.108456+00'),
	('1848dd2d-385a-4d2f-b13f-3a417c98d492', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "856285fb-3064-459f-a3b1-70a0ca5e6c35", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00150", "ageMonths": 0}', true, '2026-01-11 11:47:33.471865+00'),
	('d69b5048-8d96-4224-b1dc-2879f4ff31af', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "283832a3-7622-43fb-842e-35ae5ad6184c", "orderId": "ea68b50c-9e6a-45ad-a2b5-4e0a6afcf1f9", "treeCode": "TREE-2026-00151", "ageMonths": 0}', true, '2026-01-11 11:47:33.852996+00'),
	('bf9e3824-3a49-4fe2-9e68-0460a3b0cff1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "fdb9afc2-1936-45eb-8e0d-089987ec5b2e", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00152", "ageMonths": 0}', true, '2026-01-11 11:47:34.263494+00'),
	('5b1cc6aa-5891-438e-a822-3964cc0b1881', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "230c19d6-10d5-4479-a3a3-3dd72c7eec91", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00153", "ageMonths": 0}', true, '2026-01-11 11:47:34.620709+00'),
	('4d66c123-8bbd-42f7-ab83-db8e2e63b716', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9060b35e-22c4-4855-a0cf-888545a900b0", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00154", "ageMonths": 0}', true, '2026-01-11 11:47:35.056065+00'),
	('45ec7259-ccd9-4040-b34a-d1c8056d53c5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "4f0d1c97-c21e-4fea-9198-566b33d0b482", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00155", "ageMonths": 0}', true, '2026-01-11 11:47:35.448287+00'),
	('ba236939-7f43-4da5-a35c-d6c6674b0679', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "320623ae-585c-4a7c-bf41-edb30b69816b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00156", "ageMonths": 0}', true, '2026-01-11 11:47:36.006224+00'),
	('58ae2f84-e5e4-4f48-b5b6-b25527b6aac4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "fe288653-b616-41b4-b2eb-43c3d1d8c228", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00157", "ageMonths": 0}', true, '2026-01-11 11:47:36.393416+00'),
	('ccd942b7-6a64-419a-bc97-3b747044e112', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "8433bec2-4cf2-433f-b0ec-4dc1ba2bf212", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00158", "ageMonths": 0}', true, '2026-01-11 11:47:36.779341+00'),
	('c7e8c654-4bf2-45f4-9a88-33673a58616a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "8c8e0bd1-8a6a-4e19-ae24-8e92e424fb43", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00159", "ageMonths": 0}', true, '2026-01-11 11:47:37.137175+00'),
	('c098aba1-add3-408e-ab4e-f2f5fc4d3d5b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "15ce689c-291c-407a-b36f-78df56cb790f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00160", "ageMonths": 0}', true, '2026-01-11 11:47:37.513293+00'),
	('f8b6b21f-0e91-4416-a8bd-689d24809ef2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "98ce9936-7e5f-4351-9499-cdc094126c80", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00161", "ageMonths": 0}', true, '2026-01-11 11:47:37.917258+00'),
	('5dcddec2-d404-4055-ba63-23136a32d7ac', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "050dfd1f-271b-417a-ae20-55bfa9b8697a", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00162", "ageMonths": 0}', true, '2026-01-11 11:47:38.286781+00'),
	('6f940ba5-c3c8-4f02-b27a-bac1034f6694', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "432d68d1-a3ba-4bef-9b63-88597006ed41", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00163", "ageMonths": 0}', true, '2026-01-11 11:47:38.791223+00'),
	('1488d01a-51c6-4f70-8d78-0ce26ce35b23', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9fc5fe85-e171-4e27-9f04-6cef2d32ab70", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00164", "ageMonths": 0}', true, '2026-01-11 11:47:39.216436+00'),
	('b4fe3d6c-1c80-423c-aadf-ec733b7bce99', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ad2d5e97-f2a7-4356-8238-e3abcc82ab90", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00165", "ageMonths": 0}', true, '2026-01-11 11:47:39.573778+00'),
	('02288221-a131-4cc2-95d1-6fa44eae9dc2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1d70b87b-7771-4a17-ba5c-587622fb129e", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00166", "ageMonths": 0}', true, '2026-01-11 11:47:40.087196+00'),
	('917eb0b2-8847-44f8-b7c2-b1252a341ba3', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0673844f-1a1c-4dcf-8665-a7fd86ac2843", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00167", "ageMonths": 0}', true, '2026-01-11 11:47:40.488385+00'),
	('d4c42c35-42fc-45ca-a41a-542c7d017f1f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f45154bf-76f3-40b9-84fb-dc6bc8280d5b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00168", "ageMonths": 0}', true, '2026-01-11 11:47:40.843905+00'),
	('b916c085-cc30-4eb5-8c8b-29cb2de2d35c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "df842af1-1439-4797-915a-223da3ff7ee7", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00169", "ageMonths": 0}', true, '2026-01-11 11:47:41.249724+00'),
	('d1d29fff-d76f-4151-b19e-731ccc75c3e6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "22b9de82-e6f9-483c-9dda-13015b22298e", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00170", "ageMonths": 0}', true, '2026-01-11 11:47:41.636208+00'),
	('9571b101-a80f-477e-bfa2-04c1ecb00c38', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ed304302-ea56-411b-89ab-0d965ade4e1d", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00171", "ageMonths": 0}', true, '2026-01-11 11:47:41.992329+00'),
	('17d32325-52c4-4506-bf60-d313b22755ae', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a0ea13d5-667b-413f-9ca2-7adde3d0987b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00172", "ageMonths": 0}', true, '2026-01-11 11:47:42.393174+00'),
	('3cec1e23-613b-4b56-b644-16252c39c03b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0f5777fa-98c7-4e0d-ac32-94db29d1b228", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00173", "ageMonths": 0}', true, '2026-01-11 11:47:43.023659+00'),
	('cb7415f0-2cd7-4335-adb5-95384bd1fcab', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "de222a55-fc8b-4645-bd53-003b2d12d06b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00174", "ageMonths": 0}', true, '2026-01-11 11:47:43.399393+00'),
	('087acf60-4f18-45de-b7dc-a00e527a5bec', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9c378ddf-e85c-4263-9e24-232c636492b2", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00175", "ageMonths": 0}', true, '2026-01-11 11:47:43.773969+00'),
	('5713703a-3baf-4e35-8fe4-db15d438127b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c48527cd-fff6-4a02-a5db-0eb47d371088", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00176", "ageMonths": 0}', true, '2026-01-11 11:47:44.114163+00'),
	('6dd51540-debf-4966-807a-2a171927bb0d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "688b480e-3242-4f21-8038-fdb7489ca28e", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00177", "ageMonths": 0}', true, '2026-01-11 11:47:44.516927+00'),
	('bdb64eaa-2b6f-4652-85f9-c16edcc163cb', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "b725d5c1-9702-41cc-a936-e6b2f6eaf4b3", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00178", "ageMonths": 0}', true, '2026-01-11 11:47:44.934115+00'),
	('42d1fa59-510a-4054-b627-e76c205b9ef5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9b701223-9ed8-4e3b-a2ab-d5e1cac638b9", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00179", "ageMonths": 0}', true, '2026-01-11 11:47:45.287678+00'),
	('fffde481-d4fe-4466-b952-6eddb7c9a0c4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6d55fe61-e245-490e-81c1-e2c83786c4ef", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00180", "ageMonths": 0}', true, '2026-01-11 11:47:45.679215+00'),
	('5fb5038f-292b-48e9-ad38-46eba4c34737', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "693d496a-d8b2-4e7b-b799-293a2c0389fe", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00181", "ageMonths": 0}', true, '2026-01-11 11:47:46.084116+00'),
	('9f26cb8b-96ae-46b6-a42f-7a4347e9983c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3f2b1b1e-1ae2-4c24-ab33-0bf075ecd41e", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00182", "ageMonths": 0}', true, '2026-01-11 11:47:46.436253+00'),
	('3fd656d8-855c-4a31-82ff-ed6aabc96970', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "dc3e20c0-1175-47ac-bb9f-efe48258f4c0", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00183", "ageMonths": 0}', true, '2026-01-11 11:47:47.026056+00'),
	('f049f071-2cf8-4b4c-a098-bf0920dfea70', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "04134332-3d9f-44d0-8068-32f263dfce3b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00184", "ageMonths": 0}', true, '2026-01-11 11:47:47.430121+00'),
	('816cc8d8-e6ad-40f9-b25a-bfc046935c61', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "139301e6-2efe-4e99-846d-eb4cdbe97232", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00185", "ageMonths": 0}', true, '2026-01-11 11:47:47.80111+00'),
	('b7fc0ed7-2f4b-4137-b908-964af8913f7d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d1673607-c8a2-4468-9e2c-570a75311b73", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00186", "ageMonths": 0}', true, '2026-01-11 11:47:48.204463+00'),
	('4ba41b1b-15b2-4c73-bc61-e42b8f1c2c42', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "988760d5-3d94-40e9-b78e-ba129442867f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00187", "ageMonths": 0}', true, '2026-01-11 11:47:48.592061+00'),
	('ab377563-431c-46ae-9f3a-b6991b995d81', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "efcf8c72-2129-4cfe-ad4b-511fb1052487", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00188", "ageMonths": 0}', true, '2026-01-11 11:47:48.946057+00'),
	('7e727e00-99b2-45dc-9d21-50405efe9aa5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "bbd16f7e-0b2b-404c-8ba6-4a8d79e91e1c", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00189", "ageMonths": 0}', true, '2026-01-11 11:47:49.334521+00'),
	('aa37bec4-79b7-4c84-92c8-2acb8b8e6961', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2f0bb761-a53c-44bf-80aa-5174c022c31c", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00190", "ageMonths": 0}', true, '2026-01-11 11:47:49.772061+00'),
	('262fdfcc-f250-4847-aaa4-ba1274aefef9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0d497d98-2240-4476-acab-3c8af5a1e179", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00191", "ageMonths": 0}', true, '2026-01-11 11:47:50.123028+00'),
	('9bf33162-3af6-426d-9f77-ecc77ea34929', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "fca67af8-2f33-49fc-8f9a-b7911331f654", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00192", "ageMonths": 0}', true, '2026-01-11 11:47:50.513048+00'),
	('5351a914-ad09-4b7d-99fc-370890fbd2f0', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7e7e7abc-d8d0-4027-90c2-51ff612f1613", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00193", "ageMonths": 0}', true, '2026-01-11 11:47:50.883538+00'),
	('1ef44775-10b3-46e2-827a-e5fde9b6f321', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "43ec803c-46bb-4a9c-9cc7-4db354fde9c7", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00194", "ageMonths": 0}', true, '2026-01-11 11:47:51.237782+00'),
	('df3e003b-75d7-4631-8c62-3e3078b35e97', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3004e3eb-3bc4-49e3-81cb-6921fc001546", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00195", "ageMonths": 0}', true, '2026-01-11 11:47:51.732805+00'),
	('1e143d2a-a670-45c2-a0ba-0a687e9c9a58', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3e8a840f-280a-4264-8ce0-003fc94a0dd6", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00196", "ageMonths": 0}', true, '2026-01-11 11:47:52.146058+00'),
	('44b9a70b-4dcd-450f-b042-d17dc155065a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3f4fa6ed-44b9-485f-bd5b-f92eb814992f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00197", "ageMonths": 0}', true, '2026-01-11 11:47:52.501304+00'),
	('33a63080-e56b-4f58-9233-9ffeabdf12ab', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "b6167052-f612-4889-a83f-6a98e121257f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00198", "ageMonths": 0}', true, '2026-01-11 11:47:52.907451+00'),
	('e32a481d-1a51-48c3-8fbc-eec6753e4253', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5b882b6f-821a-4b0b-aa60-814468ab77b9", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00199", "ageMonths": 0}', true, '2026-01-11 11:47:53.286715+00'),
	('727abe07-8a10-444e-8d6d-1bed1c784d44', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1558c65d-ba63-447f-8ff6-5abb4c341ff7", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00200", "ageMonths": 0}', true, '2026-01-11 11:47:53.645668+00'),
	('128dd137-ca65-4b31-a254-4093d1cc46ba', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "e9b87904-4705-4708-b6da-6cb055c34f88", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00201", "ageMonths": 0}', true, '2026-01-11 11:47:54.029636+00'),
	('8a023057-7c54-4814-bb41-f362ee704d3e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "869b5591-cb40-41f3-813e-b9f8ca4a60cd", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00202", "ageMonths": 0}', true, '2026-01-11 11:47:54.423269+00'),
	('0e948224-2b9a-4908-aa7f-4b26fe45ac4a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "cdfd84c9-fe59-4f0d-9fe0-20743663dace", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00203", "ageMonths": 0}', true, '2026-01-11 11:47:54.772197+00'),
	('8e8b3782-1789-44e5-8dac-b95556c7121b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "511d27e5-f941-4b22-9fd4-fbaad26b7c90", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00204", "ageMonths": 0}', true, '2026-01-11 11:47:55.150821+00'),
	('8f3f76eb-38a9-4e27-beb6-d4d118ac57c1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ee39a67f-4a54-4ed7-8b59-eb9db2040da1", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00205", "ageMonths": 0}', true, '2026-01-11 11:47:55.548426+00'),
	('736963b0-aa0a-40af-8522-f62b60c224ab', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "afb978e2-fc2f-43fa-a4e1-e54639f12a46", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00206", "ageMonths": 0}', true, '2026-01-11 11:47:55.907521+00'),
	('8daf442c-8a03-4b38-aff8-469ad6818653', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2b13c903-8d78-442f-97a7-f1b61b0d0f0e", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00207", "ageMonths": 0}', true, '2026-01-11 11:47:56.301834+00'),
	('33b6011a-1a51-4476-ae3b-c388b2f1fdb6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "60ef78a6-ab98-438a-8ab0-65c57180f1a5", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00208", "ageMonths": 0}', true, '2026-01-11 11:47:56.682779+00'),
	('b1828b94-d986-4b68-9ad1-7022c949048e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "350e5e93-7912-4739-95d0-6c37ff70a1ca", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00209", "ageMonths": 0}', true, '2026-01-11 11:47:57.048572+00'),
	('717af348-2ccd-4be9-bcf8-9074be9b6a6a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1a92b4b0-27e9-4811-876c-5f01fa88d3fb", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00210", "ageMonths": 0}', true, '2026-01-11 11:47:57.649638+00'),
	('0909fea4-3f8e-4d33-aecf-482a5da7f38b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "8cf85bda-c2e5-403c-b6b2-3ed44557b5b5", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00211", "ageMonths": 0}', true, '2026-01-11 11:47:58.02103+00'),
	('995f0181-be54-4b88-991c-425a61b54c4f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "282628bb-7eff-4ab6-9b9b-69acb7b17c6f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00212", "ageMonths": 0}', true, '2026-01-11 11:47:58.383428+00'),
	('f2891a01-f35f-46db-9b61-f801efaea885', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d3942baa-5182-455b-bbb1-ee9614a919b7", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00213", "ageMonths": 0}', true, '2026-01-11 11:47:58.764879+00'),
	('e80bf58c-564a-4386-9f8d-5b428395e9c5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2d01ba67-b40a-45fd-9915-695013be3295", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00214", "ageMonths": 0}', true, '2026-01-11 11:47:59.135679+00'),
	('6f01e792-006f-4366-a8b0-0707da97d47a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a8fcd43b-eedd-4b43-a49d-625b35cf806f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00215", "ageMonths": 0}', true, '2026-01-11 11:47:59.489246+00'),
	('69ee90c4-761a-40e8-a7b1-0141e63be9ff', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "30035b87-3280-4cda-8829-3bd07cf317e8", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00216", "ageMonths": 0}', true, '2026-01-11 11:47:59.904171+00'),
	('ad8354dd-81f3-46b4-b0b6-ca59093c5a4a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "23f3128e-ba0e-45ed-9ce9-e244314458ad", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00217", "ageMonths": 0}', true, '2026-01-11 11:48:00.289917+00'),
	('a4d362e0-23bd-4c55-a8aa-05aec22e12ce', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ba74280a-ef67-4161-802e-cc75d022a629", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00218", "ageMonths": 0}', true, '2026-01-11 11:48:00.642609+00'),
	('180951de-8ea9-4cd1-a90a-bb9827f91c37', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7bed708e-3c04-4eae-9d00-a41e60f984f6", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00219", "ageMonths": 0}', true, '2026-01-11 11:48:01.333586+00'),
	('29e2d2b0-1d75-41ee-90bc-ec86c9decf92', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7cd47b42-c91b-4a5d-b362-8d11e20e9583", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00220", "ageMonths": 0}', true, '2026-01-11 11:48:01.772115+00'),
	('f798875c-4b4a-4f3f-83dc-338c355be2c4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7e75036d-ffd6-4ee9-ad94-615c5ad488f7", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00221", "ageMonths": 0}', true, '2026-01-11 11:48:02.155531+00'),
	('7687ded2-5b6d-41e3-89b0-bbcf1adffe47', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a95d3be1-ede6-4d8f-8d0a-37b5f3df6607", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00222", "ageMonths": 0}', true, '2026-01-11 11:48:02.541974+00'),
	('8ff1190f-a702-49c2-b5f1-099bbf4eebd6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7952679c-8928-4bd0-97d0-40e7d67f7375", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00223", "ageMonths": 0}', true, '2026-01-11 11:48:02.883249+00'),
	('bcfb4d85-7244-473f-bab7-f5b1dc2262ff', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "61caa896-4005-403c-a002-e9d3d9245249", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00224", "ageMonths": 0}', true, '2026-01-11 11:48:03.264623+00'),
	('50bc57ea-b011-4e8f-8a42-8b2f185d6b38', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ef76f899-a6e7-4c6e-b8c3-7a70b5b9aa53", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00225", "ageMonths": 0}', true, '2026-01-11 11:48:03.672233+00'),
	('212b6e01-db5a-4287-9286-4bfc2f78ada5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "b543dd76-354c-4235-ae9c-1c3b1ddf9298", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00226", "ageMonths": 0}', true, '2026-01-11 11:48:04.193586+00'),
	('6afa6073-3b78-4418-8eed-293f25158f02', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "58934c11-d10c-4947-a731-901dd9f30119", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00227", "ageMonths": 0}', true, '2026-01-11 11:48:04.567209+00'),
	('9b64a0bb-877e-47b4-9671-78c3c091e7fd', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "457a451b-c1d4-4c62-b32d-9efea36b394b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00228", "ageMonths": 0}', true, '2026-01-11 11:48:04.939077+00'),
	('e1cfa86e-0a4b-449a-b1e3-7971c5db592f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a7ac942c-ffa3-4220-baa3-cafb95812818", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00229", "ageMonths": 0}', true, '2026-01-11 11:48:05.285091+00'),
	('93f79d65-de29-42cd-8355-7272844e5877', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9dce57bc-1b4f-42d0-b26e-fd088b5cce42", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00230", "ageMonths": 0}', true, '2026-01-11 11:48:05.657969+00'),
	('a4c8b48c-6780-4cf2-a8c6-7f8250b349b1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9254c00f-000f-4512-9baa-7e599ebb1d94", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00231", "ageMonths": 0}', true, '2026-01-11 11:48:06.028582+00'),
	('805ba577-9577-4d42-8ea3-fd938d04045c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1fbbecd2-e41b-46c3-afbf-403ea500f20a", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00232", "ageMonths": 0}', true, '2026-01-11 11:48:06.404305+00'),
	('c1ae7b8f-58d3-4adc-81e3-b1391af59813', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "cb687d0a-9adb-43b3-89b3-2e2c52ee8f45", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00233", "ageMonths": 0}', true, '2026-01-11 11:48:07.026936+00'),
	('83f6c8a3-9e1b-41fc-adad-8ce5fe243401', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "539c8478-1c40-42f0-bff7-4632c5fc32ed", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00234", "ageMonths": 0}', true, '2026-01-11 11:48:07.409415+00'),
	('440cff65-2df7-4948-9bc9-f8b6d9b62faa', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "4cf842f9-d346-4e86-ae4c-de366dd6e169", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00235", "ageMonths": 0}', true, '2026-01-11 11:48:07.808749+00'),
	('5c458a57-2efe-44ee-9e51-6937e805e004', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "2664038b-fc88-45fc-be22-efcd640c40bf", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00236", "ageMonths": 0}', true, '2026-01-11 11:48:08.193605+00'),
	('b4a698ac-a19a-40c4-92b1-5a7a1faa79ff', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d393034e-59e9-4341-8886-9fe6cf166887", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00237", "ageMonths": 0}', true, '2026-01-11 11:48:08.545349+00'),
	('80d68586-0f16-471c-96e0-49f023049639', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "761ecaf2-7ecf-41b8-a024-5dc8a664631b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00238", "ageMonths": 0}', true, '2026-01-11 11:48:09.003246+00'),
	('41320d77-6634-4309-883d-bb7f0fbd6623', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "80ced2f7-1879-4311-a7e9-d2e3833f40a2", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00239", "ageMonths": 0}', true, '2026-01-11 11:48:09.375175+00'),
	('330a7d6a-7964-413d-9364-71fdd31ab09b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "651d5f04-f88f-401c-b98e-b21b15f53c8b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00240", "ageMonths": 0}', true, '2026-01-11 11:48:09.736504+00'),
	('3d728f50-5bc5-4f0d-a752-33586c08f858', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0eac7d2e-83bb-486d-8ba6-53edf6409100", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00241", "ageMonths": 0}', true, '2026-01-11 11:48:10.101688+00'),
	('a144c7ad-2911-4bec-a888-04ff84cfda1e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c4c35ab4-3eb8-43d0-986b-b292d6ea3a60", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00242", "ageMonths": 0}', true, '2026-01-11 11:48:10.555048+00'),
	('f7eede11-9d45-41d9-b672-01c5154013e2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "42878b6c-5104-4467-925f-a7db16d31e57", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00243", "ageMonths": 0}', true, '2026-01-11 11:48:10.907558+00'),
	('caacd652-0f3b-4569-8c19-9db05b5c35c9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f4e0ed6e-f322-4fc3-a7bd-5d826b5f7bc4", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00244", "ageMonths": 0}', true, '2026-01-11 11:48:11.330876+00'),
	('fb629055-8b8f-458b-9a1e-547a6147e5d7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "64d71d47-c31d-48ac-9a89-8ad975c93d4c", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00245", "ageMonths": 0}', true, '2026-01-11 11:48:11.732695+00'),
	('7ff29716-8552-4e00-91db-f0792eb9f065', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "cc1295b5-004d-4e69-a9a0-e768c3f7bf4d", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00246", "ageMonths": 0}', true, '2026-01-11 11:48:12.081916+00'),
	('4ad0d493-9249-4589-ab11-5ea51c56d944', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d2a12e2e-4e59-4f73-9896-c356670b1cc4", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00247", "ageMonths": 0}', true, '2026-01-11 11:48:12.479439+00'),
	('880b1428-5874-4431-9d16-25026bb73352', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "eb190a42-30bc-49b7-94d2-51421315eb28", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00248", "ageMonths": 0}', true, '2026-01-11 11:48:12.853574+00'),
	('c47cc865-e49e-4f02-8593-e26a1171293f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6a23a7ef-1c16-437e-bba1-8db8f8e1450a", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00249", "ageMonths": 0}', true, '2026-01-11 11:48:13.209755+00'),
	('b8ad46b1-25fe-49b8-8ae5-08c98273df49', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "659fc1a9-53a3-46d8-a5e2-0d8834fd745f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00250", "ageMonths": 0}', true, '2026-01-11 11:48:13.599337+00'),
	('d13554d6-013b-4c76-a45e-423a2c9a7b25', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "5297bb2c-527b-425e-a5ef-4440605e7975", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00251", "ageMonths": 0}', true, '2026-01-11 11:48:13.989791+00'),
	('67a460a3-08c4-4713-87d2-0f2cc6db8cce', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "51c7fb3c-98a5-4484-9aa8-7860f5a6aa15", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00252", "ageMonths": 0}', true, '2026-01-11 11:48:14.335191+00'),
	('6a45be27-a1ab-4193-a8bb-3f2681a3467c', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "4208f785-7da5-4849-944a-1aec776482ea", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00253", "ageMonths": 0}', true, '2026-01-11 11:48:14.749977+00'),
	('8404c55a-ffa6-44d2-a918-7ad0ae5251a7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "37f77d90-d623-4a7d-966a-54fec1cf5722", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00254", "ageMonths": 0}', true, '2026-01-11 11:48:15.12084+00'),
	('0571746b-5b76-4e76-86c4-5369e195a16f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3ade7989-2483-448c-ad85-0929eaf635ec", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00255", "ageMonths": 0}', true, '2026-01-11 11:48:15.459046+00'),
	('fd9ff78f-4c37-4fec-91d2-86b2a533cfcc', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "51d22f30-50f3-4ab0-8fb6-86d6bd5d90ef", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00256", "ageMonths": 0}', true, '2026-01-11 11:48:15.830435+00'),
	('efcf91f0-187d-4cf7-ad3d-30b613de0bf8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "fdefa793-9d9f-42c3-9db3-6c93559d8667", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00257", "ageMonths": 0}', true, '2026-01-11 11:48:16.21106+00'),
	('4ff7a018-b7a6-4f8e-bf0a-e2614c8e2efc', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ec41130c-fdd5-4612-bc4a-ee608b9522c8", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00258", "ageMonths": 0}', true, '2026-01-11 11:48:16.550372+00'),
	('a61bcfa9-cfee-407d-8293-3c96d14bfaa6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "7cb1a99e-30dc-4523-882d-b1ce93d20c9f", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00259", "ageMonths": 0}', true, '2026-01-11 11:48:16.950174+00'),
	('7e9bff86-7924-4c54-8158-c36d2a143e72', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "53fe5283-99fe-43b6-9dd4-538a493efc25", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00260", "ageMonths": 0}', true, '2026-01-11 11:48:17.599745+00'),
	('8093e943-07bf-4930-9ad1-c3a42fbc4c49', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0e2db2b0-adb6-4125-830b-2a316dc149bd", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00261", "ageMonths": 0}', true, '2026-01-11 11:48:17.9787+00'),
	('7accfaee-3d99-471c-ba46-3e7e454a7e7d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "f6c3016a-ea9f-45bd-a4ff-c2132e5e8879", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00262", "ageMonths": 0}', true, '2026-01-11 11:48:18.356144+00'),
	('2d6a225d-c4f7-4f16-a8da-5cdf5b7bd4e1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "de6ce6f7-8ba5-48db-ab4a-3eaf6d325caa", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00263", "ageMonths": 0}', true, '2026-01-11 11:48:18.736499+00'),
	('194f270e-7556-499e-9bd5-13dda9d830c9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0125997c-2a76-4ca1-89ec-0d50b10c0de2", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00264", "ageMonths": 0}', true, '2026-01-11 11:48:19.111958+00'),
	('a9d9078a-f429-4955-9809-f4120058933f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1253e500-95d8-490c-8bd4-3f1a14ef09bf", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00265", "ageMonths": 0}', true, '2026-01-11 11:48:19.521672+00'),
	('81685682-d529-4f42-a942-e0cc72a857fa', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3559791b-75fe-49ec-80df-ca893bdc0463", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00266", "ageMonths": 0}', true, '2026-01-11 11:48:19.874988+00'),
	('2037a27d-132d-4cc5-97fb-ade325d058ea', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "41ba51bc-a335-4f84-81d2-6cc1c6ce7075", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00267", "ageMonths": 0}', true, '2026-01-11 11:48:20.254922+00'),
	('708382bf-bbfc-40bb-9ee1-2ae97ad86e3f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "d4b27cb7-d2cf-4d9c-9b07-a91cbd9386ec", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00268", "ageMonths": 0}', true, '2026-01-11 11:48:20.631098+00'),
	('25dc1d60-88d5-4af6-91dd-857890d9d337', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "39b9d686-292b-4d42-b776-117fca50c558", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00269", "ageMonths": 0}', true, '2026-01-11 11:48:20.988557+00'),
	('b9e3140e-81dd-47dd-9004-614287584c03', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "33efc9f2-a6dd-400f-b92b-0c7fecb45b40", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00270", "ageMonths": 0}', true, '2026-01-11 11:48:21.358783+00'),
	('e65b819b-b4b6-4642-8e97-63526ea4aeb4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "72f75627-606f-4ce6-b85e-3161e7ca413a", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00271", "ageMonths": 0}', true, '2026-01-11 11:48:21.744842+00'),
	('c501e815-ee83-4e80-954d-77379a13a12d', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "fe2ee92e-1c88-4614-af92-be7f9200d5a7", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00272", "ageMonths": 0}', true, '2026-01-11 11:48:22.113736+00'),
	('dc7fae14-a6a8-4d2d-90c2-e6a3d480f6f1', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "6e67fdfd-fdbf-417b-a18e-65cdcec837dd", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00273", "ageMonths": 0}', true, '2026-01-11 11:48:22.486094+00'),
	('76b80012-6001-45d6-9bff-1bbda21cb1d9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "3a82193f-d746-49c8-948c-38730c3a098b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00274", "ageMonths": 0}', true, '2026-01-11 11:48:22.888472+00'),
	('acffc25b-b5fd-441b-8623-2f0c21291f28', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "433575fc-8fd8-4ad5-8d87-a63947965763", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00275", "ageMonths": 0}', true, '2026-01-11 11:48:23.236255+00'),
	('2093e116-7e18-4153-9cea-d4ba0445640e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "83b2aa0e-e962-4d9d-a829-09fea8482b8c", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00276", "ageMonths": 0}', true, '2026-01-11 11:48:23.63213+00'),
	('11b5f0cf-6553-4a64-b4e3-e50a95ae56e8', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "8438df52-808a-447c-95ac-72cf3057f073", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00277", "ageMonths": 0}', true, '2026-01-11 11:48:24.016528+00'),
	('81e74df7-e236-4dbb-8b9b-04dac61c3d51', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "bfe5c0ba-2ab5-4652-85b7-2ea45c3e98ba", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00278", "ageMonths": 0}', true, '2026-01-11 11:48:24.385273+00'),
	('adbb0766-5c36-4731-ace8-82ffdd6df693', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c0ddfab7-479e-4658-b623-90b761bacaf2", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00279", "ageMonths": 0}', true, '2026-01-11 11:48:24.773428+00'),
	('2a54aaa4-01ae-4f41-8eca-108e112fd3e9', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "8096938e-f7f8-4af5-a937-22fde191304a", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00280", "ageMonths": 0}', true, '2026-01-11 11:48:25.17429+00'),
	('52ec702c-f148-4eed-89d4-cc8711bc69ba', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9e3ab825-12f8-4321-90c8-ba852280d4b3", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00281", "ageMonths": 0}', true, '2026-01-11 11:48:25.533062+00'),
	('5541c9ae-b404-4f0b-9f16-f48c447ddb8e', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "a1120639-9c8d-47e5-8de3-532f1b8ebcb1", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00282", "ageMonths": 0}', true, '2026-01-11 11:48:25.967648+00'),
	('46345564-c68f-4a33-96bb-3114523afb9f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ad8a0325-13a5-4394-bac7-8e983d7127f3", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00283", "ageMonths": 0}', true, '2026-01-11 11:48:26.386562+00'),
	('97de91bc-113d-4721-a89e-cdf3ea576d3f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "38f04acc-a925-4e40-8d9a-60faef63ea3c", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00284", "ageMonths": 0}', true, '2026-01-11 11:48:26.738389+00'),
	('62ababa8-039e-4a4e-9e12-35f838128299', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "10462ca6-4be5-4361-9080-846997598f34", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00285", "ageMonths": 0}', true, '2026-01-11 11:48:27.11858+00'),
	('a083c5ad-a574-498a-b649-e7948135237a', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "66e0db2a-c395-46b0-bf1a-cd8f58a0038b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00286", "ageMonths": 0}', true, '2026-01-11 11:48:27.505134+00'),
	('5a49da45-2d3d-46d1-974a-312f210cf4a6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ba9d7d65-5e22-422a-b549-51a1a86c5e57", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00287", "ageMonths": 0}', true, '2026-01-11 11:48:27.859823+00'),
	('779fcd62-ccc9-4954-94d0-ccc14cbcc8ea', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "80158421-330f-4184-b39d-61c978dd6a94", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00288", "ageMonths": 0}', true, '2026-01-11 11:48:28.262988+00'),
	('eef46163-ebc3-4ed6-a808-1e7d5ac915cc', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "e08a4fba-2157-4231-937f-76ea6cc0e624", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00289", "ageMonths": 0}', true, '2026-01-11 11:48:28.644909+00'),
	('341fe7b7-874f-4c67-b355-587a3407aaa7', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c5cd0a52-ac9f-4041-b43e-7ec88d1cab74", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00290", "ageMonths": 0}', true, '2026-01-11 11:48:29.008111+00'),
	('9327f88b-8313-4677-8437-2f717bd47bec', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "aee2152d-43a8-4e3f-a582-3e0fe5517b80", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00291", "ageMonths": 0}', true, '2026-01-11 11:48:29.391124+00'),
	('35a44f9a-d55c-4210-b06b-903325704144', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "ca422328-d3d9-454f-a15e-b35893aa1504", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00292", "ageMonths": 0}', true, '2026-01-11 11:48:29.778041+00'),
	('68a6cb1d-bd3d-488e-86b4-16893a963c0b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1a5e7799-28f6-41aa-83d7-6ab402039653", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00293", "ageMonths": 0}', true, '2026-01-11 11:48:30.135404+00'),
	('ecc96d53-89d1-4d33-84a5-1d7ac7947533', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "9093b879-5eb4-43c1-b1f2-dc3e95d11470", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00294", "ageMonths": 0}', true, '2026-01-11 11:48:30.520366+00'),
	('2db9d1e6-5b7d-447c-9db1-b7c2da3b5605', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "bbf548f6-90e6-41c6-835b-54e328fa3b66", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00295", "ageMonths": 0}', true, '2026-01-11 11:48:30.899953+00'),
	('d371c248-b589-4271-bd31-db5c238002a2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c5728141-f1f5-4378-be40-4101eb5c1edc", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00296", "ageMonths": 0}', true, '2026-01-11 11:48:31.248696+00'),
	('bd64b82c-2fca-421b-86a5-5daf1f6a0ce6', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "20123360-5fb2-4d0c-8199-b12c4d909f75", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00297", "ageMonths": 0}', true, '2026-01-11 11:48:31.6464+00'),
	('8ae597e6-0746-4e34-8636-b570dab117db', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "0032a214-1b4c-40ef-9b2c-57f41663a4d0", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00298", "ageMonths": 0}', true, '2026-01-11 11:48:32.017132+00'),
	('69f14a59-16bc-4619-af28-6fbad54e331b', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "c5ee58e6-e490-4355-ae32-b22cb2a0fc54", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00299", "ageMonths": 0}', true, '2026-01-11 11:48:32.369133+00'),
	('44ffe58d-ff87-4626-b222-3a06e94fb0d5', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "414ae40d-c71f-4c67-9c00-59a3ec0c757b", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00300", "ageMonths": 0}', true, '2026-01-11 11:48:32.773765+00'),
	('4547454c-2ea3-49c6-8293-56884e0cf8b4', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "014f7368-9f5d-4e10-8b5c-dd8d5111b0b0", "orderId": "fa36f511-85ea-411e-873d-40eb5a161e0e", "treeCode": "TREE-2026-00301", "ageMonths": 0}', true, '2026-01-11 11:48:33.158208+00'),
	('dea6cd02-3b39-4def-8588-dd60a878609f', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', 'harvest_ready', 'Cây sẵn sàng thu hoạch', NULL, '{"treeId": "1acfcb7e-66e4-421f-b20a-6b4d31c2ac45", "orderId": "543044d9-745f-479a-a17c-2a60ba130645", "treeCode": "TREE-2026-00310", "ageMonths": 0}', true, '2026-01-11 11:48:37.297249+00');


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."posts" ("id", "title", "slug", "excerpt", "content", "cover_image", "status", "published_at", "scheduled_at", "author_id", "tags", "meta_title", "meta_desc", "view_count", "created_at", "updated_at") VALUES
	('25e051b6-8697-4ef1-9109-594a9644824b', '5 Lý Do Nên Trồng Cây Dó Đen Để Đầu Tư Dài Hạn', '5-ly-do-trong-cay-do-den-dau-tu-dai-han', '1 ha cây Dó Đen tạo trầm có thể mang lại 1,5–1,8 tỷ đồng trong 10 năm. Thị trường trầm hương toàn cầu trị giá 32 tỷ USD đang tăng trưởng 8,2%/năm. Nhưng lý do đáng nói hơn không phải ở những con số.', '<p>Khi nói đến đầu tư nông nghiệp tại Việt Nam, người ta thường nghĩ đến cà phê, tiêu, sầu riêng. Cây Dó Đen hiếm khi xuất hiện trong danh sách ấy — không phải vì nó kém giá trị, mà vì không nhiều người hiểu đủ về nó để tin tưởng.</p>

<p>Bài viết này không có ý thuyết phục ai đầu tư. Nó chỉ trình bày sự thật mà chúng tôi đã tìm hiểu — để bạn tự quyết định.</p>

<h2>1. Sản phẩm đầu ra có thị trường tiêu thụ hàng chục tỷ đô</h2>

<p>Trầm hương từ cây Dó Đen (<em>Aquilaria crassna</em>) là nguyên liệu cho ngành nước hoa cao cấp toàn cầu. Tinh dầu oud — chưng cất từ gỗ trầm — là thành phần trong các dòng nước hoa của Chanel, Dior, Tom Ford và hàng trăm nhà chế tác Trung Đông.</p>

<p>Thị trường trầm hương toàn cầu hiện đạt <strong>32 tỷ USD</strong>, tăng trưởng <strong>8,2%/năm</strong>, dự kiến đạt <strong>64 tỷ USD vào năm 2029</strong>. Đây không phải thị trường ngách — đây là ngành công nghiệp lớn với nhu cầu tăng liên tục trong khi nguồn cung tự nhiên ngày càng khan hiếm.</p>

<p>Trầm hương trồng nhân tạo chất lượng trung bình đạt <strong>500–7.000 USD/kg</strong>. Loại hảo hạng có thể vượt <strong>80.000 USD/kg</strong>. Với giá xuất khẩu ngay cả ở phân khúc thấp, 1 ha cây Dó Đen tạo trầm có thể mang lại <strong>1,5–1,8 tỷ đồng trong 10 năm</strong>.</p>

<h2>2. Nguồn cung tự nhiên đang cạn kiệt — không thể phục hồi nhanh</h2>

<p>Cây Dó Đen trong tự nhiên đã nằm trong <strong>Phụ lục II của CITES</strong> — danh sách loài đang đứng trước nguy cơ tuyệt chủng. Khai thác rừng tự nhiên bị kiểm soát gắt gẽ trên toàn thế giới.</p>

<p>Điều này tạo ra một khoảng trống cung cầu ngày càng lớn: nhu cầu tăng, nguồn cung tự nhiên giảm. Trầm hương trồng nhân tạo đang lấp đầy khoảng trống ấy — và từ năm 2017, lần đầu tiên trong lịch sử, lượng trầm hương từ cây trồng đã vượt qua trầm khai thác tự nhiên trong dữ liệu CITES.</p>

<p>Những người tham gia vào việc xây dựng nguồn cung hợp pháp, bền vững ngay lúc này đang đặt cược vào đúng hướng của lịch sử.</p>

<h2>3. Công nghệ đã rút ngắn chu kỳ từ hàng chục năm xuống còn 7–10 năm</h2>

<p>Trầm hương tự nhiên cần 20–50 năm mới hình thành trong cây. Đó là lý do nó hiếm — và quý.</p>

<p>Kỹ thuật cấy tạo trầm nhân tạo hiện đại — đưa nấm sinh học hoặc chất kích thích vào thân cây qua lỗ khoan 5mm — có thể kích hoạt quá trình tạo nhựa trong <strong>6–18 tháng</strong>. Cây Dó Đen đạt đường kính đủ để cấy sau khoảng <strong>5–8 năm trồng</strong>. Tổng chu kỳ từ cây giống đến thu hoạch trầm đầu tiên: <strong>7–10 năm</strong>.</p>

<p>Đây vẫn là đầu tư dài hạn. Nhưng nó có nghĩa là bạn đang đầu tư vào thứ có thể định giá, có thể kiểm chứng, và có thị trường đầu ra rõ ràng.</p>

<h2>4. Toàn bộ cây đều có giá trị — không có phần bỏ đi</h2>

<p>Không như nhiều loại cây trồng, cây Dó Đen không có phế phẩm:</p>

<ul>
<li><strong>Gỗ trầm</strong> (phần chứa nhựa): bán thô hoặc chế tác đồ thủ công, hương liệu</li>
<li><strong>Tinh dầu</strong>: chưng cất từ gỗ và vỏ, dùng trong nước hoa và y học</li>
<li><strong>Lá và cành</strong>: nguyên liệu trà thảo mộc đang được thị trường Nhật Bản và Hàn Quốc đón nhận mạnh</li>
<li><strong>Gỗ trắng</strong> (không tạo trầm): vẫn có giá trị gỗ thông thường</li>
</ul>

<p>Mô hình doanh thu đa tầng này làm giảm rủi ro đáng kể so với canh tác độc canh.</p>

<h2>5. Đây là đầu tư có thể ngủ ngon</h2>

<p>Không phải vì nó an toàn tuyệt đối — không có khoản đầu tư nào như vậy. Mà vì bản chất của nó: <em>bạn trồng cây, đội ngũ chăm sóc, thời gian làm phần còn lại</em>.</p>

<p>Bạn không cần theo dõi giá cổ phiếu mỗi ngày. Không cần lo thị trường sụp đổ qua đêm (thị trường trầm hương đã tăng liên tục suốt 30 năm). Không cần quản lý nhân công hay lo lắng khi có lũ lụt ngắn hạn — cây Dó Đen là loài cây bền bỉ, phù hợp với khí hậu nhiệt đới.</p>

<p>Quan trọng hơn: mỗi cây bạn trồng là <em>tài sản thực</em>. Nó lớn lên. Nó có thể nhìn thấy và chụp ảnh. Đội kỹ thuật Đại Ngàn Xanh cập nhật ảnh thực địa định kỳ về tài khoản của bạn — bạn biết cây của mình đang ở đâu, cao bao nhiêu, khỏe mạnh như thế nào.</p>

<div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 24px; margin: 32px 0;">
<p style="margin: 0; color: #065f46; font-style: italic; font-size: 1.05em;">"Người trồng cây hôm nay không phải là người hưởng bóng mát ngay — nhưng con cháu họ sẽ ngồi dưới bóng cây ấy, và thế giới sẽ thở dễ hơn nhờ nó."</p>
</div>

<h2>Câu hỏi đúng không phải "Có nên đầu tư không?"</h2>

<p>Câu hỏi đúng là: <em>Đây có phải dự án đáng tin không?</em></p>

<p>Chúng tôi tin câu trả lời phải được xây dựng từ bằng chứng, không từ lời hứa. Vì vậy, Đại Ngàn Xanh cam kết: mỗi cây trồng được gắn GPS, ảnh cập nhật mỗi quý, báo cáo sinh trưởng định kỳ, và hợp đồng minh bạch về quyền lợi của chủ sở hữu.</p>

<p>Bạn không cần tin lời chúng tôi. Bạn chỉ cần xem những gì chúng tôi đã làm — và những gì bạn có thể tự kiểm chứng.</p>

<div style="background: linear-gradient(135deg, #064e3b, #065f46); border-radius: 16px; padding: 32px; margin: 40px 0; color: white; text-align: center;">
<h3 style="color: #6ee7b7; margin-bottom: 12px;">Sở hữu cây Dó Đen đầu tiên của bạn</h3>
<p style="color: #d1fae5; margin-bottom: 0;">Chỉ 260.000đ/cây. Không cần đất. Không cần kinh nghiệm. Chỉ cần quyết định bắt đầu.</p>
</div>', NULL, 'published', '2026-03-22 08:00:00+00', NULL, NULL, '{"đầu tư","dó đen","nông nghiệp bền vững"}', NULL, NULL, 0, '2026-03-28 07:13:19.506752+00', '2026-03-28 07:24:07.025313+00'),
	('0dda3d0c-c0ab-4ffe-a5f8-7f4670daa43c', 'Quy Trình Chăm Sóc Cây Dó Đen — Từ Giống Đến Thu Hoạch', 'quy-trinh-cham-soc-cay-do-den', 'Mỗi cây Dó Đen tại Đại Ngàn Xanh trải qua hành trình 7–10 năm từ cây giống đến khi tạo trầm. Đây là quy trình kỹ thuật — và lý do tại sao sự kiên nhẫn là điều kiện tiên quyết của dự án này.', '<p>Năm 2012, một nhóm nhà khoa học tại Trung Quốc thử nghiệm kỹ thuật gọi là Agar-Wit — toàn bộ cây hấp thụ chất kích thích tạo trầm qua hệ thống truyền dịch, thay vì chỉ vài điểm khoan riêng lẻ. Kết quả: trầm hình thành lan rộng từ thân xuống rễ và lên cành. Lần đầu tiên, con người có thể can thiệp vào quá trình mà thiên nhiên thường mất hàng chục năm để hoàn thành.</p>

<p>Kỹ thuật ấy — và nhiều thế hệ cải tiến sau đó — là nền tảng của những gì chúng tôi áp dụng tại Đại Ngàn Xanh. Nhưng khoa học chỉ là một phần. Phần còn lại là sự kiên nhẫn, kỷ luật, và thái độ đúng đắn với tự nhiên.</p>

<h2>Giai đoạn 1: Chọn giống — Nền tảng của mọi thứ</h2>

<p>Không phải cây Dó nào cũng cho trầm tốt như nhau. Giống cây là quyết định đầu tiên và quan trọng nhất.</p>

<p><em>Aquilaria crassna</em> — loài Dó Đen bản địa Việt Nam — được Giáo sư Gishi Honda (Đại học Tokyo) đánh giá là loài cho trầm hương chất lượng cao nhất thế giới, nhờ điều kiện khí hậu và thổ nhưỡng đặc thù của các tỉnh ven biển miền Trung. Dự án Đại Ngàn Xanh sử dụng giống từ các vùng Khánh Hòa và Quảng Nam — nơi có lịch sử trầm hương hàng trăm năm.</p>

<p>Cây giống được kiểm tra nguồn gốc, sức sống, và khả năng thích nghi trước khi đưa ra vườn ươm. Không phải vì chúng tôi cầu kỳ — mà vì một cây giống kém sẽ kéo theo mười năm lãng phí.</p>

<h2>Giai đoạn 2: Vườn ươm và trồng ra đất (Năm 1)</h2>

<p>Hạt Dó Đen mất khả năng nảy mầm rất nhanh sau khi rụng — đây là một trong những thách thức kỹ thuật của loài cây này. Cây con được gieo và ươm trong điều kiện có kiểm soát, tưới tiêu đúng độ ẩm, che nắng giai đoạn đầu.</p>

<p>Khi cây đạt chiều cao 60–90 cm, đủ sức để chịu đựng điều kiện bên ngoài, sẽ được chuyển ra đất trồng với khoảng cách <strong>3×3m</strong> — đủ ánh sáng, đủ không gian để rễ phát triển, đủ thông thoáng để giảm nguy cơ sâu bệnh.</p>

<h2>Giai đoạn 3: Chăm sóc tăng trưởng (Năm 2–5)</h2>

<p>Dó Đen là loài tương đối bền bỉ — chịu được đất cằn, thích nghi tốt với khí hậu nhiệt đới. Nhưng "bền bỉ" không có nghĩa là "không cần chăm sóc". Giai đoạn này đòi hỏi:</p>

<ul>
<li><strong>Bón phân hữu cơ định kỳ</strong> — tăng dinh dưỡng cho đất, không dùng hóa chất ảnh hưởng chất lượng trầm sau này</li>
<li><strong>Phòng trừ sâu bệnh</strong> — đặc biệt các loài bọ cánh cứng đục thân, có thể gây hại nghiêm trọng ở giai đoạn non</li>
<li><strong>Giám sát sinh trưởng mỗi quý</strong> — đội kỹ thuật đo chiều cao, đường kính thân, đánh giá sức khỏe từng cây và ghi nhận vào hệ thống</li>
<li><strong>Chụp ảnh thực địa</strong> — cập nhật lên tài khoản của từng chủ sở hữu cây</li>
</ul>

<h2>Giai đoạn 4: Cấy tạo trầm — Khoa học gặp tự nhiên (Năm 6–8)</h2>

<p>Đây là giai đoạn then chốt. Khi cây đạt <strong>đường kính thân ≥8cm</strong> (thường sau 5–8 năm trong điều kiện nhiệt đới), kỹ thuật viên tiến hành cấy tạo trầm.</p>

<p>Quy trình bao gồm:</p>
<ol>
<li>Khoan lỗ nhỏ (5mm) tại vị trí 50cm cách mặt đất</li>
<li>Đưa chất kích thích sinh học — hỗn hợp nấm đặc hiệu và phytohormone — vào hệ thống dẫn nhựa của cây</li>
<li>Cây phản ứng bằng cách tiết nhựa quanh vùng bị kích thích</li>
<li>Nhựa dần tích tụ, biến đổi thành hợp chất thơm theo thời gian</li>
</ol>

<p>Các nghiên cứu cho thấy trầm bắt đầu hình thành rõ rệt sau <strong>6–18 tháng</strong> kể từ khi cấy, tùy phương pháp và điều kiện cây. Kỹ thuật Agar-Wit (toàn thân) cho phép trầm lan rộng khắp cây thay vì tập trung cục bộ.</p>

<h2>Giai đoạn 5: Thu hoạch và chế biến (Năm 8–10+)</h2>

<p>Thu hoạch trầm không có nghĩa là chặt cây. Kỹ thuật viên đánh giá từng cây, xác định phần gỗ đã thấm nhựa đủ tiêu chuẩn, và khai thác một phần — giữ lại phần còn lại để cây tiếp tục tạo trầm trong những năm sau.</p>

<p>Trầm sau khai thác được phân loại theo hàm lượng dầu:</p>
<ul>
<li>Hạng nhất: hàm lượng dầu &gt;25% — giá tốt nhất</li>
<li>Hạng hai: 20–25%</li>
<li>Hạng ba: 15–20%</li>
</ul>

<p>Phần không đủ tiêu chuẩn gỗ trầm vẫn được chưng cất lấy tinh dầu, hoặc xay thành bột trầm dùng trong hương nhang. Không có phần nào bị bỏ đi.</p>

<h2>Điều không thể quy trình hóa: Trách nhiệm với cây</h2>

<p>Làm việc với cây Dó Đen dạy chúng tôi một điều: không có quy trình nào thay thế được sự chăm chú thực sự. Một kỹ thuật viên đi qua vườn cây mỗi tuần, nhìn vào từng cây, nhận ra cây nào đang yếu — điều đó không có thuật toán nào làm được.</p>

<p>Đó là lý do Đại Ngàn Xanh xây dựng đội ngũ kỹ thuật nông nghiệp tại chỗ, không outsource. Và đó là lý do mỗi quý, bạn nhận được ảnh thực địa của cây mình sở hữu — không phải ảnh minh họa, mà là ảnh thật từ vườn cây thật.</p>

<div style="background: linear-gradient(135deg, #064e3b, #065f46); border-radius: 16px; padding: 32px; margin: 40px 0; color: white; text-align: center;">
<h3 style="color: #6ee7b7; margin-bottom: 12px;">Đồng hành cùng hành trình 10 năm</h3>
<p style="color: #d1fae5; margin-bottom: 0;">Mỗi cây Dó Đen tại Đại Ngàn Xanh được chăm sóc đúng quy trình, cập nhật định kỳ, và thuộc về bạn — trên giấy tờ lẫn thực tế. Bắt đầu từ 260.000đ/cây.</p>
</div>', NULL, 'published', '2026-03-24 08:00:00+00', NULL, NULL, '{"kỹ thuật trồng","dó đen","trầm hương"}', NULL, NULL, 0, '2026-03-28 07:13:19.506752+00', '2026-03-28 07:24:07.55272+00'),
	('bdb1d645-e0f5-4cb0-a74e-2556925ea917', 'Carbon Credit Từ Rừng Dó Đen — Cơ Hội Đôi Lợi', 'carbon-credit-rung-do-den-co-hoi-doi-loi', 'Năm 2023, Việt Nam bán 10,3 triệu tín chỉ carbon rừng cho Ngân hàng Thế giới và thu về hơn 51 triệu USD. Rừng Dó Đen có thể là cơ hội tiếp theo — cho cả nhà đầu tư lẫn môi trường.', '<p>Năm 2023, một giao dịch tài chính không mấy ồn ào nhưng rất quan trọng xảy ra: Việt Nam bán <strong>10,3 triệu tín chỉ carbon rừng</strong> cho Ngân hàng Thế giới và thu về hơn <strong>51 triệu USD</strong>. Đây là lần đầu tiên Việt Nam thực hiện giao dịch carbon rừng ở quy mô lớn như vậy.</p>

<p>Con số này chỉ là khởi đầu. Theo ước tính, trong giai đoạn 2021–2030, Việt Nam có tiềm năng tạo ra <strong>40–70 triệu tín chỉ carbon</strong> từ rừng — đủ để biến bảo vệ rừng thành một ngành kinh tế, chứ không chỉ là nghĩa vụ môi trường.</p>

<h2>Tín chỉ carbon là gì — và tại sao doanh nghiệp toàn cầu phải mua?</h2>

<p>Tín chỉ carbon (carbon credit) là đơn vị đo lượng CO₂ được hấp thụ hoặc không phát thải vào khí quyển. 1 tín chỉ = 1 tấn CO₂. Các doanh nghiệp phát thải khí nhà kính có thể mua tín chỉ carbon để bù đắp — gọi là "carbon offset".</p>

<p>Nghe có vẻ như một cơ chế giấy tờ. Nhưng hãy nhìn vào quy mô thực tế: năm 2024, nhu cầu tín chỉ carbon tự nguyện toàn cầu đạt <strong>250 triệu tấn CO₂</strong>, trong đó các dự án rừng chiếm gần <strong>50% tổng lượng tín chỉ</strong>. Đầu tư tư nhân vào tài chính rừng đạt gần <strong>9 tỷ USD năm 2024</strong> — mức cao kỷ lục.</p>

<p>Các tập đoàn lớn như Microsoft, Shell, Delta Air Lines đang mua hàng triệu tín chỉ mỗi năm để đạt mục tiêu "net zero". Nhu cầu này sẽ chỉ tăng — không phải vì lòng tốt của doanh nghiệp, mà vì áp lực pháp lý và áp lực từ nhà đầu tư ngày càng lớn.</p>

<h2>Rừng Dó Đen tạo ra tín chỉ carbon như thế nào?</h2>

<p>Cây Dó Đen trưởng thành hấp thụ khoảng <strong>10–15 kg CO₂/năm</strong>. Một khu rừng 1.000 cây tương đương 10–15 tấn CO₂ được hấp thụ mỗi năm — hay 10–15 tín chỉ carbon.</p>

<p>Với dự án trồng rừng quy mô lớn như Đại Ngàn Xanh, tiềm năng này nhân lên đáng kể. Một dự án tái trồng rừng ở Đắk Lắk với quy mô 10.000 ha đang hướng đến mức giảm phát thải <strong>75.000 tấn CO₂/năm</strong>, tạo ra dòng thu từ tín chỉ carbon ước tính <strong>18 tỷ đồng/năm</strong> cho kinh tế địa phương.</p>

<p>Tín chỉ từ dự án tái trồng rừng được định giá cao hơn trung bình: từ <strong>7,89 USD/tín chỉ</strong> (theo dữ liệu REDD+), so với mức chung khoảng 3–5 USD. Lý do: tái trồng rừng tạo ra "carbon additionality" — lượng carbon được hấp thụ thêm mà không có thì đã không tồn tại.</p>

<h2>Lợi ích kép mà ít kênh đầu tư nào có được</h2>

<p>Đây là điều hiếm gặp trong thế giới tài chính: một khoản đầu tư tạo ra <em>hai dòng thu nhập độc lập</em>.</p>

<p><strong>Dòng thu thứ nhất — Trầm hương:</strong> Sau 7–10 năm, cây Dó Đen đủ lớn để cấy tạo trầm. Sản phẩm cuối là gỗ trầm, tinh dầu oud, bột trầm — tất cả có thị trường xuất khẩu rõ ràng với giá tốt. Đây là thu nhập một lần nhưng giá trị lớn.</p>

<p><strong>Dòng thu thứ hai — Tín chỉ carbon:</strong> Trong suốt quá trình cây sinh trưởng (5–10–15 năm), rừng liên tục hấp thụ CO₂ và tạo ra tín chỉ carbon. Đây là thu nhập định kỳ, thụ động — giống như "lãi suất xanh" từ tài sản rừng.</p>

<p>Không nhiều loại hình đầu tư nào có cấu trúc như vậy: tài sản hữu hình (cây), thu nhập dài hạn (tín chỉ carbon) và sản phẩm giá trị cao (trầm hương).</p>

<h2>Thực trạng thị trường carbon ở Việt Nam — và điều sắp thay đổi</h2>

<p>Hiện tại, Việt Nam chưa có sàn giao dịch carbon nội địa. Chính phủ đang xây dựng khung pháp lý để <strong>sàn carbon chính thức hoạt động từ năm 2028</strong>. Các giao dịch hiện tại chủ yếu qua thị trường tự nguyện quốc tế (Verra/VCS, Gold Standard).</p>

<p>Đây thực ra là cơ hội: những dự án xây dựng cơ sở rừng và đăng ký chứng nhận carbon ngay từ bây giờ sẽ có lợi thế đầu tiên khi thị trường nội địa hình thành. Việt Nam đã chứng minh khả năng bán carbon quốc tế — giao dịch 51 triệu USD với Ngân hàng Thế giới năm 2023 là bằng chứng rõ ràng nhất.</p>

<h2>Câu hỏi về đạo đức: Tín chỉ carbon có phải "greenwashing" không?</h2>

<p>Đây là câu hỏi hợp lý. Thị trường carbon tự nguyện đã bị chỉ trích vì một số dự án tạo ra tín chỉ "trên giấy" — không thực sự hấp thụ CO₂, hoặc rừng bị chặt ngay sau khi bán tín chỉ.</p>

<p>Câu trả lời không phải là tránh xa thị trường carbon — mà là đòi hỏi tiêu chuẩn cao hơn. Các dự án được chứng nhận theo Verra (VCS) hoặc Gold Standard phải trải qua quá trình kiểm toán độc lập nghiêm ngặt, đo lường sinh khối thực tế, và giám sát liên tục.</p>

<p>Đại Ngàn Xanh đang chuẩn bị hồ sơ hướng đến chứng nhận quốc tế cho toàn bộ diện tích rừng dự án. Đây không phải cam kết nhẹ — nó đòi hỏi đầu tư vào đo lường, báo cáo và kiểm chứng. Nhưng đó là con đường duy nhất đúng đắn.</p>

<div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 24px; margin: 32px 0;">
<p style="margin: 0; color: #065f46; font-size: 1em;">Rừng không chỉ là tài sản kinh tế. Nó là cơ sở hạ tầng của sự sống — lọc không khí, giữ nước, duy trì đa dạng sinh học. Khi rừng tạo ra doanh thu, người ta có lý do kinh tế để bảo vệ nó. Đó mới là mô hình bền vững thực sự.</p>
</div>

<h2>Bạn có thể tham gia ngay hôm nay</h2>

<p>Bạn không cần phải là tổ chức để đóng góp vào hệ thống này. Mỗi cây Dó Đen bạn trồng cùng Đại Ngàn Xanh:</p>
<ul>
<li>Hấp thụ CO₂ trong suốt vòng đời của cây</li>
<li>Góp phần vào diện tích rừng đủ điều kiện đăng ký carbon credit</li>
<li>Tạo ra giá trị kinh tế dài hạn từ trầm hương</li>
<li>Hỗ trợ cộng đồng nông dân địa phương có thu nhập ổn định</li>
</ul>

<div style="background: linear-gradient(135deg, #064e3b, #065f46); border-radius: 16px; padding: 32px; margin: 40px 0; color: white; text-align: center;">
<h3 style="color: #6ee7b7; margin-bottom: 12px;">Trồng cây. Hấp thụ carbon. Nhận lợi ích kép.</h3>
<p style="color: #d1fae5; margin-bottom: 0;">Bắt đầu từ 260.000đ/cây. Cây của bạn sẽ lớn lên — và thế giới sẽ thở tốt hơn.</p>
</div>', NULL, 'published', '2026-03-26 08:00:00+00', NULL, NULL, '{"carbon credit","đầu tư xanh","môi trường"}', NULL, NULL, 0, '2026-03-28 07:13:19.506752+00', '2026-03-28 07:24:07.779621+00'),
	('53f5cdbc-07b2-420f-b621-1b6c813ba332', 'Cây Dó Đen Việt - Loài Cây Quý Hiếm Mang Giá Trị Bền Vững', 'cay-do-den-viet-loai-cay-quy-hiem-mang-gia-tri-ben-vung', 'Cây Dó Đen Việt (Aquilaria crassna) đang đứng trước nguy cơ tuyệt chủng — nhưng cũng đang mở ra cơ hội đầu tư bền vững hiếm có. Tìm hiểu giá trị thực sự của loài cây quý này và tại sao bảo tồn Dó Đen là hành động quan trọng nhất bạn có thể làm cho rừng Việt Nam.', '<p>Trong kho tàng đa dạng sinh học của Việt Nam, hiếm có loài cây nào mang trong mình sự kết hợp độc đáo giữa giá trị sinh thái, y học cổ truyền, và kinh tế toàn cầu như cây Dó Đen — tên khoa học <em>Aquilaria crassna</em>. Đây không đơn thuần là một loài thực vật quý hiếm trong Sách Đỏ. Đây là biểu tượng của một triết lý sống: khi con người biết chăm sóc và bảo vệ thiên nhiên, thiên nhiên sẽ đáp lại bằng những giá trị vượt thời gian.</p>

<h2>Loài Cây Đang Đứng Trước Ngưỡng Cửa Biến Mất</h2>

<p>Năm 1996, Sách Đỏ Việt Nam chính thức xếp <em>Aquilaria crassna</em> vào nhóm nguy cấp (Category E — Endangered). Không dừng lại ở đó, Danh lục Đỏ IUCN toàn cầu đánh giá loài này là <strong>Critically Endangered</strong> — một bước chỉ còn cách tuyệt chủng trong tự nhiên. Công ước CITES đưa Dó Đen vào Phụ lục II, kiểm soát nghiêm ngặt việc mua bán quốc tế.</p>

<p>Nguyên nhân không khó tìm. Trong nhiều thập kỷ, những người đi rừng biết rằng trong thân cây Dó già ẩn giấu thứ quý giá nhất: trầm hương. Họ khai thác không giới hạn. Rừng nguyên sinh bị tàn phá. Những cây Dó Đen đại thụ hàng trăm tuổi bị đốn hạ chỉ để lấy vài kilogram nhựa trầm bên trong.</p>

<p>Hôm nay, các quần thể Dó Đen hoang dã chỉ còn sót lại rải rác ở một số vùng rừng núi miền Trung — Hà Tĩnh, Quảng Nam, Kon Tum — và vùng giáp biên giới Campuchia và Lào. Mật độ cực thấp, tái sinh tự nhiên khó khăn. Nếu không có hành động kịp thời, loài cây này sẽ chỉ còn trong sách vở.</p>

<h2>Từ Vết Thương Mà Sinh Ra Kỳ Tích: Bí Ẩn Tạo Trầm</h2>

<p>Cây Dó Đen cao từ 30 đến 40 mét, thân thẳng, vỏ xám nhiều xơ, lá bóng mỏng, hoa nhỏ màu trắng tro. Nhìn từ bên ngoài, đây là một cây gỗ bình thường. Nhưng bên trong ẩn chứa một cơ chế sinh học phi thường.</p>

<p>Trầm hương không có sẵn trong gỗ Dó. Nó được tạo ra <em>khi cây bị tổn thương</em>. Khi nấm xâm nhập, sâu đục thân, hoặc cành bị gãy, cây Dó kích hoạt phản ứng tự vệ — tiết ra nhựa thơm chứa các hợp chất sesquiterpen đặc biệt. Nhựa này thấm dần vào các thớ gỗ quanh vết thương, biến gỗ trắng thành khối gỗ sẫm màu nặng trịch, và theo năm tháng trở thành trầm hương — thứ mà người ta gọi là "vàng đen của rừng nhiệt đới".</p>

<p>Điều làm các nhà khoa học kinh ngạc: các hợp chất sesquiterpen tạo nên mùi trầm hương cực kỳ phức tạp về mặt hóa học, đến mức <strong>không có chất tổng hợp nào có thể thay thế</strong> cho trầm hương tự nhiên cấp cao. Đây là lý do tại sao giá trầm không bao giờ giảm, dù công nghệ có tiến bộ đến đâu.</p>

<h2>Giá Trị Không Có Gì Sánh Được</h2>

<p>Giáo sư Gishi Honda từ Đại học Tokyo từng nhận định: trầm hương từ cây Dó ở Việt Nam là một trong những loại trầm hảo hạng nhất trên thế giới, với tỷ lệ tinh dầu cao, cấu trúc vân đẹp và mùi hương độc đáo không lẫn vào đâu được.</p>

<p>Trên thị trường quốc tế, khoảng cách giá là minh chứng rõ ràng nhất:</p>

<ul>
  <li><strong>Trầm hương chế biến thấp cấp:</strong> vài chục USD/kg</li>
  <li><strong>Trầm hương chất lượng cao:</strong> 500 – 7.000 USD/kg</li>
  <li><strong>Trầm loại đặc biệt, lâu năm:</strong> lên đến 30.000 USD/kg</li>
  <li><strong>Tinh dầu trầm hương nguyên chất:</strong> 956 – 7.059 USD/kg</li>
  <li><strong>Kỳ Nam — phẩm chất tối thượng:</strong> có thể đạt 100.000 – 1.000.000 USD/kg ở cấp sưu tầm</li>
</ul>

<p>Thị trường trầm hương toàn cầu được định giá hơn <strong>32 tỷ USD</strong> và dự báo đạt 64 tỷ USD vào năm 2030. Người mua đến từ Trung Đông, Nhật Bản, Trung Quốc, và ngày càng nhiều từ châu Âu và Bắc Mỹ — những nơi ngành nước hoa xa xỉ đang khám phá lại trầm hương như một nguyên liệu định hướng không thể thiếu.</p>

<p>Tuy vậy, Việt Nam — quốc gia có trầm hương được đánh giá là tốt nhất thế giới — chỉ đang chiếm khoảng <strong>0,6% thị phần toàn cầu</strong>. Tiềm năng còn bỏ ngỏ rất lớn.</p>

<h2>Trồng Dó Đen: Không Chỉ Là Kinh Doanh</h2>

<p>Đây là điều mà dự án Đại Ngàn Xanh muốn mọi người hiểu rõ trước khi nghĩ đến lợi nhuận.</p>

<p>Khi một cây Dó Đen được trồng xuống đất — dù ở vùng đồi trọc, đất bạc màu hay vườn nhà — nó không chỉ là khoản đầu tư. Nó là <strong>cam kết phục hồi</strong>. Cây Dó Đen sống tốt trên đất feralit độ pH 4–6, không cần đất màu mỡ. Nó hút carbon, giữ nước, tạo tán che phủ, và dần dần kéo theo cả một hệ sinh thái trở lại.</p>

<p>Theo công nghệ cấy trầm Agar-Wit hiện đại, sau 5 đến 8 năm, cây Dó Đen có thể được kích thích để tạo trầm mà không cần chặt hạ. Cây sống, trầm được thu hoạch theo chu kỳ, và cánh rừng tiếp tục phát triển. Đây là mô hình <em>kinh tế tuần hoàn ứng dụng vào lâm nghiệp</em> — thứ mà cả thế giới đang tìm kiếm.</p>

<p>Ngoài trầm hương, cây Dó Đen còn đóng góp vào <strong>thị trường tín chỉ carbon</strong>. Năm 2023, Việt Nam bán thành công 10,3 triệu tín chỉ carbon rừng cho World Bank với trị giá 51,5 triệu USD. Giai đoạn 2021–2030, tiềm năng tín chỉ carbon từ rừng Việt Nam ước đạt 40–70 triệu tín chỉ. Mỗi cây Dó Đen bạn trồng hôm nay là một phần của dòng giá trị bền vững đó.</p>

<h2>Đại Ngàn Xanh: Trồng Vì Điều Gì?</h2>

<p>Chúng tôi không bắt đầu dự án này vì thấy thị trường trầm hương đang bùng nổ. Chúng tôi bắt đầu vì thấy rừng Việt Nam đang mất đi một loài cây không thể thay thế — và thấy rằng nếu trồng cây là đầu tư sinh lời, sẽ có nhiều người muốn trồng hơn.</p>

<p>Đó là lý do chúng tôi xây dựng mô hình trồng cây Dó Đen theo hướng <strong>cộng đồng hóa</strong>: bất kỳ ai cũng có thể sở hữu một cây Dó Đen, theo dõi sự phát triển của nó qua camera thực địa, và chia sẻ lợi nhuận khi trầm được thu hoạch — trong khi không cần biết gì về lâm nghiệp, không cần đất, không cần làm nông.</p>

<p>Mỗi cây trong vườn của chúng tôi đều được chăm sóc bởi đội ngũ lâm nghiệp chuyên nghiệp. Mỗi cây đều được định danh trên hệ thống. Và mỗi cây đều góp phần vào một mục tiêu lớn hơn: <strong>phục hồi loài Dó Đen Việt trước khi quá muộn</strong>.</p>

<h2>Lời Kêu Gọi: Đừng Để Thế Hệ Sau Chỉ Biết Dó Đen Qua Sách</h2>

<p>Có những khoảnh khắc trong lịch sử mà con người nhìn lại và tự hỏi: <em>Tại sao hồi đó không ai làm gì?</em></p>

<p>Sự biến mất của nhiều loài thực vật quý hiếm — từ gỗ trắc, gỗ huê, đến trầm hương tự nhiên — đã và đang xảy ra trước mắt chúng ta. Không phải vì không ai biết. Mà vì không đủ người hành động.</p>

<p>Khi bạn trồng một cây Dó Đen cùng Đại Ngàn Xanh, bạn đang làm ba điều cùng lúc: <strong>bảo tồn</strong> một loài cây đang đứng trước nguy cơ tuyệt chủng, <strong>đầu tư</strong> vào tài sản có giá trị ngày càng tăng theo thời gian, và <strong>để lại</strong> cho con em một cánh rừng xanh thực sự — không phải chỉ trong lời hứa.</p>

<p>Đó là loại di sản không thể mua bằng tiền. Nhưng có thể bắt đầu bằng một cây.</p>

<div style="background: linear-gradient(135deg, #065f46, #047857); border-radius: 16px; padding: 28px 32px; margin: 40px 0; color: white;">
  <h3 style="color: white; margin-top: 0; font-size: 1.3rem;">Bắt Đầu Hành Trình Của Bạn Với Đại Ngàn Xanh</h3>
  <p style="color: #d1fae5; margin-bottom: 20px;">Sở hữu cây Dó Đen Việt — loài cây quý hiếm mang giá trị kinh tế, sinh thái và văn hóa bền vững. Theo dõi sự phát triển qua camera thực địa. Chia sẻ lợi nhuận từ trầm hương sau 5–8 năm.</p>
  <a href="/pricing" style="display: inline-block; background: white; color: #065f46; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 0.95rem;">Xem Gói Trồng Cây →</a>
</div>', NULL, 'published', '2026-03-25 18:07:03.76+00', NULL, 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '{}', NULL, 'Cây Dó Đen Việt (Aquilaria crassna) — loài cây quý hiếm CITES Phụ lục II, nguồn gốc trầm hương đắt nhất thế giới (30.000 USD/kg). Khám phá giá trị sinh thái, kinh tế và cơ hội đầu tư bền vững từ mô hình trồng Dó Đen của Đại Ngàn Xanh.', 0, '2026-03-25 18:07:03.914617+00', '2026-03-28 07:29:10.974027+00'),
	('c4a0a697-6ec3-4900-9587-ab454c59af3e', 'Trầm Hương Việt Nam — Vàng Đen Của Rừng Nhiệt Đới', 'tram-huong-viet-nam-vang-den-cua-rung-nhiet-doi', 'Giáo sư Gishi Honda tại Đại học Tokyo khẳng định: cây Dó Đen Việt Nam cho ra trầm hương chất lượng cao nhất thế giới. Vậy tại sao Việt Nam chỉ chiếm 0,6% thị trường trầm hương toàn cầu — một thị trường trị giá 32 tỷ USD?', '<p>Có một loài cây mà người ta không trồng để lấy bóng mát, không trồng để lấy quả. Người ta trồng nó vì tin rằng — nếu cây may mắn gặp đúng duyên — bên trong thân gỗ sẽ kết tụ một thứ quý giá đến mức hàng nghìn năm qua, các vị vua chúa Á Đông dùng nó thay tiền cống nạp: <strong>trầm hương</strong>.</p>

<p>Đó là cây Dó Đen — <em>Aquilaria crassna</em> — loài cây bản địa của Việt Nam. Và theo Giáo sư Gishi Honda tại Đại học Tokyo, cây Dó Đen từ đất Việt cho ra trầm hương chất lượng cao nhất thế giới.</p>

<h2>Một thứ không thể làm giả bằng máy móc</h2>

<p>Trầm hương không phải là gỗ thơm thông thường. Nó không có sẵn trong cây, không thể trồng theo quy trình công nghiệp để hái như lúa hay cà phê. Trầm hình thành khi cây Dó bị tổn thương — bởi sét đánh, sâu đục, nấm xâm nhập — và cây tiết ra một loại nhựa phòng vệ. Nhựa ấy ngấm vào gỗ, biến đổi theo năm tháng, tạo ra mùi hương mà không có phòng thí nghiệm nào tổng hợp được đầy đủ.</p>

<p>Đó là lý do trầm hương vẫn đắt dù thế giới đã có ngành hóa chất khổng lồ. Kỳ Nam — loại trầm hảo hạng hiếm nhất — được bán tại Việt Nam với giá từ <strong>100.000 đến 800.000 USD mỗi kg</strong>. Năm 2014, một khối Kỳ Nam được đấu giá tại Trung Quốc với mức <strong>9 triệu USD/kg</strong>. Trầm hương trồng nhân tạo chất lượng trung bình cũng đạt <strong>500–7.000 USD/kg</strong> trên thị trường quốc tế.</p>

<h2>Thị trường 32 tỷ đô và một nghịch lý</h2>

<p>Thị trường trầm hương toàn cầu hiện được định giá <strong>32 tỷ USD</strong>, dự kiến tăng gấp đôi lên <strong>64 tỷ USD vào năm 2029</strong>. Trung Đông chiếm 50% nhu cầu tiêu thụ — nước hoa oud là thứ không thể thiếu trong văn hóa của họ. Nhật Bản, Trung Quốc, Đài Loan, Hàn Quốc mua trầm cho y học cổ truyền và nghi lễ tâm linh.</p>

<p>Còn Việt Nam — quốc gia có vùng nguyên liệu tốt nhất thế giới — chỉ đang chiếm <strong>0,6% kim ngạch xuất khẩu trầm hương toàn cầu</strong>. Xếp thứ 24.</p>

<p>Đây không phải nghịch lý ngẫu nhiên. Nó phản ánh một thực tế: rừng Dó Đen tự nhiên của Việt Nam đã bị khai thác cạn kiệt. Loài <em>Aquilaria crassna</em> hiện nằm trong <strong>Phụ lục II của Công ước CITES</strong> — danh sách các loài đang đứng trước nguy cơ tuyệt chủng. Khai thác không kiểm soát và buôn bán lậu đã đẩy loài cây này đến gần điểm không thể phục hồi trong tự nhiên.</p>

<h2>Vết thương của cây — và bài học về giá trị</h2>

<p>Điều nghịch lý nhất về trầm hương: <em>cây phải bị thương mới cho ra thứ quý nhất</em>. Trong vết thương, cây tiết nhựa để tự bảo vệ. Nhựa ấy theo thời gian — nhiều năm, đôi khi nhiều thập kỷ — kết tinh thành trầm.</p>

<p>Người trồng cây hiện đại học từ thiên nhiên, nhưng rút ngắn thời gian. Kỹ thuật cấy tạo trầm nhân tạo — đưa nấm hoặc chất kích thích sinh học vào thân cây qua những lỗ khoan nhỏ — có thể kích thích quá trình tạo nhựa trong vòng <strong>6–18 tháng</strong>. Cả chu kỳ từ trồng cây đến thu hoạch trầm đầu tiên: <strong>7–10 năm</strong>.</p>

<p>Với một nông sản có giá trị như vậy, đó không phải là thời gian dài — đó là khoảng thời gian cần thiết để xây dựng thứ gì đó có giá trị thực sự.</p>

<h2>Lý do Việt Nam cần làm khác đi</h2>

<p>Không thể tiếp tục khai thác trầm tự nhiên. Không thể để 0,6% thị phần mãi là mức trần. Việt Nam cần những dự án trồng Dó Đen có trách nhiệm — nơi người trồng không phải là những người đào lấy tài nguyên, mà là những người <em>tạo ra</em> tài nguyên.</p>

<p>Đó là lý do dự án Đại Ngàn Xanh tồn tại. Chúng tôi không khai thác rừng. Chúng tôi trồng rừng — từng cây một, với sự giám sát kỹ thuật nghiêm ngặt, và minh bạch với từng người đồng hành cùng dự án.</p>

<p>Mỗi cây bạn trồng là một phần nhỏ trong hành trình đưa Việt Nam trở lại đúng vị trí xứng đáng: không phải là nơi cung cấp nguyên liệu thô, mà là <em>thủ phủ trầm hương bền vững của thế giới</em>.</p>

<div style="background: linear-gradient(135deg, #064e3b, #065f46); border-radius: 16px; padding: 32px; margin: 40px 0; color: white;">
<h3 style="color: #6ee7b7; margin-bottom: 12px;">Bắt đầu hành trình của bạn</h3>
<p style="color: #d1fae5; margin-bottom: 20px;">Mỗi cây Dó Đen bạn trồng hôm nay là một tài sản thực — được chăm sóc bởi đội ngũ kỹ thuật, cập nhật ảnh định kỳ, minh bạch từng giai đoạn. Không cần phải là tỷ phú để bắt đầu.</p>
<p style="color: #6ee7b7; font-weight: 600;">Chỉ 260.000đ/cây — và bạn là một phần của điều lớn hơn chính mình.</p>
</div>
', NULL, 'published', '2026-03-20 08:00:00+00', NULL, NULL, '{"trầm hương","dó đen","đầu tư"}', NULL, NULL, 0, '2026-03-28 07:13:19.506752+00', '2026-03-28 07:20:44.016661+00');


--
-- Data for Name: print_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: referral_clicks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."referral_clicks" ("id", "referrer_id", "ip_hash", "user_agent", "converted", "order_id", "created_at") VALUES
	('3c8dd28c-7f30-4b2a-b2b5-5697aec8e6cc', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', 'Mozilla/5.0 (Automated Test)', false, NULL, '2026-01-13 23:34:24.112908+00'),
	('f42e474b-91fb-4a6f-a3e3-de01d885ece2', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2a39f1eedcd9f986327b5e4da842426f4f05b8f16f0ef385639dbec0db70eaae', 'Mozilla/5.0 (Automated Test)', true, NULL, '2026-01-13 23:35:20.283311+00');


--
-- Data for Name: replacement_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."system_config" ("id", "key", "value", "updated_by", "updated_at") VALUES
	('ce3a0dd7-f4a0-49c3-876f-690aeda8628e', 'site_name', '"\"Đại Ngàn Xanh Updated\""', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-01-14 22:37:10.570725+00'),
	('3fde7284-a078-40ef-abf4-3437a2d0a2f1', 'support_email', '"\"support@dainganxanh.com\""', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-01-14 22:37:10.705245+00'),
	('a320675c-73df-465a-9124-b2e05e77f1bf', 'currency', '"\"VND\""', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-01-14 22:37:10.850173+00'),
	('0834ba6b-bf28-4b14-a819-eda3e563f6e4', 'timezone', '"\"Asia/Ho_Chi_Minh\""', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-01-14 22:37:10.967497+00'),
	('276b33ef-15ae-44ec-83a6-242f7d774f6f', 'date_format', '"\"DD/MM/YYYY\""', 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed', '2026-01-14 22:37:11.07943+00');


--
-- Data for Name: tree_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tree_photos" ("id", "lot_id", "photo_url", "caption", "taken_at", "uploaded_at", "gps_lat", "gps_lng", "gps_accuracy", "tree_id") VALUES
	('a0bde15e-a203-48d7-b3a0-0392764811ad', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', 'Test photo - 2026-01-11 02:17:45.326374+00', NULL, '2026-01-11 02:17:45.326374+00', NULL, NULL, NULL, NULL),
	('4a4f3c45-2b55-43a1-863b-16df3d7d269f', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', 'Final trigger 2026-01-11 02:23:43.590929+00', NULL, '2026-01-11 02:23:43.590929+00', NULL, NULL, NULL, NULL),
	('53a84ffe-6126-48b2-a096-aa9fcbb422e5', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', 'Ảnh test notification system - Cây đang phát triển tốt!', '2026-01-11 02:34:02.1135+00', '2026-01-11 02:34:02.1135+00', NULL, NULL, NULL, NULL),
	('68e2519e-8fef-4ed2-8490-d0dab96902f7', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', 'Ảnh test notification system - Cây đang phát triển tốt!', '2026-01-11 02:35:06.559211+00', '2026-01-11 02:35:06.559211+00', NULL, NULL, NULL, NULL),
	('1b67af49-1bc0-418b-9193-d750511a5c62', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', 'Ảnh test notification system - Cây đang phát triển tốt!', '2026-01-11 02:37:45.114611+00', '2026-01-11 02:37:45.114611+00', NULL, NULL, NULL, NULL),
	('9719aca8-54dd-49ec-8537-d6cbca200ec0', '11111111-1111-1111-1111-111111111111', 'https://test.com/photo.jpg', 'Manual Trigger Test', NULL, '2026-01-11 02:50:36.38761+00', NULL, NULL, NULL, NULL);


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('contracts', 'contracts', NULL, '2026-01-10 20:18:24.053622+00', '2026-01-10 20:18:24.053622+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('withdrawals', 'withdrawals', NULL, '2026-01-14 11:59:29.218699+00', '2026-01-14 11:59:29.218699+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('blog-images', 'blog-images', NULL, '2026-03-25 17:56:47.589222+00', '2026-03-25 17:56:47.589222+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('9548ee2b-60a3-4832-92b4-64cd054bfdef', 'contracts', 'fonts/Roboto-Regular.woff', NULL, '2026-01-10 20:59:15.284595+00', '2026-01-10 20:59:15.284595+00', '2026-01-10 20:59:15.284595+00', '{"eTag": "\"6682819fda00e848251a825c1f7da2dd\"", "size": 66580, "mimetype": "font/woff", "cacheControl": "max-age=3600", "lastModified": "2026-01-10T20:59:16.000Z", "contentLength": 66580, "httpStatusCode": 200}', 'c474d62c-b3f4-4391-af06-c44723636c04', NULL, '{}'),
	('c8838797-310e-4803-a024-bf3aa01beb7f', 'contracts', 'fonts/Roboto-Bold.woff', NULL, '2026-01-10 20:59:23.533639+00', '2026-01-10 20:59:23.533639+00', '2026-01-10 20:59:23.533639+00', '{"eTag": "\"0b250445e84109a426bdeab8af55ebcd\"", "size": 68104, "mimetype": "font/woff", "cacheControl": "max-age=3600", "lastModified": "2026-01-10T20:59:24.000Z", "contentLength": 68104, "httpStatusCode": 200}', '293bee88-153d-4d77-9be4-d9245cd326af', NULL, '{}'),
	('9c9c7b4b-c01b-4cf9-bf66-99a3bd42157a', 'contracts', 'VERIFY-SINGLE-1768079206684.pdf', NULL, '2026-01-10 21:06:46.978931+00', '2026-01-10 21:06:46.978931+00', '2026-01-10 21:06:46.978931+00', '{"eTag": "\"14e1ccb55da1264a93f236b07b733f95\"", "size": 75810, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-10T21:06:47.000Z", "contentLength": 75810, "httpStatusCode": 200}', '0e3ae743-8faa-4953-bd81-2452ebcef484', NULL, '{}'),
	('480acb28-edef-40c7-8a33-30dbc0f53ef4', 'contracts', 'fonts/Untitled folder/.emptyFolderPlaceholder', NULL, '2026-01-10 21:43:35.571771+00', '2026-01-10 21:43:35.571771+00', '2026-01-10 21:43:35.571771+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-01-10T21:43:35.570Z", "contentLength": 0, "httpStatusCode": 200}', '20d4c857-fe9f-4d36-a122-b7ed05091f4f', NULL, '{}'),
	('1dc048de-f24c-4109-a7c1-b7b2c681dc97', 'contracts', 'DHJJKSEB-1768088488963.pdf', NULL, '2026-01-10 23:41:29.372106+00', '2026-01-10 23:41:29.372106+00', '2026-01-10 23:41:29.372106+00', '{"eTag": "\"dda5a6f8347d5067554d7998f764be19\"", "size": 2258, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-10T23:41:30.000Z", "contentLength": 2258, "httpStatusCode": 200}', 'c32e3311-278a-4060-a435-585279d7a8e6', NULL, '{}'),
	('92533c5c-4c01-4b48-9918-2005efa67a5d', 'contracts', 'DHY3L7YE-1768090167893.pdf', NULL, '2026-01-11 00:09:28.334351+00', '2026-01-11 00:09:28.334351+00', '2026-01-11 00:09:28.334351+00', '{"eTag": "\"999655d6137a052a7c810112aa3de020\"", "size": 2257, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T00:09:29.000Z", "contentLength": 2257, "httpStatusCode": 200}', '9b084bfc-4e5f-4098-bed9-39de1f10d0af', NULL, '{}'),
	('c0dced33-e411-4564-a266-288689053b55', 'contracts', 'DHDNW7T5-1768091619897.pdf', NULL, '2026-01-11 00:33:40.219868+00', '2026-01-11 00:33:40.219868+00', '2026-01-11 00:33:40.219868+00', '{"eTag": "\"aa1471448651c59dbe3c5c074d5e116b\"", "size": 2257, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T00:33:41.000Z", "contentLength": 2257, "httpStatusCode": 200}', 'e286179f-a7d2-40c0-a0fe-82610f1c1d67', NULL, '{}'),
	('c226af07-307c-47b2-a591-148f0d2e1894', 'contracts', 'DH69OP5C-1768119770694.pdf', NULL, '2026-01-11 08:22:50.973588+00', '2026-01-11 08:22:50.973588+00', '2026-01-11 08:22:50.973588+00', '{"eTag": "\"5d826e0cd66e2b0ad476ae6dd70472da\"", "size": 5612, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T08:22:51.000Z", "contentLength": 5612, "httpStatusCode": 200}', '63744523-e34d-43a2-8cdb-35b5be424f7c', NULL, '{}'),
	('f3c8ca39-d0c7-489a-88a8-ebfd4ba176e9', 'contracts', 'DHLBDRWF-1768122701073.pdf', NULL, '2026-01-11 09:11:41.329318+00', '2026-01-11 09:11:41.329318+00', '2026-01-11 09:11:41.329318+00', '{"eTag": "\"efd23e636864fecdfe7912bad47d610f\"", "size": 2256, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T09:11:42.000Z", "contentLength": 2256, "httpStatusCode": 200}', 'd2d269cd-be0b-4e03-9f1c-ce05e9497525', NULL, '{}'),
	('cabd3db0-8ebb-4aea-bdaf-651533edca2d', 'contracts', 'DHPEANJK-1768139225757.pdf', NULL, '2026-01-11 13:47:06.076809+00', '2026-01-11 13:47:06.076809+00', '2026-01-11 13:47:06.076809+00', '{"eTag": "\"c07dec98e387cc28c6db41f602ef6f1c\"", "size": 2256, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T13:47:07.000Z", "contentLength": 2256, "httpStatusCode": 200}', '5c9e50cf-9939-44df-ad86-a6cbae11c17b', NULL, '{}'),
	('50964b5b-efc6-4148-9f3c-d234e66ea3c7', 'contracts', 'DH-TEST-001-1768283985412.pdf', NULL, '2026-01-13 05:59:45.667202+00', '2026-01-13 05:59:45.667202+00', '2026-01-13 05:59:45.667202+00', '{"eTag": "\"88d292de742ee1c069ac58d546e2bc49\"", "size": 2056, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-13T05:59:46.000Z", "contentLength": 2056, "httpStatusCode": 200}', '9dadd469-b66a-4bd9-a4de-1ce2ec2d27bd', NULL, '{}'),
	('9819bc88-0b8f-4512-88fe-3ede42b6d74a', 'contracts', 'DH-DEBUG-001-1768284244006.pdf', NULL, '2026-01-13 06:04:04.293784+00', '2026-01-13 06:04:04.293784+00', '2026-01-13 06:04:04.293784+00', '{"eTag": "\"480cc2d39860ecfceda0d0f27d3562b9\"", "size": 2032, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-13T06:04:05.000Z", "contentLength": 2032, "httpStatusCode": 200}', '94fa023c-acd0-4c8e-813f-058d31585ced', NULL, '{}'),
	('51bce7cb-d6cb-4c9f-b9db-ff115ef0ed12', 'contracts', 'DH-E2E-FINAL-001-1768284565539.pdf', NULL, '2026-01-13 06:09:25.73547+00', '2026-01-13 06:09:25.73547+00', '2026-01-13 06:09:25.73547+00', '{"eTag": "\"b6f48a574e464df8aa19447317c1e368\"", "size": 2077, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-13T06:09:26.000Z", "contentLength": 2077, "httpStatusCode": 200}', 'afa56c4a-d8f6-47ce-8f27-00886a9e423f', NULL, '{}'),
	('e5e1fd95-d783-476b-b17a-954612ad806a', 'contracts', 'DH-REVIEW-001-1768284968625.pdf', NULL, '2026-01-13 06:16:09.092563+00', '2026-01-13 06:16:09.092563+00', '2026-01-13 06:16:09.092563+00', '{"eTag": "\"effb9a18cfeff3c0a37d5e2049cd3064\"", "size": 2093, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-13T06:16:10.000Z", "contentLength": 2093, "httpStatusCode": 200}', '57ab98a5-ca47-4c41-82c7-58ba21c2a63d', NULL, '{}'),
	('7bbe8224-eedd-4498-af86-d7a185951525', 'contracts', 'DHQI7AUJ-1768346221019.pdf', NULL, '2026-01-13 23:17:01.272596+00', '2026-01-13 23:17:01.272596+00', '2026-01-13 23:17:01.272596+00', '{"eTag": "\"09bb4928a9698446d90dd5b25aa2c171\"", "size": 2050, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-13T23:17:02.000Z", "contentLength": 2050, "httpStatusCode": 200}', '8a8e1978-0fec-4497-baba-979c6ec87684', NULL, '{}'),
	('322811e0-5d85-44c6-8e29-5375a14db1a8', 'contracts', 'DH4XBI02-1768349712113.pdf', NULL, '2026-01-14 00:15:12.528071+00', '2026-01-14 00:15:12.528071+00', '2026-01-14 00:15:12.528071+00', '{"eTag": "\"e24eec7f6088a72c965d50353438c13f\"", "size": 2303, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-14T00:15:13.000Z", "contentLength": 2303, "httpStatusCode": 200}', 'e530b20f-3491-40dd-b95a-f4f499934072', NULL, '{}'),
	('c77cf2a3-59db-4b5d-8ba9-7974354f4afd', 'contracts', 'DHU7PZYQ-1768350190213.pdf', NULL, '2026-01-14 00:23:10.78724+00', '2026-01-14 00:23:10.78724+00', '2026-01-14 00:23:10.78724+00', '{"eTag": "\"ea24653511418d287162eb270c65a967\"", "size": 2298, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-14T00:23:11.000Z", "contentLength": 2298, "httpStatusCode": 200}', '659fe3eb-7d1c-4694-a446-abc0f6d06b39', NULL, '{}'),
	('2923df62-c1ba-4efa-bd71-8d65b7a96c5e', 'contracts', 'DHZU5AZ7-1768351589609.pdf', NULL, '2026-01-14 00:46:29.850641+00', '2026-01-14 00:46:29.850641+00', '2026-01-14 00:46:29.850641+00', '{"eTag": "\"c8195b9fe6f06e08e3061f7c0c68ec14\"", "size": 2303, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-14T00:46:30.000Z", "contentLength": 2303, "httpStatusCode": 200}', 'f009ab0d-5678-4250-8e3e-67f6b255a292', NULL, '{}'),
	('3b26ca28-a7ae-487c-8003-4c7c36e6e3f9', 'contracts', 'DHWX1J8D-1768395727654.pdf', NULL, '2026-01-14 13:02:08.026355+00', '2026-01-14 13:02:08.026355+00', '2026-01-14 13:02:08.026355+00', '{"eTag": "\"164004ce07f546160d157a045af5be76\"", "size": 2305, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-14T13:02:08.000Z", "contentLength": 2305, "httpStatusCode": 200}', 'f061879d-d7a7-46e7-b07d-e56c28ef108d', NULL, '{}'),
	('431ebfc6-c745-4f1f-ab6a-4883d508296a', 'contracts', 'DHCNXN2C-1769064875227.pdf', NULL, '2026-01-22 06:54:35.541647+00', '2026-01-22 06:54:35.541647+00', '2026-01-22 06:54:35.541647+00', '{"eTag": "\"28858612ef9d8a72cc515a352b56754f\"", "size": 28189, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T06:54:36.000Z", "contentLength": 28189, "httpStatusCode": 200}', '128d572c-cb3b-443f-a51a-1496d96d89db', NULL, '{}'),
	('9d757e0b-62d9-4009-a8f5-4dc50be8184a', 'contracts', 'DH7SM6EW-1770441103002.pdf', NULL, '2026-02-07 05:11:43.233284+00', '2026-02-07 05:11:43.233284+00', '2026-02-07 05:11:43.233284+00', '{"eTag": "\"45d826b8ce4bbe0f92c8d446be31ff3c\"", "size": 2298, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-02-07T05:11:44.000Z", "contentLength": 2298, "httpStatusCode": 200}', '586ab39b-c6a9-4b85-bd57-de9a23d45265', NULL, '{}'),
	('59c3e860-e786-4b88-8ede-077cd8371dd2', 'contracts', 'DH6TPN8T-1770528147218.pdf', NULL, '2026-02-08 05:22:27.451563+00', '2026-02-08 05:22:27.451563+00', '2026-02-08 05:22:27.451563+00', '{"eTag": "\"d21b5762b581743c68080edb9e2cb2e5\"", "size": 2299, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-02-08T05:22:28.000Z", "contentLength": 2299, "httpStatusCode": 200}', '46213673-9850-4ca5-9be8-ccfb1c107564', NULL, '{}'),
	('9f25d1de-a47a-4f09-b64a-5de12143828e', 'contracts', 'DHPRBZ4F-1772891929927.pdf', NULL, '2026-03-07 13:58:50.027322+00', '2026-03-07 13:58:50.027322+00', '2026-03-07 13:58:50.027322+00', '{"eTag": "\"2d0f8612f64d3b7035d6e82393303ac2\"", "size": 2297, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-07T13:58:51.000Z", "contentLength": 2297, "httpStatusCode": 200}', 'e5b71e01-d651-422b-b2fa-adc9255ace73', NULL, '{}'),
	('282b75aa-1c59-4517-ac81-f4aeac0a8983', 'contracts', 'DHQJ6XKO-1773284135254.pdf', NULL, '2026-03-12 02:55:35.460876+00', '2026-03-12 02:55:35.460876+00', '2026-03-12 02:55:35.460876+00', '{"eTag": "\"2f0efe13056f1049d1e4e16852a1a941\"", "size": 2305, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-12T02:55:36.000Z", "contentLength": 2305, "httpStatusCode": 200}', '2e3f5a9f-e638-4886-9c10-217e3a722945', NULL, '{}'),
	('14e86025-b3f0-4ce3-b289-1018caafa564', 'contracts', 'DHI16S6R-1773287747089.pdf', NULL, '2026-03-12 03:55:47.319185+00', '2026-03-12 03:55:47.319185+00', '2026-03-12 03:55:47.319185+00', '{"eTag": "\"6a120fa033bd2dd3bf1af560fc346d0d\"", "size": 2102, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-12T03:55:48.000Z", "contentLength": 2102, "httpStatusCode": 200}', 'fabe98e9-e7fc-4837-98de-2167b2cd75a8', NULL, '{}'),
	('8114ab55-7d8d-4c2e-bd76-cfae145887ff', 'contracts', 'DH57I0KD-1773287923863.pdf', NULL, '2026-03-12 03:58:43.99392+00', '2026-03-12 03:58:43.99392+00', '2026-03-12 03:58:43.99392+00', '{"eTag": "\"9c0bb906d28c0e1456c574214c909ab1\"", "size": 4710, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-12T03:58:44.000Z", "contentLength": 4710, "httpStatusCode": 200}', 'e1c92f37-32af-4fa0-aaf1-666293b07d94', NULL, '{}'),
	('56c3d1d4-eb78-4f42-8642-76dd0fd0b640', 'contracts', 'DHS742J0-1773397936889.pdf', NULL, '2026-03-13 10:32:17.070844+00', '2026-03-13 10:32:17.070844+00', '2026-03-13 10:32:17.070844+00', '{"eTag": "\"246e5a6da7af57bd4b804e428b9b744b\"", "size": 2300, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-13T10:32:18.000Z", "contentLength": 2300, "httpStatusCode": 200}', '3917928b-9365-4d5f-9c2a-615d88bbb394', NULL, '{}'),
	('13b4bd0b-fbeb-46bd-9c2b-2b821c7a6a31', 'contracts', 'DH976IYD-1773501603825.pdf', NULL, '2026-03-14 15:20:04.085868+00', '2026-03-14 15:20:04.085868+00', '2026-03-14 15:20:04.085868+00', '{"eTag": "\"3ed6aa8e468d01e9ea66c7be0e24fb04\"", "size": 2077, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-14T15:20:05.000Z", "contentLength": 2077, "httpStatusCode": 200}', '8f40dce9-d1e0-48a1-99aa-41962eb52a64', NULL, '{}'),
	('8b7c8437-96c8-47dd-9188-d72aa3144e2d', 'contracts', 'DHHV5BQ2-1773501732836.pdf', NULL, '2026-03-14 15:22:12.980361+00', '2026-03-14 15:22:12.980361+00', '2026-03-14 15:22:12.980361+00', '{"eTag": "\"1e04633031207e0531e2a3d25d490326\"", "size": 2161, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-14T15:22:13.000Z", "contentLength": 2161, "httpStatusCode": 200}', '8ec5b57b-1fb2-4284-a2d3-3f9a4ff17ab7', NULL, '{}'),
	('e6023f8f-616a-4629-9a8c-5143d371fa37', 'contracts', 'DHE6MDDH-1774342474741.pdf', NULL, '2026-03-24 08:54:35.035129+00', '2026-03-24 08:54:35.035129+00', '2026-03-24 08:54:35.035129+00', '{"eTag": "\"ed007dfcd3e316e542145369f41e23d7\"", "size": 2159, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-24T08:54:35.000Z", "contentLength": 2159, "httpStatusCode": 200}', 'dffc0e5c-bbfd-4525-8889-15f4149c03dd', NULL, '{}'),
	('299ef566-d5bf-43f3-8cfe-02e9fedcc99e', 'contracts', 'DHYQ4OK1-1774454305906.pdf', NULL, '2026-03-25 15:58:26.949901+00', '2026-03-25 15:58:26.949901+00', '2026-03-25 15:58:26.949901+00', '{"eTag": "\"09c46b79bafe352fd30dbdd373201924\"", "size": 3394, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T15:58:27.000Z", "contentLength": 3394, "httpStatusCode": 200}', 'dfa43be4-eded-45e3-b09c-c143b25a70d4', NULL, '{}'),
	('5a06ee23-29d3-48f5-bcce-8bc4bfcf68a5', 'contracts', 'DHY0MJBQ-1774709188021.pdf', NULL, '2026-03-28 14:46:28.203411+00', '2026-03-28 14:46:28.203411+00', '2026-03-28 14:46:28.203411+00', '{"eTag": "\"4e98109f9b6358333165d6f62dcb1e3c\"", "size": 2051, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-28T14:46:29.000Z", "contentLength": 2051, "httpStatusCode": 200}', '9555b476-c442-45ea-85d1-d6bc9e7a9b04', NULL, '{}'),
	('45c1d08b-52f1-40cd-95e6-fdb041803cf3', 'contracts', 'DH1ZZTHM-1774709548434.pdf', NULL, '2026-03-28 14:52:28.574615+00', '2026-03-28 14:52:28.574615+00', '2026-03-28 14:52:28.574615+00', '{"eTag": "\"85b8ecd9cb4f194fb52e9378b2103b45\"", "size": 2056, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-28T14:52:29.000Z", "contentLength": 2056, "httpStatusCode": 200}', 'd0800c23-f919-43e7-a672-1b44c61382f4', NULL, '{}');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

INSERT INTO "supabase_functions"."hooks" ("id", "hook_table_id", "hook_name", "created_at", "request_id") VALUES
	(1, 17750, 'tree-photo-notification', '2026-01-11 02:17:45.326374+00', 1),
	(2, 17750, 'tree-photo-notification', '2026-01-11 02:23:43.590929+00', 2),
	(3, 17750, 'tree-photo-notification', '2026-01-11 02:34:02.1135+00', 3),
	(4, 17750, 'tree-photo-notification', '2026-01-11 02:35:06.559211+00', 4),
	(5, 17750, 'tree-photo-notification', '2026-01-11 02:37:45.114611+00', 5),
	(6, 17750, 'tree-photo-notification', '2026-01-11 02:50:36.38761+00', 6);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 230, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 6, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 6zvB3oOpNzbH4AVaJfhBOP2cwuoOIzcE4gDwcd9aQB0zGHzyl6Qyd1ZL3XcCDKM

RESET ALL;
